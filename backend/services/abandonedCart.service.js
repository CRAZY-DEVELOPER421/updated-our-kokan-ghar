/**
 * Abandoned Cart Recovery Service
 *
 * Identifies carts that haven't been converted to orders within a configurable
 * window (default 24 hours) and sends a recovery email with an auto-generated
 * coupon code to incentivize the customer to complete the purchase.
 *
 * Flow:
 *   1. Find carts with items, belonging to a logged-in user (has email),
 *      whose updated_at is older than ABANDON_HOURS.
 *   2. Exclude carts that already have an order (checked via recent orders).
 *   3. Exclude carts that already received a recovery email (abandoned_cart_emails).
 *   4. Generate a unique recovery coupon (percentage or flat discount).
 *   5. Send a professional recovery email with the coupon.
 *   6. Log the send in abandoned_cart_emails to prevent duplicates.
 *
 * Scheduler: runs hourly via server.js setInterval.
 * Standalone: node scripts/abandoned-cart-recovery.js
 */

const pool = require('../config/db');
const emailService = require('./email.service');
const { getAdminEmail } = require('./stockAlert.service');

// ── Configuration ──────────────────────────────────────────────
const ABANDON_HOURS = parseInt(process.env.ABANDON_CART_HOURS, 10) || 24;
const RECOVERY_COUPON_PERCENT = parseInt(process.env.RECOVERY_COUPON_PERCENT, 10) || 10;
const RECOVERY_COUPON_EXPIRY_DAYS = parseInt(process.env.RECOVERY_COUPON_EXPIRY_DAYS, 10) || 7;
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

// ── Find abandoned carts ───────────────────────────────────────
async function findAbandonedCarts() {
  // Carts that:
  // 1. Belong to a logged-in user (user_id IS NOT NULL)
  // 2. Have at least 1 item
  // 3. Haven't been touched in ABANDON_HOURS
  // 4. Don't already have a recent order (no order in last 48h)
  // 5. Haven't received a recovery email in last 7 days
  const [carts] = await pool.query(
    `SELECT c.id, c.user_id, c.updated_at,
            u.name, u.email,
            COUNT(ci.id) as item_count,
            SUM(ci.quantity * p.price) as cart_total
     FROM cart c
     JOIN users u ON c.user_id = u.id
     JOIN cart_items ci ON ci.cart_id = c.id
     JOIN products p ON ci.product_id = p.id
     WHERE c.user_id IS NOT NULL
       AND u.is_active = 1
       AND u.email IS NOT NULL
       AND u.email != ''
       AND c.updated_at < DATE_SUB(NOW(), INTERVAL ? HOUR)
       AND NOT EXISTS (
         -- No order placed in the last 48 hours by this user
         SELECT 1 FROM orders o
         WHERE o.user_id = c.user_id
           AND o.created_at > DATE_SUB(NOW(), INTERVAL 48 HOUR)
       )
       AND NOT EXISTS (
         -- No recovery email sent in the last 7 days for this cart
         SELECT 1 FROM abandoned_cart_emails ace
         WHERE ace.cart_id = c.id AND ace.sent_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
       )
     GROUP BY c.id, c.user_id, c.updated_at, u.name, u.email
     HAVING item_count > 0
     ORDER BY c.updated_at ASC
     LIMIT 20`,
    [ABANDON_HOURS]
  );

  return carts;
}

