// ============================================================
// SEED OFFERS — coupons + bank offers
// Idempotent: safe to re-run. Powers the Offers & Deals page.
// (Flash sales are created via the admin panel — the old seed
// entries referenced product slugs that no longer exist.)
//
// Run:  node scripts/seed-offers.js
// ============================================================
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

const COUPONS = [
  { code: 'KONKAN100', type: 'flat', value: 100, min_order_amount: 299, max_discount: 100, usage_limit: 1000, description: 'Flat ₹100 off on orders above ₹299' },
  { code: 'FIRST20', type: 'percentage', value: 20, min_order_amount: 499, max_discount: 200, usage_limit: 500, description: '20% off on first order (max ₹200)' },
  { code: 'FREESHIP', type: 'free_shipping', value: 0, min_order_amount: 499, max_discount: null, usage_limit: 9999, description: 'Free shipping on all orders above ₹499' },
  { code: 'WELCOME15', type: 'percentage', value: 15, min_order_amount: 0, max_discount: 150, usage_limit: 2000, description: '15% off welcome coupon for new customers' },
  { code: 'CASHEW50', type: 'flat', value: 50, min_order_amount: 299, max_discount: 50, usage_limit: 500, description: '₹50 off on cashew products (min ₹299)' },
  { code: 'SEAFOOD10', type: 'percentage', value: 10, min_order_amount: 749, max_discount: 150, usage_limit: 500, description: '10% off on seafood orders above ₹749' },
  { code: 'FESTIVE25', type: 'percentage', value: 25, min_order_amount: 1499, max_discount: 500, usage_limit: 200, description: '25% off festive special (min ₹1499)' },
  { code: 'BOGOSNACKS', type: 'bogo', value: 0, min_order_amount: 499, max_discount: null, usage_limit: 300, description: 'Buy 1 Get 1 on select traditional Konkan snacks' },
];

const BANK_OFFERS = [
  { bank_name: 'HDFC Bank', bank_code: 'HDFC', logo_url: null, offer_title: 'Up to ₹150 OFF on credit cards', offer_description: 'Flat discount on HDFC Credit Card transactions', discount_type: 'credit_card', min_order_amount: 999, max_discount: 150, terms_url: null, sort_order: 1 },
  { bank_name: 'ICICI Bank', bank_code: 'ICICI', logo_url: null, offer_title: 'Up to ₹125 OFF on credit cards', offer_description: 'Instant discount on ICICI Credit Card payments', discount_type: 'credit_card', min_order_amount: 999, max_discount: 125, terms_url: null, sort_order: 2 },
  { bank_name: 'State Bank of India', bank_code: 'SBI', logo_url: null, offer_title: '10% off on debit cards', offer_description: '10% instant discount on SBI Debit Card transactions', discount_type: 'debit_card', min_order_amount: 1499, max_discount: 200, terms_url: null, sort_order: 3 },
  { bank_name: 'Axis Bank', bank_code: 'AXIS', logo_url: null, offer_title: '₹100 OFF on UPI payments', offer_description: 'Flat ₹100 cashback on Axis UPI payments', discount_type: 'upi', min_order_amount: 799, max_discount: 100, terms_url: null, sort_order: 4 },
  { bank_name: 'Kotak Mahindra Bank', bank_code: 'KOTAK', logo_url: null, offer_title: 'No-cost EMI on orders above ₹2,999', offer_description: 'Pay in easy EMI installments with zero interest', discount_type: 'emi', min_order_amount: 2999, max_discount: null, terms_url: null, sort_order: 5 },
];

const CREATE_BANK_OFFERS = `
CREATE TABLE IF NOT EXISTS bank_offers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  bank_code VARCHAR(20),
  logo_url VARCHAR(500),
  offer_title VARCHAR(255) NOT NULL,
  offer_description VARCHAR(500),
  discount_type ENUM('credit_card','debit_card','upi','emi','netbanking') NOT NULL DEFAULT 'credit_card',
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(10,2),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  valid_from DATETIME,
  valid_until DATETIME,
  terms_url VARCHAR(500),
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_bo_offer (bank_code, offer_title),
  INDEX idx_bo_active (is_active, valid_until),
  INDEX idx_bo_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`;

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar',
    connectTimeout: 8000,
  });

  // 1. Ensure bank_offers table exists
  await c.query(CREATE_BANK_OFFERS);
  console.log('bank_offers table ready');

  // 2. Coupons — upsert with RELATIVE validity so they stay active
  let couponCount = 0;
  for (const cp of COUPONS) {
    await c.query(
      `INSERT INTO coupons (code, type, value, min_order_amount, max_discount, usage_limit, is_active, valid_from, valid_until, description)
       VALUES (?, ?, ?, ?, ?, ?, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 90 DAY), ?)
       ON DUPLICATE KEY UPDATE
         type = VALUES(type), value = VALUES(value),
         min_order_amount = VALUES(min_order_amount), max_discount = VALUES(max_discount),
         usage_limit = VALUES(usage_limit), is_active = 1,
         valid_from = DATE_SUB(NOW(), INTERVAL 1 DAY),
         valid_until = DATE_ADD(NOW(), INTERVAL 90 DAY),
         description = VALUES(description)`,
      [cp.code, cp.type, cp.value, cp.min_order_amount, cp.max_discount, cp.usage_limit, cp.description]
    );
    couponCount++;
  }
  console.log(`Coupons upserted: ${couponCount}`);

  // 3. Bank offers — INSERT IGNORE (uk_bo_offer prevents duplicates)
  let bankCount = 0;
  for (const bo of BANK_OFFERS) {
    await c.query(
      `INSERT IGNORE INTO bank_offers (bank_name, bank_code, logo_url, offer_title, offer_description, discount_type, min_order_amount, max_discount, is_active, valid_from, valid_until, terms_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?)`,
      [bo.bank_name, bo.bank_code, bo.logo_url, bo.offer_title, bo.offer_description, bo.discount_type, bo.min_order_amount, bo.max_discount, bo.terms_url, bo.sort_order]
    );
    bankCount++;
  }
  console.log(`Bank offers seeded: ${bankCount}`);

  // Summary
  const [[counts]] = await c.query(
    `SELECT
       (SELECT COUNT(*) FROM coupons WHERE is_active = 1 AND valid_until >= NOW()) AS active_coupons,
       (SELECT COUNT(*) FROM bank_offers WHERE is_active = 1 AND (valid_until IS NULL OR valid_until >= NOW())) AS active_bank_offers`
  );
  console.log('\nActive data now in DB:');
  console.log(`   Coupons:      ${counts.active_coupons}`);
  console.log(`   Bank offers:  ${counts.active_bank_offers}`);

  await c.end();
  console.log('Done.');
})().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
