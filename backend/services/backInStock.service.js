/**
 * Back-in-Stock Notification Service
 *
 * Lets users subscribe to be notified when an out-of-stock product is
 * restocked. On restock, sends email notifications to all subscribers.
 *
 * Flow:
 *   1. User clicks "Notify Me" on an OOS product page → POST /products/:id/notify
 *   2. Record saved in back_in_stock_requests
 *   3. When stock is restored (admin update, order cancel, etc.)
 *      → checkAndNotifySubscribers() is called
 *   4. All non-notified subscribers get sendBackInStockEmail
 *   5. Marked as notified
 */

const pool = require('../config/db');
const emailService = require('./email.service');

const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

/**
 * Subscribe to back-in-stock notification.
 * Returns { success, message, alreadySubscribed? }
 */
async function subscribe(productId, user, email) {
  if (!productId || !email) {
    return { success: false, message: 'Product ID and email are required.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const userId = user?.id || null;

  // Check product exists and is active
  const [products] = await pool.query(
    'SELECT id, name, stock_quantity FROM products WHERE id = ? AND is_active = 1',
    [productId]
  );
  if (products.length === 0) {
    return { success: false, message: 'Product not found.' };
  }

  // If product is in stock, no need to subscribe
  if (products[0].stock_quantity > 0) {
    return { success: false, message: 'Product is already in stock!' };
  }

  // Check if already subscribed
  const [existing] = await pool.query(
    'SELECT id, is_notified FROM back_in_stock_requests WHERE product_id = ? AND email = ?',
    [productId, cleanEmail]
  );

  if (existing.length > 0) {
    if (existing[0].is_notified) {
      // Was notified before (stock came and went again) — reset for new notification
      await pool.query(
        'UPDATE back_in_stock_requests SET is_notified = 0, notified_at = NULL WHERE id = ?',
        [existing[0].id]
      );
      return { success: true, message: "You'll be notified when this product is back!", reactivated: true };
    }
    return { success: true, message: "You're already on the list! We'll notify you.", alreadySubscribed: true };
  }

  // Insert new subscription
  try {
    await pool.query(
      'INSERT INTO back_in_stock_requests (product_id, user_id, email) VALUES (?, ?, ?)',
      [productId, userId, cleanEmail]
    );
  } catch (err) {
    // Duplicate key race condition — safe to ignore
    if (err.code === 'ER_DUP_ENTRY') {
      return { success: true, message: "You're already on the list!" };
    }
    throw err;
  }

  return { success: true, message: "You'll be notified when this product is back in stock!" };
}

/**
 * Check if current user/email is already subscribed for a product.
 */
async function checkSubscription(productId, email) {
  if (!productId || !email) return { subscribed: false };

  const [rows] = await pool.query(
    'SELECT id, is_notified FROM back_in_stock_requests WHERE product_id = ? AND email = ?',
    [productId, email.trim().toLowerCase()]
  );

  return {
    subscribed: rows.length > 0 && !rows[0].is_notified,
  };
}

/**
 * Called after any stock mutation that restores stock from 0 → >0.
 * Sends back-in-stock emails to all non-notified subscribers.
 *
 * Fire-and-forget: never throws, only logs.
 */
async function notifySubscribers(productId) {
  try {
    const [products] = await pool.query(
      'SELECT id, name, slug, stock_quantity FROM products WHERE id = ?',
      [productId]
    );

    if (products.length === 0 || products[0].stock_quantity <= 0) return;

    const product = products[0];

    // Find all non-notified subscribers
    const [subscribers] = await pool.query(
      `SELECT id, email FROM back_in_stock_requests
       WHERE product_id = ? AND is_notified = 0`,
      [productId]
    );

    if (subscribers.length === 0) return;

    const productUrl = `${FRONTEND_URL}/products/${product.slug}`;
    let notified = 0;

    for (const sub of subscribers) {
      try {
        const mail = emailService.sendBackInStockEmail(
          sub.email,
          sub.email.split('@')[0], // name fallback
          product.name,
          productUrl
        );

        await emailService.sendEmail({
          to: sub.email,
          subject: `🎉 Back in Stock — ${product.name}`,
          html: mail.html,
        });

        notified++;
      } catch (err) {
        console.error(`[BackInStock] Email failed for ${sub.email}:`, err.message);
      }
    }

    // Mark all as notified
    if (notified > 0) {
      await pool.query(
        `UPDATE back_in_stock_requests
         SET is_notified = 1, notified_at = NOW()
         WHERE product_id = ? AND is_notified = 0`,
        [productId]
      );
      console.log(`[BackInStock] NOTIFY_SENT — ${product.name}: ${notified}/${subscribers.length} subscriber(s) notified`);
    }
  } catch (err) {
    console.error(`[BackInStock] notifySubscribers failed for product #${productId}:`, err.message);
  }
}

/**
 * Schema self-heal — ensures table exists.
 */
async function ensureSchema() {
  try {
    const [tables] = await pool.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'back_in_stock_requests'`
    );
    if (tables.length === 0) {
      await pool.query(`
        CREATE TABLE back_in_stock_requests (
          id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          product_id  INT UNSIGNED NOT NULL,
          user_id     INT UNSIGNED DEFAULT NULL,
          email       VARCHAR(255) NOT NULL,
          is_notified TINYINT(1) NOT NULL DEFAULT 0,
          notified_at DATETIME DEFAULT NULL,
          created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uk_bis_user_product (product_id, user_id),
          UNIQUE KEY uk_bis_email_product (product_id, email),
          INDEX idx_bis_product (product_id),
          INDEX idx_bis_notified (is_notified)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[BackInStock] Created back_in_stock_requests table.');
    }
  } catch (err) {
    console.error('[BackInStock] Schema ensure failed:', err.message);
  }
}

module.exports = {
  subscribe,
  checkSubscription,
  notifySubscribers,
  ensureSchema,
};
