const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/payment.service');
const loyaltyService = require('../services/loyalty.service');
const { createNotification } = require('../services/notification.service');

const createPaymentOrder = asyncHandler(async (req, res) => {
  const { amount, order_id } = req.body;

  if (!amount || amount <= 0) {
    return ApiResponse.error(res, 'Invalid amount.', 400);
  }

  if (!order_id) {
    return ApiResponse.error(res, 'Order ID is required.', 400);
  }

  const [orders] = await pool.query(
    'SELECT id, order_number, total_amount, payment_status FROM orders WHERE id = ? AND user_id = ?',
    [order_id, req.user.id]
  );

  if (orders.length === 0) {
    return ApiResponse.error(res, 'Order not found.', 404);
  }

  if (orders[0].payment_status === 'paid') {
    return ApiResponse.error(res, 'Order already paid.', 400);
  }

  const result = await paymentService.createOrder(amount, 'INR', orders[0].order_number);

  if (!result.success) {
    return ApiResponse.error(res, 'Failed to create payment order.', 500);
  }

  await pool.query(
    'UPDATE orders SET razorpay_order_id = ? WHERE id = ?',
    [result.id, order_id]
  );

  return ApiResponse.success(res, {
    razorpay_order_id: result.id,
    amount: result.amount,
    currency: result.currency,
    key_id: process.env.RAZORPAY_KEY_ID,
    order_number: orders[0].order_number
  }, 'Payment order created.');
});

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

  const isValid = paymentService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid.success) {
    await pool.query(
      'UPDATE orders SET payment_status = ? WHERE id = ?',
      ['failed', order_id]
    );

    // Create payment failed notification
    const [failedOrder] = await pool.query('SELECT order_number FROM orders WHERE id = ?', [order_id]);
    const failedOrderNumber = failedOrder[0]?.order_number || 'N/A';
    await createNotification(
      req.user.id,
      'payment_failed',
      `Payment failed for Order #${failedOrderNumber}`,
      'Your payment was not successful. Please try again or choose a different payment method.',
      { order_id, order_number: failedOrderNumber }
    );

    return ApiResponse.error(res, 'Payment verification failed.', 400);
  }

  await pool.query(
    'UPDATE orders SET payment_status = ?, payment_method = ?, razorpay_payment_id = ?, status = ? WHERE id = ?',
    ['paid', 'online', razorpay_payment_id, 'confirmed', order_id]
  );

  // Payment verified — now safe to clear the cart (was kept for online retry).
  const [paidCart] = await pool.query(
    'SELECT id FROM cart WHERE user_id = ?',
    [req.user.id]
  );
  if (paidCart.length > 0) {
    await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [paidCart[0].id]);
    await pool.query('UPDATE cart SET coupon_code = NULL, coupon_discount = 0 WHERE id = ?', [paidCart[0].id]);
  }

  await pool.query(
    'INSERT INTO order_tracking (order_id, status, message) VALUES (?, ?, ?)',
    [order_id, 'confirmed', 'Payment received. Order confirmed.']
  );

  // Create payment received notification
  const [paidOrder] = await pool.query('SELECT order_number, total_amount FROM orders WHERE id = ?', [order_id]);
  const paidOrderNumber = paidOrder[0]?.order_number || 'N/A';
  const paidAmount = paidOrder[0]?.total_amount || 0;
  await createNotification(
    req.user.id,
    'payment_received',
    `Payment received for Order #${paidOrderNumber}`,
    `Your payment of ₹${Number(paidAmount).toLocaleString('en-IN')} has been received. Order is confirmed!`,
    { order_id, order_number: paidOrderNumber, amount: paidAmount }
  );

  const [order] = await pool.query('SELECT total_amount FROM orders WHERE id = ?', [order_id]);
  if (order.length > 0) {
    await loyaltyService.addPoints(
      req.user.id,
      order[0].total_amount,
      `Points from order payment`
    );
  }

  return ApiResponse.success(res, {
    razorpay_payment_id,
    order_id
  }, 'Payment verified successfully.');
});

const codConfirm = asyncHandler(async (req, res) => {
  const { order_id } = req.body;

  const [orders] = await pool.query(
    "SELECT id FROM orders WHERE id = ? AND user_id = ? AND payment_method = 'cod' AND payment_status = 'pending'",
    [order_id, req.user.id]
  );

  if (orders.length === 0) {
    return ApiResponse.error(res, 'Order not found or already paid.', 404);
  }

  await pool.query(
    "UPDATE orders SET status = 'confirmed' WHERE id = ?",
    [order_id]
  );

  await pool.query(
    'INSERT INTO order_tracking (order_id, status, message) VALUES (?, ?, ?)',
    [order_id, 'confirmed', 'COD order confirmed.']
  );

  return ApiResponse.success(res, {}, 'COD order confirmed.');
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
  codConfirm
};