// ── Generate a unique recovery coupon ──────────────────────────
async function generateRecoveryCoupon(userId, cartTotal) {
  // Coupon code: RECOVER-XXXX (8-char random)
  const code = `RECOVER-${Date.now().toString(36).toUpperCase().slice(-4)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  const minOrder = Math.max(Math.round(cartTotal * 0.8), 199); // 80% of cart total, min ₹199
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + RECOVERY_COUPON_EXPIRY_DAYS);

  const [result] = await pool.query(
    `INSERT INTO coupons (code, type, value, min_order_amount, usage_limit, is_active, valid_from, valid_until, description)
     VALUES (?, 'percentage', ?, ?, 1, 1, NOW(), ?, ?)`,
    [
      code,
      RECOVERY_COUPON_PERCENT,
      minOrder,
      expiryDate,
      `Recovery coupon — ${RECOVERY_COUPON_PERCENT}% off (valid ${RECOVERY_COUPON_EXPIRY_DAYS} days)`
    ]
  );

  return { code, couponId: result.insertId, minOrder, expiryDate };
}

// ── Send recovery email ────────────────────────────────────────
async function sendRecoveryEmail(cart, coupon) {
  const items = await getCartItems(cart.id);
  if (items.length === 0) return false;

  const html = emailService.emailShell({
    title: 'Your cart misses you! 🛒',
    subtitle: "Don't let your favourites slip away",
    contentHtml: `
      <p style="color: #1C1C1E; font-size: 16px;">Hello ${escapeHtml(cart.name)},</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7;">
        You left some great Konkan goodies in your cart — we've saved them for you!
        Complete your order now and enjoy a special <strong style="color: #E87722;">${RECOVERY_COUPON_PERCENT}% OFF</strong>.
      </p>

      <!-- Cart Items Preview -->
      <div style="background: #F7F3EC; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <p style="font-size: 12px; font-weight: bold; color: #8B6914; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Your Cart</p>
        ${items.slice(0, 5).map(item => `
          <div style="display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #EDE0CC;">
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 600; color: #1C1C1E;">${escapeHtml(item.name)}</div>
              <div style="font-size: 12px; color: #6B7280;">Qty: ${item.quantity}</div>
            </div>
            <div style="font-size: 13px; font-weight: bold; color: #2D6A4F;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
          </div>
        `).join('')}
        ${items.length > 5 ? `<p style="font-size: 12px; color: #6B7280; margin: 8px 0 0;">+ ${items.length - 5} more item(s)</p>` : ''}
      </div>

      <!-- Coupon Box -->
      <div style="background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%); border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0;">
        <p style="color: #EDE0CC; font-size: 12px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: 1px;">Your Exclusive Code</p>
        <div style="font-size: 28px; font-weight: bold; color: #fff; letter-spacing: 4px; margin: 8px 0;">${coupon.code}</div>
        <p style="color: #EDE0CC; font-size: 12px; margin: 4px 0 0;">${RECOVERY_COUPON_PERCENT}% off • Min ₹${coupon.minOrder} • Expires ${coupon.expiryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
      </div>

      <div style="text-align: center;">
        <a href="${FRONTEND_URL}/cart" style="display: inline-block; background: #E87722; color: #fff; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
          Complete Your Order →
        </a>
      </div>

      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 20px;">
        This coupon is valid for ${RECOVERY_COUPON_EXPIRY_DAYS} days. Don't miss out!
      </p>
    `,
  });

  return emailService.sendEmail({
    to: cart.email,
    subject: `🛒 Your cart is waiting — ${RECOVERY_COUPON_PERCENT}% OFF inside!`,
    html,
  });
}

// ── Get cart items for email ───────────────────────────────────
async function getCartItems(cartId) {
  const [items] = await pool.query(
    `SELECT ci.quantity, p.name, p.price, p.slug,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?
     ORDER BY ci.added_at ASC`,
    [cartId]
  );
  return items;
}

// ── Main recovery sweep ────────────────────────────────────────
async function runAbandonedCartRecovery() {
  console.log('[AbandonedCart] RECOVERY_SWEEP_STARTED —', new Date().toISOString());

  try {
    // 1. Ensure schema exists
    await ensureSchema();

    // 2. Find abandoned carts
    const carts = await findAbandonedCarts();
    if (carts.length === 0) {
      console.log('[AbandonedCart] No abandoned carts found.');
      return { success: true, sent: 0 };
    }

    console.log(`[AbandonedCart] Found ${carts.length} abandoned cart(s). Processing...`);

    let sent = 0;
    for (const cart of carts) {
      try {
        // 3. Generate unique recovery coupon
        const coupon = await generateRecoveryCoupon(cart.user_id, cart.cart_total);

        // 4. Send recovery email
        const result = await sendRecoveryEmail(cart, coupon);

        if (result && result.success) {
          // 5. Log the send
          await pool.query(
            `INSERT INTO abandoned_cart_emails (cart_id, user_id, email, coupon_code, coupon_id, cart_total, item_count, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'SENT')`,
            [cart.id, cart.user_id, cart.email, coupon.code, coupon.couponId, cart.cart_total, cart.item_count]
          );
          sent++;
          console.log(`[AbandonedCart] RECOVERY_EMAIL_SENT — ${cart.email} (cart #${cart.id}, coupon: ${coupon.code})`);
        } else {
          console.error(`[AbandonedCart] Email failed for cart #${cart.id}:`, result?.error || 'unknown');
        }
      } catch (err) {
        console.error(`[AbandonedCart] Error processing cart #${cart.id}:`, err.message);
      }
    }

    console.log(`[AbandonedCart] RECOVERY_SWEEP_DONE — sent ${sent}/${carts.length} emails`);
    return { success: true, sent, total: carts.length };
  } catch (err) {
    console.error('[AbandonedCart] RECOVERY_SWEEP_FAILED —', err.message);
    return { success: false, error: err.message };
  }
}

// ── Schema self-heal ───────────────────────────────────────────
async function ensureSchema() {
  try {
    const [tables] = await pool.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'abandoned_cart_emails'`
    );
    if (tables.length === 0) {
      await pool.query(`
        CREATE TABLE abandoned_cart_emails (
          id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          cart_id         INT UNSIGNED NOT NULL,
          user_id         INT UNSIGNED DEFAULT NULL,
          email           VARCHAR(255) NOT NULL,
          coupon_code     VARCHAR(50) DEFAULT NULL,
          coupon_id       INT UNSIGNED DEFAULT NULL,
          cart_total      DECIMAL(10,2) NOT NULL DEFAULT 0,
          item_count      INT UNSIGNED NOT NULL DEFAULT 0,
          status          ENUM('SENT','OPENED','RECOVERED') NOT NULL DEFAULT 'SENT',
          sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          opened_at       DATETIME DEFAULT NULL,
          recovered_at    DATETIME DEFAULT NULL,
          recovered_order_id INT UNSIGNED DEFAULT NULL,
          created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_ace_cart (cart_id),
          INDEX idx_ace_user (user_id),
          INDEX idx_ace_status (status),
          INDEX idx_ace_sent (sent_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[AbandonedCart] Created abandoned_cart_emails table.');
    }
  } catch (err) {
    console.error('[AbandonedCart] Schema ensure failed:', err.message);
  }
}

// ── Escape HTML ────────────────────────────────────────────────
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  runAbandonedCartRecovery,
  findAbandonedCarts,
  ensureSchema,
};
