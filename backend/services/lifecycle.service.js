/**
 * Post-delivery lifecycle emails — the repeat-order engine.
 *
 * Two flows, both triggered from the delivered_at timestamp on orders:
 *   1. REVIEW REQUEST  — delivered 2-3 days ago → email listing each item
 *      with a "Rate it" link (drives reviews = product-page trust content).
 *   2. REORDER NUDGE   — delivered 14+ days ago → email with the same items
 *      and one-click product links (repeat orders).
 *
 * Each order is emailed at most once per flow: review_email_sent_at /
 * reorder_email_sent_at are stamped when the email goes out, so a scheduler
 * restart or overlapping run can never double-send.
 *
 * Scheduler wiring lives in backend/server.js (setInterval). Runs are
 * fire-and-forget: email failures are logged, never thrown.
 */
const pool = require('../config/db');
const emailService = require('./email.service');

// Tune the timing (hours). Defaults: review at ~2-3 days (48-72h), reorder at 14 days (336h).
const REVIEW_AFTER_HOURS = parseInt(process.env.REVIEW_REQUEST_HOURS, 10) || 48;
const REVIEW_WINDOW_HOURS = parseInt(process.env.REVIEW_REQUEST_WINDOW_HOURS, 10) || 24; // send any time in the next 24h
const REORDER_AFTER_HOURS = parseInt(process.env.REORDER_REMINDER_HOURS, 10) || 336; // 14 days

const reviewDueSql = `
  SELECT o.id, o.order_number, o.user_id, o.delivered_at,
         u.name AS user_name, u.email
  FROM orders o
  JOIN users u ON u.id = o.user_id
  WHERE o.status = 'delivered'
    AND o.review_email_sent_at IS NULL
    AND o.delivered_at IS NOT NULL
    AND o.delivered_at <= NOW() - INTERVAL ? HOUR
    AND o.delivered_at >  NOW() - INTERVAL ? HOUR
    AND u.is_active = 1
    AND u.email IS NOT NULL AND u.email <> ''
  LIMIT 50
`;

const reorderDueSql = `
  SELECT o.id, o.order_number, o.user_id, o.delivered_at,
         u.name AS user_name, u.email
  FROM orders o
  JOIN users u ON u.id = o.user_id
  WHERE o.status = 'delivered'
    AND o.reorder_email_sent_at IS NULL
    AND o.delivered_at IS NOT NULL
    AND o.delivered_at <= NOW() - INTERVAL ? HOUR
    AND u.is_active = 1
    AND u.email IS NOT NULL AND u.email <> ''
  LIMIT 50
`;

// One user may appear across several due orders — batch their items together
// so a user gets ONE email, not one per order.
const loadItems = async (orderIds) => {
  if (!orderIds.length) return new Map();
  const placeholders = orderIds.map(() => '?').join(',');
  const [rows] = await pool.query(
    `SELECT oi.order_id, oi.product_id, oi.product_name, oi.quantity, oi.total_price, p.slug
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id IN (${placeholders})
     ORDER BY oi.id ASC`,
    orderIds
  );
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.order_id)) map.set(r.order_id, []);
    map.get(r.order_id).push(r);
  }
  return map;
};

// Deliver the review requests. Returns the count sent.
const sendReviewRequests = async () => {
  const [due] = await pool.query(reviewDueSql, [REVIEW_AFTER_HOURS, REVIEW_AFTER_HOURS + REVIEW_WINDOW_HOURS]);
  if (!due.length) return 0;

  const itemsMap = await loadItems(due.map((o) => o.id));
  let sent = 0;

  for (const order of due) {
    const items = itemsMap.get(order.id) || [];
    if (!items.length) continue; // no line items → nothing to rate

    const { subject, html } = emailService.sendReviewRequestEmail(order.email, order.user_name, order.order_number, items);
    const result = await emailService.sendEmail({ to: order.email, subject, html });
    if (result.success) {
      await pool.query('UPDATE orders SET review_email_sent_at = NOW() WHERE id = ?', [order.id]);
      sent += 1;
      console.log(`[Lifecycle] Review request sent for order ${order.order_number} → ${order.email}`);
    }
  }
  return sent;
};

// Deliver the reorder nudges. Returns the count sent.
const sendReorderReminders = async () => {
  const [due] = await pool.query(reorderDueSql, [REORDER_AFTER_HOURS]);
  if (!due.length) return 0;

  const itemsMap = await loadItems(due.map((o) => o.id));
  let sent = 0;

  for (const order of due) {
    const items = itemsMap.get(order.id) || [];
    if (!items.length) continue;

    const { subject, html } = emailService.sendReorderEmail(order.email, order.user_name, items);
    const result = await emailService.sendEmail({ to: order.email, subject, html });
    if (result.success) {
      await pool.query('UPDATE orders SET reorder_email_sent_at = NOW() WHERE id = ?', [order.id]);
      sent += 1;
      console.log(`[Lifecycle] Reorder reminder sent for order ${order.order_number} → ${order.email}`);
    }
  }
  return sent;
};

// One entry point the scheduler calls every N minutes.
const runLifecycleEmails = async () => {
  const reviewSent = await sendReviewRequests();
  const reorderSent = await sendReorderReminders();
  if (reviewSent || reorderSent) {
    console.log(`[Lifecycle] Done: ${reviewSent} review + ${reorderSent} reorder email(s).`);
  }
  return { reviewSent, reorderSent };
};

module.exports = { runLifecycleEmails, sendReviewRequests, sendReorderReminders };
