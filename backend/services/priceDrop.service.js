/**
 * Wishlist price-drop alerts — the conversion engine.
 *
 * A customer who wishlists a product has already said "I'll buy this later".
 * When the price drops meaningfully, that intent converts: notify them with
 * the exact savings ("Cashew W240 — ab ₹150 sasta!").
 *
 * How it works (runs on a daily cron, wired in backend/server.js):
 *   1. Baseline = `last_alert_price` if we already alerted, otherwise the
 *      price stamped when the item was wishlisted (`price_at_add`).
 *   2. An alert fires only when today's price is at least `PRICE_DROP_MIN_PERCENT`
 *      (default 5%) BELOW that baseline. The baseline is then moved DOWN to
 *      today's price, so the same drop never double-sends — but a further
 *      drop triggers a fresh alert.
 *   3. Each alert = in-app notification (type `price_drop`, icon already
 *      mapped on the Notifications page) + email (fire-and-forget, only for
 *      active users with an email address).
 *
 * Spam-safety: the alert floor only ever moves DOWN (never resets on a price
 * rise), so oscillating prices can't cause repeat alerts for the same level.
 */
const pool = require('../config/db');
const { createNotification } = require('./notification.service');
const emailService = require('./email.service');

// Trigger only when the price is at least this % below the current baseline.
const MIN_DROP_PERCENT = parseFloat(process.env.PRICE_DROP_MIN_PERCENT) || 5;

// Every wishlist row whose current price is lower than its alert floor.
// (last_alert_price NULL = never alerted → floor is price_at_add.)
const dueSql = `
  SELECT w.id AS wishlist_id, w.user_id, w.product_id,
         w.price_at_add, w.last_alert_price,
         p.name AS product_name, p.slug, p.price AS current_price, p.mrp,
         u.name AS user_name, u.email
  FROM wishlist w
  JOIN products p ON p.id = w.product_id
  JOIN users u ON u.id = w.user_id
  WHERE p.is_active = 1
    AND w.price_at_add IS NOT NULL
    AND w.price_at_add > 0
    AND (w.last_alert_price IS NULL OR w.last_alert_price > p.price)
  LIMIT 200
`;

/**
 * Run one price-drop sweep. Returns the number of alerts sent.
 * Fire-and-forget: per-row failures are logged, never thrown.
 */
const runPriceDropAlerts = async () => {
  const [rows] = await pool.query(dueSql);
  let notified = 0;

  for (const row of rows) {
    try {
      const baseline = row.last_alert_price || row.price_at_add;
      const current = Number(row.current_price);
      const baselineNum = Number(baseline);
      if (!current || current <= 0 || !baselineNum || baselineNum <= 0) continue;

      const dropPercent = ((baselineNum - current) / baselineNum) * 100;
      if (dropPercent < MIN_DROP_PERCENT) continue; // not a big enough drop yet

      // Savings shown against the ORIGINAL wishlist price ("pehli baar") —
      // cumulative, so a second deeper drop says "ab ₹200 sasta" not just "₹50".
      const savings = Math.max(Math.round((Number(row.price_at_add) - current) * 100) / 100, 0);
      const productUrl = `${process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0].trim() : ''}/products/${row.slug}`;

      // In-app notification (price_drop icon already exists on the Notifications page)
      await createNotification(
        row.user_id,
        'price_drop',
        `${row.product_name} price dropped!`,
        `${row.product_name} is now ₹${savings} cheaper (was ₹${row.price_at_add}, now ₹${current}). Grab it before the price goes back up!`,
        {
          product_id: row.product_id,
          product_name: row.product_name,
          slug: row.slug,
          old_price: baselineNum,
          new_price: current,
          savings,
        }
      );

      // Email — only for active users who have one (fire-and-forget)
      if (row.email && row.user_name) {
        const { subject, html } = emailService.sendPriceDropEmail(
          row.email,
          row.user_name,
          row.product_name,
          current,
          row.price_at_add,
          savings,
          productUrl
        );
        emailService.sendEmail({ to: row.email, subject, html }).catch((err) => {
          console.error(`[PriceDrop] Email failed for ${row.email}:`, err.message);
        });
      }

      // Move the alert floor DOWN to today's price → no double-send for the
      // same drop; a future deeper drop will trigger again.
      await pool.query(
        'UPDATE wishlist SET last_alert_price = ?, price_drop_alerted_at = NOW() WHERE id = ?',
        [current, row.wishlist_id]
      );
      notified += 1;
      console.log(`[PriceDrop] Alerted user ${row.user_id}: ${row.product_name} ₹${row.price_at_add} → ₹${current} (-${dropPercent.toFixed(1)}%)`);
    } catch (err) {
      console.error(`[PriceDrop] Row ${row.wishlist_id} failed:`, err.message);
    }
  }

  if (notified > 0) {
    console.log(`[PriceDrop] Done: ${notified} price-drop alert(s) sent.`);
  }
  return notified;
};

module.exports = { runPriceDropAlerts };
