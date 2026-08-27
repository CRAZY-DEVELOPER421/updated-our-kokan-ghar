/**
 * Apply Marathi translations to the products table.
 * Usage: node database/apply-product-translations.js
 *
 * Reads the translation mapping from product-translations-mr.js
 * and updates products whose English name matches.
 */

const pool = require('../backend/config/db');
const translations = require('./product-translations-mr');

async function applyTranslations() {
  console.log(`Applying ${translations.length} Marathi translations...\n`);

  let updated = 0;
  let notFound = 0;

  for (const t of translations) {
    try {
      // Try exact match first, then LIKE match (for products with weight suffix like "– 500g")
      const [result] = await pool.query(
        `UPDATE products SET name_mr = ?, description_mr = ?, short_description_mr = ? 
         WHERE (name = ? OR name LIKE ?) AND (name_mr IS NULL OR name_mr = '')`,
        [t.name_mr, t.description_mr || null, t.description_mr || null, t.name_en, `%${t.name_en}%`]
      );

      if (result.affectedRows > 0) {
        updated += result.affectedRows;
        console.log(`  ✅ ${t.name_en} → ${t.name_mr} (${result.affectedRows} product(s))`);
      } else {
        // Check if product exists but already has translation
        const [existing] = await pool.query('SELECT id, name_mr FROM products WHERE name = ? OR name LIKE ?', [t.name_en, `%${t.name_en}%`]);
        if (existing.length > 0 && existing[0].name_mr) {
          console.log(`  ⏭️  ${t.name_en} — already translated`);
          updated++;
        } else {
          notFound++;
          console.log(`  ❌ ${t.name_en} — not found in database`);
        }
      }
    } catch (err) {
      console.error(`  ❌ ${t.name_en} — error: ${err.message}`);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Not found: ${notFound}`);

  // Show summary
  const [count] = await pool.query('SELECT COUNT(*) as total FROM products WHERE name_mr IS NOT NULL AND name_mr != ""');
  console.log(`Total products with Marathi translations: ${count[0].total}`);

  await pool.end();
  process.exit(0);
}

applyTranslations().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
