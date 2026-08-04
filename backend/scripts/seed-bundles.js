// ============================================================
// SEED BUNDLES — combo deals for the Offers page
// Idempotent: safe to re-run (upserts bundles by slug, refreshes
// bundle_products). Powers the Bundle Deals section.
//
// Run:  node scripts/seed-bundles.js
// ============================================================
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

// Bundle definitions reference real products by slug (verified against DB).
// original_price = sum of member MRPs (× quantity) — the honest "was" price
// shown as strikethrough; bundle_price is the combo deal price.
const BUNDLES = [
  {
    name: 'Mango Lovers Combo',
    slug: 'mango-lovers-combo',
    description: 'Premium Devgad Alphonso + mango pulp + dried slices',
    bundle_price: 2349,
    original_price: 3747, // MRPs 2499 + 799 + 449
    sort_order: 1,
    items: [
      { slug: 'devgad-alphonso-mango-premium-box-12-pcs', quantity: 1 },
      { slug: 'devgad-hapus-mango-pulp-1kg', quantity: 1 },
      { slug: 'dried-mango-slices-500g', quantity: 1 },
    ],
  },
  {
    name: 'Coastal Seafood Feast',
    slug: 'coastal-seafood-feast',
    description: 'Bombil + sungta prawns + bangda mackerel',
    bundle_price: 1099,
    original_price: 1747, // MRPs 549 + 749 + 449
    sort_order: 2,
    items: [
      { slug: 'sundried-bombay-duck-bombil-500g', quantity: 1 },
      { slug: 'sundried-prawns-sungta-500g', quantity: 1 },
      { slug: 'sundried-mackerel-bangda-500g', quantity: 1 },
    ],
  },
  {
    name: 'Fresh Konkan Coconut Pack',
    slug: 'fresh-konkan-coconut-pack',
    description: 'Tender coconuts + packaged coconut water (2×1L)',
    bundle_price: 499,
    original_price: 757, // MRPs 499 + 129×2
    sort_order: 3,
    items: [
      { slug: 'fresh-tender-coconut-5-pcs', quantity: 1 },
      { slug: 'coconut-water-packaged-1l', quantity: 2 },
    ],
  },
  {
    name: 'Pickle & Spice Combo',
    slug: 'pickle-spice-combo',
    description: 'Mango jam + amchur + kokum — pantry staples',
    bundle_price: 499,
    original_price: 787, // MRPs 249 + 159 + 379
    sort_order: 4,
    items: [
      { slug: 'mango-jam-alphonso-500g', quantity: 1 },
      { slug: 'raw-mango-powder-amchur-200g', quantity: 1 },
      { slug: 'organic-kokum-fruit-500g', quantity: 1 },
    ],
  },
];

const CREATE_BUNDLES = `
CREATE TABLE IF NOT EXISTS bundles (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

const CREATE_BUNDLE_PRODUCTS = `
CREATE TABLE IF NOT EXISTS bundle_products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bundle_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_bundle_product (bundle_id, product_id),
  FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_bp_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar',
    connectTimeout: 8000,
  });

  // 1. Ensure tables exist
  await c.query(CREATE_BUNDLES);
  await c.query(CREATE_BUNDLE_PRODUCTS);
  console.log('✅ bundles + bundle_products tables ready');

  // 2. Upsert bundles by slug, refresh their product mapping
  let bundleCount = 0;
  let itemCount = 0;
  const skipped = [];

  for (const b of BUNDLES) {
    // Resolve member product ids first (skip bundle if any member missing)
    const members = [];
    let ok = true;
    for (const item of b.items) {
      const [rows] = await c.query('SELECT id FROM products WHERE slug = ?', [item.slug]);
      if (rows.length === 0) {
        ok = false;
        skipped.push(`${b.slug} → missing product ${item.slug}`);
        break;
      }
      members.push({ product_id: rows[0].id, quantity: item.quantity });
    }
    if (!ok) continue;

    // Upsert bundle
    await c.query(
      `INSERT INTO bundles (name, slug, description, bundle_price, original_price, is_active, valid_from, valid_until, sort_order)
       VALUES (?, ?, ?, ?, ?, 1, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), description = VALUES(description),
         bundle_price = VALUES(bundle_price), original_price = VALUES(original_price),
         is_active = 1, valid_from = NOW(), valid_until = DATE_ADD(NOW(), INTERVAL 90 DAY),
         sort_order = VALUES(sort_order)`,
      [b.name, b.slug, b.description, b.bundle_price, b.original_price, b.sort_order]
    );

    const [bundleRows] = await c.query('SELECT id FROM bundles WHERE slug = ?', [b.slug]);
    const bundleId = bundleRows[0].id;

    // Refresh member mapping (delete + insert keeps it in sync)
    await c.query('DELETE FROM bundle_products WHERE bundle_id = ?', [bundleId]);
    for (const m of members) {
      await c.query(
        'INSERT INTO bundle_products (bundle_id, product_id, quantity) VALUES (?, ?, ?)',
        [bundleId, m.product_id, m.quantity]
      );
      itemCount++;
    }
    bundleCount++;
  }

  console.log(`✅ Bundles seeded: ${bundleCount} (${itemCount} bundle_products)`);
  if (skipped.length > 0) {
    console.log('⚠ Skipped bundles (missing products):');
    skipped.forEach((s) => console.log(`   ${s}`));
  }

  // Summary
  const [[counts]] = await c.query(
    `SELECT
       (SELECT COUNT(*) FROM bundles WHERE is_active = 1 AND (valid_until IS NULL OR valid_until >= NOW())) AS active_bundles,
       (SELECT COUNT(*) FROM bundle_products) AS total_bundle_products`
  );
  console.log('\n📊 Bundles now in DB:');
  console.log(`   Active bundles: ${counts.active_bundles}`);
  console.log(`   Bundle products: ${counts.total_bundle_products}`);

  await c.end();
  console.log('Done.');
})().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
