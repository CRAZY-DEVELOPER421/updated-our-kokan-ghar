// Audit script: find mojibake (double-encoded UTF-8) strings in the DB
const pool = require('../config/db');

// Double-encoded UTF-8 artifacts: 'â€"', 'Ã©', 'Ôé╣' (₹ mojibake), 'â€™' (') etc.
const MOJIBAKE_PATTERNS = [
  { label: 'rupee-mojibake', regex: /Ôé╣|â‚¹/ },
  { label: 'apostrophe', regex: /â€™/ },
  { label: 'quote', regex: /â€œ|â€\x9d|â€œ/ },
  { label: 'em-dash', regex: /â€"/ },
  { label: 'generic-Ã', regex: /Ã[©ª¯]|Ã¨|Ã©/ },
  { label: 'Â-extra', regex: /Â/ },
];

(async () => {
  const tables = ['banners', 'products', 'categories', 'coupons', 'bank_offers', 'flash_sales', 'bundles', 'customer_service_pages', 'cms_posts', 'cms_videos', 'settings'];
  let found = false;
  for (const table of tables) {
    let cols;
    try {
      [cols] = await pool.query(
        "SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND DATA_TYPE IN ('varchar','text','longtext','mediumtext','tinytext','char')",
        [table]
      );
    } catch (e) { continue; }
    if (!cols.length) continue;
    const colNames = cols.map(c => c.COLUMN_NAME);
    for (const col of colNames) {
      const [rows] = await pool.query(`SELECT id, \`${col}\` AS val FROM \`${table}\` WHERE \`${col}\` IS NOT NULL LIMIT 200`);
      for (const row of rows) {
        if (typeof row.val !== 'string') continue;
        for (const pat of MOJIBAKE_PATTERNS) {
          if (pat.regex.test(row.val)) {
            found = true;
            console.log(`[${pat.label}] ${table}.${col} id=${row.id}: ${JSON.stringify(row.val).slice(0, 120)}`);
            break;
          }
        }
      }
    }
  }
  console.log(found ? '\n=== MOJIBAKE FOUND (see above) ===' : '\n=== No mojibake found ===');
  process.exit(found ? 1 : 0);
})().catch(e => { console.error('Scan error:', e.message); process.exit(2); });
