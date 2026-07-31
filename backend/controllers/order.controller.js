const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { v4: uuidv4 } = require('uuid');
const loyaltyService = require('../services/loyalty.service');
const { sendEmail, sendOrderConfirmation } = require('../services/email.service');
const { createNotification } = require('../services/notification.service');

const generateOrderNumber = () => {
  const prefix = 'KB';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const createOrder = asyncHandler(async (req, res) => {
  const { address_id, payment_method, notes } = req.body;

  const [cart] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [req.user.id]);
  if (!cart || cart.length === 0) {
    return ApiResponse.error(res, 'Cart not found.', 404);
  }

  const [items] = await pool.query(
    `SELECT ci.*, p.name, p.price, p.mrp, p.stock_quantity, 
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [cart[0].id]
  );

  if (items.length === 0) {
    return ApiResponse.error(res, 'Cart is empty.', 400);
  }

  for (const item of items) {
    if (item.quantity > item.stock_quantity) {
      return ApiResponse.error(res, `${item.name} has only ${item.stock_quantity} items in stock.`, 400);
    }
  }

  const [addresses] = await pool.query(
    'SELECT * FROM addresses WHERE id = ? AND user_id = ?',
    [address_id, req.user.id]
  );

  if (addresses.length === 0) {
    return ApiResponse.error(res, 'Address not found.', 404);
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCharge = subtotal >= 499 ? 0 : 49;
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const couponDiscount = cart[0].coupon_discount || 0;
  const totalAmount = Math.round(Math.max((subtotal - couponDiscount + shippingCharge + taxAmount), 0) * 100) / 100;

  const orderNumber = generateOrderNumber();

  const [orderResult] = await pool.query(
    `INSERT INTO orders (order_number, user_id, address_id, status, subtotal, discount_amount, coupon_code, coupon_discount, shipping_charge, tax_amount, total_amount, payment_method, payment_status, notes, estimated_delivery)
     VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 5 DAY))`,
    [orderNumber, req.user.id, address_id, subtotal, couponDiscount, cart[0].coupon_code, couponDiscount, shippingCharge, taxAmount, totalAmount, payment_method, notes || null]
  );

  const orderId = orderResult.insertId;

  for (const item of items) {
    await pool.query(
      `INSERT INTO order_items (order_id, product_id, product_name, product_image, variant_info, quantity, unit_price, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [orderId, item.product_id, item.name, item.image, null, item.quantity, item.price, item.price * item.quantity]
    );

    await pool.query(
      'UPDATE products SET stock_quantity = stock_quantity - ?, total_sold = total_sold + ? WHERE id = ?',
      [item.quantity, item.quantity, item.product_id]
    );
  }

  await pool.query(
    'INSERT INTO order_tracking (order_id, status, message) VALUES (?, ?, ?)',
    [orderId, 'pending', 'Order placed successfully.']
  );

  await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart[0].id]);
  await pool.query('UPDATE cart SET coupon_code = NULL, coupon_discount = 0 WHERE id = ?', [cart[0].id]);

  if (payment_method === 'cod') {
    await loyaltyService.addPoints(req.user.id, totalAmount, `Points from order ${orderNumber}`);
  }

  // Create order confirmation notification
  await createNotification(
    req.user.id,
    'order_confirmed',
    `Order #${orderNumber} placed successfully!`,
    `Your order of ₹${Number(totalAmount).toLocaleString('en-IN')} has been placed and is being processed.`,
    { order_id: orderId, order_number: orderNumber, total_amount: totalAmount }
  );

  // Send confirmation email (non-blocking — don't fail the order if email fails)
  try {
    const [user] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
    if (user.length > 0 && user[0].email) {
      const orderItems = items.map(i => ({
        product_name: i.name,
        quantity: i.quantity,
        total_price: i.price * i.quantity
      }));
      const emailContent = sendOrderConfirmation(user[0].email, user[0].name, orderNumber, orderItems, totalAmount);
      await sendEmail({
        to: user[0].email,
        subject: `Order Confirmed - #${orderNumber}`,
        html: emailContent.html
      });
    }
  } catch (emailErr) {
    console.error('Failed to send order confirmation email (order still created):', emailErr.message);
    // Email is non-critical — order is already saved
  }

  return ApiResponse.created(res, {
    order_id: orderId,
    order_number: orderNumber,
    total_amount: totalAmount
  }, 'Order created successfully.');
});

