/**
 * Stock Alert Service
 *
 * Responsibilities:
 * 1. Determine stock status (IN_STOCK, LOW_STOCK, CRITICAL, OUT_OF_STOCK)
 *    using per-product thresholds from the database.
 * 2. Send low-stock email alerts to the admin — but only ONCE per
 *    low-stock period (database-backed dedup via stock_alerts table).
 * 3. Resolve alerts when the product is restocked above its threshold.
 *
 * Every stock mutation in the application should call `checkAndAlertStock(conn, productId)`
 * so the alert logic runs consistently regardless of which code path changed the stock.
 */

const pool = require('../config/db');
const emailService = require('./email.service');

// ── Stock status constants ──────────────────────────────────────
const STOCK_STATUS = {
  IN_STOCK:     'IN_STOCK',
  LOW_STOCK:    'LOW_STOCK',
  CRITICAL:     'CRITICAL',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
};

/**
 * Determine the stock status for a product given its current row.
 * Uses per-product thresholds (defaults: low=10, critical=3).
 */
function getStockStatus(product) {
  const stock = Number(product.stock_quantity) || 0;
  const lowThreshold = Number(product.low_stock_threshold) || 10;
  const criticalThreshold = Number(product.critical_stock_threshold) || 3;

  if (stock <= 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (stock <= criticalThreshold) return STOCK_STATUS.CRITICAL;
  if (stock <= lowThreshold) return STOCK_STATUS.LOW_STOCK;
  return STOCK_STATUS.IN_STOCK;
}

/**
 * Get the admin notification email from environment or site_settings.
 * Returns null if not configured (we never send to a fake address).
 */
async function getAdminEmail(conn) {
  // Prefer env var (fast, no query)
  const envEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (envEmail && envEmail.trim()) return envEmail.trim();

  // Fallback: site_settings table
  try {
    const [rows] = await (conn || pool).query(
      "SELECT value FROM site_settings WHERE setting_key = 'contact_email' LIMIT 1"
    );
    if (rows.length > 0 && rows[0].value && rows[0].value.trim()) {
      return rows[0].value.trim();
    }
  } catch (_) {
    // Table may not exist yet — ignore
  }

  return null;
}

/**
 * Core function: after any stock change, check if the product needs a
 * low-stock alert or alert resolution.
 *
 * @param {object} connOrPool - MySQL connection or pool (for transactional calls)
 * @param {number} productId  - The product that was just updated
 * @returns {object} { action: 'sent'|'skipped'|'resolved'|'none', status, alert }
 */
async function checkAndAlertStock(connOrPool, productId) {
  const db = connOrPool || pool;

  try {
    // 1. Fetch the product row (including new threshold columns)
    const [products] = await db.query(
      `SELECT id, name, slug, sku, stock_quantity,
              low_stock_threshold, critical_stock_threshold,
              category_id
       FROM products WHERE id = ?`,
      [productId]
    );

    if (products.length === 0) {
      console.error(`[StockAlert] Product #${productId} not found.`);
      return { action: 'none' };
    }

    const product = products[0];
    const stock = Number(product.stock_quantity) || 0;
    const lowThreshold = Number(product.low_stock_threshold) || 10;
    const criticalThreshold = Number(product.critical_stock_threshold) || 3;
    const status = getStockStatus(product);

    // 2. Check for an existing ACTIVE alert for this product
    const [existingAlerts] = await db.query(
      `SELECT * FROM stock_alerts
       WHERE product_id = ? AND status = 'ACTIVE'
       ORDER BY created_at DESC LIMIT 1`,
      [productId]
    );

    const existingAlert = existingAlerts.length > 0 ? existingAlerts[0] : null;

    // ── CASE A: Product is still above all thresholds → resolve any active alert ──
    if (status === STOCK_STATUS.IN_STOCK) {
      if (existingAlert) {
        await db.query(
          `UPDATE stock_alerts SET status = 'RESOLVED', resolved_at = NOW()
           WHERE id = ? AND status = 'ACTIVE'`,
          [existingAlert.id]
        );
        console.log(
          `[StockAlert] LOW_STOCK_ALERT_RESOLVED — ${product.name} (stock: ${stock}, threshold: ${lowThreshold})`
        );

        // If product just came back from OUT_OF_STOCK → notify back-in-stock subscribers
        if (existingAlert.alert_type === 'OUT_OF_STOCK') {
          try {
            const { notifySubscribers } = require('./backInStock.service');
            notifySubscribers(productId).catch(() => {});
          } catch (_) {}
        }

        return { action: 'resolved', status, alert: existingAlert };
      }
      return { action: 'none', status };
    }

    // ── CASE B: Product IS at or below a threshold ──────────────────────

    // Determine which alert type should be active
    let alertType = 'LOW_STOCK';
    let threshold = lowThreshold;
    if (stock <= 0) {
      alertType = 'OUT_OF_STOCK';
      threshold = 0;
    } else if (stock <= criticalThreshold) {
      alertType = 'CRITICAL';
      threshold = criticalThreshold;
    }

    // If there's already an ACTIVE alert of the SAME type → skip (duplicate)
    if (existingAlert && existingAlert.alert_type === alertType) {
      console.log(
        `[StockAlert] LOW_STOCK_ALERT_SKIPPED_DUPLICATE — ${product.name} (${alertType}, stock: ${stock})`
      );
      return { action: 'skipped', status, alert: existingAlert };
    }

    // If there's an ACTIVE alert of a DIFFERENT type → resolve it first
    // (e.g. LOW_STOCK resolved → now it's CRITICAL, or vice versa)
    if (existingAlert) {
      await db.query(
        `UPDATE stock_alerts SET status = 'RESOLVED', resolved_at = NOW()
         WHERE id = ? AND status = 'ACTIVE'`,
        [existingAlert.id]
      );
      console.log(
        `[StockAlert] LOW_STOCK_ALERT_RESOLVED (type change) — ${product.name} (${existingAlert.alert_type} → ${alertType})`
      );
    }

    // Insert the new ACTIVE alert
    const [result] = await db.query(
      `INSERT INTO stock_alerts (product_id, alert_type, threshold, stock_at_alert, status, first_alert_sent_at)
       VALUES (?, ?, ?, ?, 'ACTIVE', NOW())
       ON DUPLICATE KEY UPDATE
         stock_at_alert = VALUES(stock_at_alert),
         updated_at = NOW()`,
      [productId, alertType, threshold, stock]
    );

    const alertId = result.insertId || result.affectedRows;

    // Send the email (fire-and-forget — never fail the stock mutation)
    try {
      await sendLowStockEmail(product, stock, lowThreshold, criticalThreshold, alertType);
      console.log(
        `[StockAlert] LOW_STOCK_ALERT_SENT — ${product.name} (${alertType}, stock: ${stock}, threshold: ${threshold})`
      );
    } catch (emailErr) {
      console.error(
        `[StockAlert] Email send failed for ${product.name}: ${emailErr.message}`
      );
    }

    return { action: 'sent', status, alertType, alertId };
  } catch (err) {
    console.error(`[StockAlert] checkAndAlertStock failed for product #${productId}:`, err.message);
    return { action: 'none', error: err.message };
  }
}

/**
 * Send a professional low-stock / critical / out-of-stock email to the admin.
 */
async function sendLowStockEmail(product, stock, lowThreshold, criticalThreshold, alertType) {
  const adminEmail = await getAdminEmail();
  if (!adminEmail) {
    console.warn('[StockAlert] No admin email configured — skipping email.');
    return;
  }

  const statusLabel = {
    LOW_STOCK:    '⚠️ Low Stock',
    CRITICAL:     '🔴 Critical Stock',
    OUT_OF_STOCK: '🚫 Out of Stock',
  }[alertType] || 'Low Stock';

  const adminUrl = process.env.ADMIN_URL || process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:3001';
  const productUrl = `${adminUrl}/products`;

  const html = emailService.emailShell({
    title: `${statusLabel} — ${product.name}`,
    subtitle: 'Inventory Alert',
    contentHtml: `
      <p style="color: #1C1C1E; font-size: 16px;">Hello Admin,</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7;">
        A product in your inventory has crossed its low-stock threshold and requires attention.
      </p>

      <table width="100%" style="margin: 20px 0; background: #FEF2F2; border-radius: 10px; border: 1px solid #FECACA;">
        <tr>
          <td style="padding: 20px;">
            <div style="font-size: 13px; color: #991B1B; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
              ${statusLabel}
            </div>
            <div style="font-size: 20px; font-weight: bold; color: #1C1C1E; margin-bottom: 16px;">
              ${escapeHtml(product.name)}
            </div>
            <table width="100%" style="font-size: 14px; color: #6B7280;">
              <tr>
                <td style="padding: 4px 0;">Current Stock:</td>
                <td style="padding: 4px 0; font-weight: bold; color: ${stock <= 0 ? '#DC2626' : '#E87722'};">
                  ${stock} units
                </td>
              </tr>
              <tr>
                <td style="padding: 4px 0;">Low Stock Threshold:</td>
                <td style="padding: 4px 0; font-weight: 600;">${lowThreshold} units</td>
              </tr>
              ${criticalThreshold ? `
              <tr>
                <td style="padding: 4px 0;">Critical Threshold:</td>
                <td style="padding: 4px 0; font-weight: 600;">${criticalThreshold} units</td>
              </tr>` : ''}
              ${product.sku ? `
              <tr>
                <td style="padding: 4px 0;">SKU:</td>
                <td style="padding: 4px 0; font-weight: 600;">${escapeHtml(product.sku)}</td>
              </tr>` : ''}
            </table>
          </td>
        </tr>
      </table>

      <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin-top: 16px;">
        <strong>Recommended Action:</strong> Restock this product to avoid losing sales.
        ${stock <= 0
          ? 'This product is currently out of stock and unavailable for purchase.'
          : `Only ${stock} unit${stock === 1 ? '' : 's'} remain — customers may see scarcity messages.`
        }
      </p>

      <a href="${productUrl}" style="display: inline-block; background: #2D6A4F; color: #fff; padding: 13px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 18px;">
        Open Admin Dashboard
      </a>
    `,
  });

  await emailService.sendEmail({
    to: adminEmail,
    subject: `${statusLabel} — ${product.name}`,
    html,
  });
}

/**
 * Escape user/admin-provided text before interpolating into HTML templates.
 * Matches the escapeHtml in email.service.js (kept local to avoid circular deps).
 */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Helper: ensure stock_alerts table + threshold columns exist ──
// Called at startup and before any stock alert operation. Safe / idempotent.
async function ensureStockAlertSchema() {
  try {
    // Check for low_stock_threshold column
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'products'
         AND COLUMN_NAME = 'low_stock_threshold'`
    );
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE products
        ADD COLUMN low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 10 AFTER stock_quantity,
        ADD COLUMN critical_stock_threshold INT UNSIGNED NOT NULL DEFAULT 3 AFTER low_stock_threshold`);
      console.log('[StockAlert] Added low_stock_threshold + critical_stock_threshold to products.');
    }

    // Check for stock_alerts table
    const [tables] = await pool.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stock_alerts'`
    );
    if (tables.length === 0) {
      await pool.query(`
        CREATE TABLE stock_alerts (
          id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          product_id          INT UNSIGNED NOT NULL,
          alert_type          ENUM('LOW_STOCK','CRITICAL','OUT_OF_STOCK') NOT NULL DEFAULT 'LOW_STOCK',
          threshold           INT UNSIGNED NOT NULL DEFAULT 10,
          stock_at_alert      INT NOT NULL DEFAULT 0,
          status              ENUM('ACTIVE','RESOLVED') NOT NULL DEFAULT 'ACTIVE',
          first_alert_sent_at DATETIME DEFAULT NULL,
          resolved_at         DATETIME DEFAULT NULL,
          created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uk_stock_alert_active_product (product_id, status, alert_type),
          INDEX idx_stock_alert_product (product_id),
          INDEX idx_stock_alert_status (status),
          INDEX idx_stock_alert_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('[StockAlert] Created stock_alerts table.');
    }

    // Ensure composite index exists
    const [indexes] = await pool.query(
      `SHOW INDEX FROM products WHERE Key_name = 'idx_products_stock_status'`
    );
    if (indexes.length === 0) {
      await pool.query('CREATE INDEX idx_products_stock_status ON products (is_active, stock_quantity)');
      console.log('[StockAlert] Added idx_products_stock_status index.');
    }
  } catch (err) {
    console.error('[StockAlert] Schema ensure failed:', err.message);
  }
}

module.exports = {
  STOCK_STATUS,
  getStockStatus,
  checkAndAlertStock,
  getAdminEmail,
  ensureStockAlertSchema,
};
