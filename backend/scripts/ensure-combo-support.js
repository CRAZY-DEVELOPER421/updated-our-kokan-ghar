// ============================================================
// ENSURE COMBO SUPPORT — one-time migration for the admin
// "Add Product → Combo/Bundle" feature.
//
//  1. Adds `product_id` column to the existing `bundles` table so a
//     combo product (created from the Add Product form) can link back
//     to its bundle record.
//  2. Creates the "Combo & Bundles" category used for combo packs.
//
// Idempotent: safe to re-run.
//
// Run:  node scripts/ensure-combo-support.js
// ============================================================
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar',
    connectTimeout: 8000,
  });

  // 1. Ensure bundles table exists (fresh DBs)
  await c.query(`CREATE TABLE IF NOT EXISTS bundles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    description VARCHAR(500),
    bundle_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    valid_from DATETIME,
    valid_until DATETIME,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bundles_active (is_active, valid_until),
    INDEX idx_bundles_sort (sort_order),
    INDEX idx_bundles_product (product_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  console.log('✅ bundles table ready');

  // 2. Add product_id column if the table pre-exists without it
  const [cols] = await c.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bundles' AND COLUMN_NAME = 'product_id'"
  );
  if (cols.length === 0) {
    await c.query('ALTER TABLE bundles ADD COLUMN product_id INT UNSIGNED NULL AFTER id, ADD INDEX idx_bundles_product (product_id)');
    console.log('✅ bundles.product_id column added');
  } else {
    console.log('ℹ bundles.product_id already exists');
  }

  // 3. Ensure bundle_products table
  await c.query(`CREATE TABLE IF NOT EXISTS bundle_products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bundle_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    UNIQUE KEY uk_bundle_product (bundle_id, product_id),
    FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_bp_product (product_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  console.log('✅ bundle_products table ready');

  // 4. Create the "Combo & Bundles" category if missing
  const [cats] = await c.query("SELECT id FROM categories WHERE slug = 'combo-bundles'");
  if (cats.length === 0) {
    await c.query(
      `INSERT INTO categories (name, slug, description, sort_order, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [
        'Combo & Bundles',
        'combo-bundles',
        'Ready-made combo packs and bundle deals that combine multiple Konkan products at a special price.',
        999,
      ]
    );
    console.log('✅ Category "Combo & Bundles" created');
  } else {
    console.log('ℹ Category "Combo & Bundles" already exists');
  }

  await c.end();
  console.log('Done. Combo pack support is ready.');
})().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