const getOrderByNumber = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;

  const [orders] = await pool.query(
    `SELECT o.*, a.name as address_name, a.phone as address_phone, a.house_no, a.street, a.city, a.state, a.pincode
     FROM orders o
     JOIN addresses a ON o.address_id = a.id
     WHERE o.order_number = ? AND o.user_id = ?`,
    [orderNumber, req.user.id]
  );

  if (orders.length === 0) {
    return ApiResponse.error(res, 'Order not found.', 404);
  }

  const [items] = await pool.query(
    'SELECT * FROM order_items WHERE order_id = ?',
    [orders[0].id]
  );

  const [tracking] = await pool.query(
    'SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC',
    [orders[0].id]
  );

  orders[0].items = items;
  orders[0].tracking = tracking;

  return ApiResponse.success(res, { order: orders[0] });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [orders] = await pool.query(
    "SELECT id, status FROM orders WHERE id = ? AND user_id = ? AND status IN ('pending', 'confirmed')",
    [id, req.user.id]
  );

  if (orders.length === 0) {
    return ApiResponse.error(res, 'Order cannot be cancelled or not found.', 400);
  }

  await pool.query(
    "UPDATE orders SET status = 'cancelled' WHERE id = ?",
    [id]
  );

  await pool.query(
    'INSERT INTO order_tracking (order_id, status, message) VALUES (?, ?, ?)',
    [id, 'cancelled', 'Order cancelled by customer.']
  );

  const [items] = await pool.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
  for (const item of items) {
    await pool.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
  }

  // Create cancellation notification
  const [orderData] = await pool.query('SELECT order_number FROM orders WHERE id = ?', [id]);
  const orderNumber = orderData[0]?.order_number || 'N/A';
  await createNotification(
    req.user.id,
    'order_cancelled',
    `Order #${orderNumber} cancelled`,
    'Your order has been cancelled successfully. Refund will be processed within 5-7 business days if applicable.',
    { order_id: id, order_number: orderNumber }
  );

  return ApiResponse.success(res, {}, 'Order cancelled successfully.');
});

const requestReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const [orders] = await pool.query(
    "SELECT id FROM orders WHERE id = ? AND user_id = ? AND status = 'delivered'",
    [id, req.user.id]
  );

  if (orders.length === 0) {
    return ApiResponse.error(res, 'Order cannot be returned or not found.', 400);
  }

  await pool.query(
    "UPDATE orders SET status = 'return_requested' WHERE id = ?",
    [id]
  );

  await pool.query(
    'INSERT INTO order_tracking (order_id, status, message) VALUES (?, ?, ?)',
    [id, 'return_requested', `Return requested: ${reason || 'No reason provided'}`]
  );

  // Create return request notification
  const [orderData] = await pool.query('SELECT order_number FROM orders WHERE id = ?', [id]);
  const orderNumber = orderData[0]?.order_number || 'N/A';
  await createNotification(
    req.user.id,
    'order_cancelled',
    `Return requested for Order #${orderNumber}`,
    `Return request submitted. Reason: ${reason || 'No reason provided'}. We will review and update you shortly.`,
    { order_id: id, order_number: orderNumber, reason: reason || null }
  );

  return ApiResponse.success(res, {}, 'Return request submitted.');
});

const getOrderTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [orders] = await pool.query('SELECT id FROM orders WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (orders.length === 0) {
    return ApiResponse.error(res, 'Order not found.', 404);
  }

  const [tracking] = await pool.query(
    'SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC',
    [id]
  );

  return ApiResponse.success(res, { tracking });
});

const getPendingCount = asyncHandler(async (req, res) => {
  const [countResult] = await pool.query(
    "SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND status IN ('pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery')",
    [req.user.id]
  );

  return ApiResponse.success(res, { count: countResult[0].count });
});

module.exports = {
  createOrder,
  getOrderByNumber,
  cancelOrder,
  requestReturn,
  getOrderTracking,
  getPendingCount
};
