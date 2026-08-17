const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { v4: uuidv4 } = require('uuid');
const loyaltyService = require('../services/loyalty.service');
const { sendEmail, sendOrderConfirmation } = require('../services/email.service');
const { sendOrderSMS } = require('../services/sms.service');
const { createNotification } = require('../services/notification.service');

const generateOrderNumber = () => {
  const prefix = 'KB';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

const createOrder = asyncHandler(async (req, res) => {
  const { address_id, payment_method, notes, points_to_redeem } = req.body;

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

  // ── Loyalty points redemption ────────────────────────────────────────────
  // Optional: customer pays with Konkan Points. Points are deducted from the
  // balance and the ₹ discount is applied on top of any coupon. The discount
  // is capped so it never pushes the item total (subtotal − coupon) below ₹0 —
  // shipping & GST always remain payable. Any excess deducted points are
  // refunded immediately.
  let pointsUsed = 0;
  let pointsDiscount = 0;
  const pointsToRedeem = parseInt(points_to_redeem, 10);
  if (pointsToRedeem > 0) {
    const redeem = await loyaltyService.redeemPoints(req.user.id, pointsToRedeem);
    if (!redeem.success) {
      return ApiResponse.error(res, redeem.message || 'Could not redeem points. Please try again.', 400);
    }

    pointsUsed = redeem.pointsUsed;
    pointsDiscount = Math.min(redeem.discountAmount, Math.max(subtotal - couponDiscount, 0));

    // Cap hit → give back the points that couldn't be applied.
    if (pointsDiscount < redeem.discountAmount) {
      const excessPoints = loyaltyService.rupeesToPoints(redeem.discountAmount - pointsDiscount);
      if (excessPoints > 0) {
        await loyaltyService.refundPoints(req.user.id, excessPoints, 'Excess points refunded on order');
        pointsUsed = Math.max(pointsUsed - excessPoints, 0);
      }
    }
  }

  const totalAmount = Math.round(Math.max((subtotal - couponDiscount - pointsDiscount + shippingCharge + taxAmount), 0) * 100) / 100;

  const orderNumber = generateOrderNumber();

  const [orderResult] = await pool.query(
    `INSERT INTO orders (order_number, user_id, address_id, status, subtotal, discount_amount, coupon_code, coupon_discount, points_used, points_discount, shipping_charge, tax_amount, total_amount, payment_method, payment_status, notes, estimated_delivery)
     VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, DATE_ADD(NOW(), INTERVAL 5 DAY))`,
    [orderNumber, req.user.id, address_id, subtotal, couponDiscount + pointsDiscount, cart[0].coupon_code, couponDiscount, pointsUsed, pointsDiscount, shippingCharge, taxAmount, totalAmount, payment_method, notes || null]
  );

  // Order insert failed after points were deducted → give them back.
  if (!orderResult || !orderResult.insertId) {
    if (pointsUsed > 0) {
      await loyaltyService.refundPoints(req.user.id, pointsUsed, 'Points refunded (order could not be created)');
    }
    return ApiResponse.error(res, 'Could not create order. Please try again.', 500);
  }

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

  // Record coupon usage so used_count + "used today" counters stay accurate
  if (cart[0].coupon_code) {
    const [couponRows] = await pool.query(
      'SELECT id FROM coupons WHERE code = ?',
      [cart[0].coupon_code]
    );
    if (couponRows.length > 0) {
      await pool.query(
        'INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied, used_at) VALUES (?, ?, ?, ?, NOW())',
        [couponRows[0].id, req.user.id, orderId, couponDiscount]
      );
      await pool.query(
        'UPDATE coupons SET used_count = used_count + 1 WHERE id = ?',
        [couponRows[0].id]
      );
    }
  }

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

  // Send order confirmation SMS to the delivery address phone (COD customers
  // often have no email — the phone on the address is where the parcel goes).
  // Fire-and-forget: SMS failure never fails the order.
  try {
    await sendOrderSMS(addresses[0].phone, 'order_placed', {
      orderNumber,
      amount: totalAmount,
    });
  } catch (smsErr) {
    console.error('Failed to send order confirmation SMS (order still created):', smsErr.message);
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
     WHERE (o.order_number = ? OR o.id = ?) AND o.user_id = ?`,
    [orderNumber, orderNumber, req.user.id]
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

// Cancellation reasons the customer can pick from the cancel dialog.
// Stored verbatim in orders.cancel_reason so the admin analytics can group by them.
const CANCEL_REASONS = [
  'delivery_time_too_long',
  'found_cheaper_elsewhere',
  'ordered_by_mistake',
  'changed_my_mind',
  'price_too_high',
  'payment_issue',
  'other',
];

const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cancel_reason } = req.body;

  // Validate the reason (if provided) — free-form "other" gets a custom text.
  let reason = null;
  if (cancel_reason && String(cancel_reason).trim()) {
    const trimmed = String(cancel_reason).trim().slice(0, 191);
    reason = CANCEL_REASONS.includes(trimmed)
      ? trimmed
      : trimmed.toLowerCase().startsWith('other')
        ? 'other'
        : trimmed;
  }

  const [orders] = await pool.query(
    "SELECT id, status FROM orders WHERE id = ? AND user_id = ? AND status IN ('pending', 'confirmed')",
    [id, req.user.id]
  );

  if (orders.length === 0) {
    return ApiResponse.error(res, 'Order cannot be cancelled or not found.', 400);
  }

  await pool.query(
    'UPDATE orders SET status = ?, cancel_reason = ? WHERE id = ?',
    ['cancelled', reason, id]
  );

  await pool.query(
    'INSERT INTO order_tracking (order_id, status, message) VALUES (?, ?, ?)',
    [id, 'cancelled', `Order cancelled by customer${reason ? ` — ${reason}` : ''}.`]
  );

  const [items] = await pool.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
  for (const item of items) {
    await pool.query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
  }

  // Refund any loyalty points redeemed on this order
  const [orderData] = await pool.query('SELECT order_number, points_used FROM orders WHERE id = ?', [id]);
  const orderNumber = orderData[0]?.order_number || 'N/A';
  const pointsUsed = orderData[0]?.points_used || 0;
  if (pointsUsed > 0) {
    await loyaltyService.refundPoints(
      req.user.id,
      pointsUsed,
      `Points refunded for cancelled order #${orderNumber}`
    );
  }
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

// GET /api/orders — customer-facing order list (paginated, optional status filter)
const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const { status } = req.query;

  let whereClause = 'WHERE o.user_id = ?';
  const params = [req.user.id];

  if (status) {
    whereClause += ' AND o.status = ?';
    params.push(status);
  }

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM orders o ${whereClause}`, params
  );

  const [orders] = await pool.query(
    `SELECT o.*,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count,
      (SELECT product_name FROM order_items oi WHERE oi.order_id = o.id ORDER BY oi.id ASC LIMIT 1) as product_name
     FROM orders o
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return ApiResponse.paginated(res, { orders }, {
    page, limit,
    total: countResult[0].total,
    pages: Math.ceil(countResult[0].total / limit)
  });
});

module.exports = {
  createOrder,
  getOrderByNumber,
  cancelOrder,
  requestReturn,
  getOrderTracking,
  getPendingCount,
  getOrders
};
