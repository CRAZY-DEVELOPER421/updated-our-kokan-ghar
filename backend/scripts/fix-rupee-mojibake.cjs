// One-off fix: the ₹ (U+20B9) symbol was double-encoded to "Ôé╣" in some
// records when the DB was seeded with a non-utf8 client. Restore correct text.
const pool = require('../config/db');

const FIXES = [
  // banners table
  "UPDATE banners SET title = REPLACE(title, 'Ôé╣', '₹') WHERE title LIKE '%Ôé╣%'",
  "UPDATE banners SET subtitle = REPLACE(subtitle, 'Ôé╣', '₹') WHERE subtitle LIKE '%Ôé╣%'",
  // coupons
  "UPDATE coupons SET description = REPLACE(description, 'Ôé╣', '₹') WHERE description LIKE '%Ôé╣%'",
  "UPDATE products SET name = REPLACE(name, 'Ôé╣', '₹'), short_description = REPLACE(short_description, 'Ôé╣', '₹'), description = REPLACE(description, 'Ôé╣', '₹') WHERE name LIKE '%Ôé╣%' OR short_description LIKE '%Ôé╣%' OR description LIKE '%Ôé╣%'",
  // generic cleanup of common mojibake artifacts across text columns
  "UPDATE banners SET title = REPLACE(REPLACE(REPLACE(title, 'â€œ', '\u201C'), 'â€\u009D', '\u201D'), 'â€™', '\u2019') WHERE title LIKE '%â%'",
  "UPDATE banners SET subtitle = REPLACE(REPLACE(REPLACE(subtitle, 'â€œ', '\u201C'), 'â€\u009D', '\u201D'), 'â€™', '\u2019') WHERE subtitle LIKE '%â%'",
];

(async () => {
  for (const q of FIXES) {
    try {
      const [r] = await pool.query(q);
      if (r.affectedRows > 0) console.log(`✓ ${r.affectedRows} row(s): ${q.slice(0, 70)}...`);
    } catch (e) {
      console.error(`✗ ${e.message} — ${q.slice(0, 60)}`);
    }
  }
  console.log('\nDone.');
  process.exit(0);
})().catch(e => { console.error('Fix error:', e.message); process.exit(2); });
