/**
 * Phase 4 DB Migration — Advanced Push Notification tables
 * 
 * Tables created:
 *   1. push_campaigns      — analytics log (sent/delivered/clicked per campaign)
 *   2. push_rate_limits     — daily rate limiting per user
 *   3. product_watches      — users watching products for price drops
 *   4. push_subscriptions   — add region column for region targeting
 */

const pool = require('../config/db');

async function migrate() {
  console.log('[Phase4 Migration] Starting...');

  // 1. push_campaigns — tracks every push batch
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_campaigns (
      id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      campaign_type   ENUM('flash_sale','price_drop','order_update','abandoned_cart','region_offer','manual','other') NOT NULL DEFAULT 'other',
      title           VARCHAR(255) NOT NULL,
      body            TEXT,
      url             VARCHAR(500),
      image_url       VARCHAR(500),
      target_region   VARCHAR(100) DEFAULT NULL,
      target_user_id  INT UNSIGNED DEFAULT NULL,
      total_sent      INT UNSIGNED NOT NULL DEFAULT 0,
      total_delivered INT UNSIGNED NOT NULL DEFAULT 0,
      total_clicked   INT UNSIGNED NOT NULL DEFAULT 0,
      total_failed    INT UNSIGNED NOT NULL DEFAULT 0,
      created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_pc_type (campaign_type),
      INDEX idx_pc_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✅ push_campaigns table ready');

  // 2. push_rate_limits — prevents spam (max N pushes per user per day)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS push_rate_limits (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED NOT NULL,
      push_date   DATE NOT NULL,
      push_count  INT UNSIGNED NOT NULL DEFAULT 1,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_date (user_id, push_date),
      INDEX idx_prl_date (push_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✅ push_rate_limits table ready');

  // 3. product_watches — users watching products for price drops
  await pool.query(`
    CREATE TABLE IF NOT EXISTS product_watches (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED NOT NULL,
      product_id  INT UNSIGNED NOT NULL,
      watched_price DECIMAL(10,2) NOT NULL,
      notified    TINYINT(1) NOT NULL DEFAULT 0,
      created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_product (user_id, product_id),
      INDEX idx_pw_product (product_id),
      INDEX idx_pw_notified (notified)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('  ✅ product_watches table ready');

  // 4. Add region column to push_subscriptions (if not exists)
  try {
    const [cols] = await pool.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'push_subscriptions' AND COLUMN_NAME = 'region'
    `);
    if (cols.length === 0) {
      await pool.query(`ALTER TABLE push_subscriptions ADD COLUMN region VARCHAR(100) DEFAULT NULL`);
      await pool.query(`ALTER TABLE push_subscriptions ADD INDEX idx_ps_region (region)`);
      console.log('  ✅ push_subscriptions.region column added');
    } else {
      console.log('  ✅ push_subscriptions.region already exists');
    }
  } catch (err) {
    console.error('  ⚠️  Region column migration skipped:', err.message);
  }

  console.log('[Phase4 Migration] Done ✅');
  process.exit(0);
}

migrate().catch(err => {
  console.error('[Phase4 Migration] FAILED:', err);
  process.exit(1);
});
