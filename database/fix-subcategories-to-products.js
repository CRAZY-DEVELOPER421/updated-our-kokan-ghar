/**
 * FIX: Convert incorrectly-created subcategories into PRODUCTS.
 *
 * 1. Deletes subcategories under the NEW top-level categories I created
 *    (keeps original subcategories like "Alphonso Mangoes", "Coconut Oil" untouched)
 * 2. Creates PRODUCTS from those deleted items instead
 *
 * Usage: cd backend && NODE_PATH=./node_modules node ../database/fix-subcategories-to-products.js
 */

const mysql = require('mysql2/promise');
const slugify = require('slugify');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

// ── Product data: category_name → [product names] ─────────
// These are the items I incorrectly created as subcategories.
// Now they will become products.
const PRODUCTS_BY_CATEGORY = {
  'Fresh Fruits': [
    { name: 'Alphonso Mango', price: 1899, mrp: 2499, sku_prefix: 'ALP' },
    { name: 'Payri Mango', price: 999, mrp: 1499, sku_prefix: 'PAY' },
    { name: 'Mankurad Mango', price: 1599, mrp: 2199, sku_prefix: 'MAN' },
    { name: 'Kesar Mango', price: 1399, mrp: 1899, sku_prefix: 'KES' },
    { name: 'Totapuri Mango', price: 699, mrp: 999, sku_prefix: 'TOT' },
    { name: 'Rajapuri Mango', price: 799, mrp: 1199, sku_prefix: 'RAJ' },
    { name: 'Raw Mango', price: 399, mrp: 599, sku_prefix: 'RAW' },
    { name: 'Jackfruit', price: 499, mrp: 699, sku_prefix: 'JCK' },
    { name: 'Cashew Apple', price: 299, mrp: 449, sku_prefix: 'CAP' },
    { name: 'Banana', price: 199, mrp: 299, sku_prefix: 'BAN' },
    { name: 'Jamun', price: 399, mrp: 599, sku_prefix: 'JAM' },
    { name: 'Karvanda', price: 249, mrp: 399, sku_prefix: 'KAR' },
    { name: 'Kokum', price: 299, mrp: 449, sku_prefix: 'KOK' },
    { name: 'Pineapple', price: 399, mrp: 599, sku_prefix: 'PIN' },
    { name: 'Papaya', price: 299, mrp: 449, sku_prefix: 'PAP' },
    { name: 'Watermelon', price: 349, mrp: 499, sku_prefix: 'WAT' },
    { name: 'Sitaphal', price: 499, mrp: 699, sku_prefix: 'SIT' },
    { name: 'Tender Coconut', price: 149, mrp: 199, sku_prefix: 'TCO' },
  ],
  'Fresh Vegetables': [
    { name: 'Tendli', price: 149, mrp: 199, sku_prefix: 'TEN' },
    { name: 'Ratale (Sweet Potato)', price: 199, mrp: 299, sku_prefix: 'RAT' },
    { name: 'Suran (Elephant Foot Yam)', price: 249, mrp: 349, sku_prefix: 'SUR' },
    { name: 'Colocasia', price: 179, mrp: 249, sku_prefix: 'COL' },
    { name: 'Drumstick', price: 149, mrp: 199, sku_prefix: 'DRU' },
    { name: 'Brinjal', price: 99, mrp: 149, sku_prefix: 'BRI' },
    { name: 'Pumpkin', price: 129, mrp: 179, sku_prefix: 'PUM' },
    { name: 'Raw Banana', price: 99, mrp: 149, sku_prefix: 'RBA' },
    { name: 'Green Chilli', price: 99, mrp: 149, sku_prefix: 'GCH' },
    { name: 'Okra', price: 149, mrp: 199, sku_prefix: 'OKR' },
    { name: 'Cluster Beans', price: 149, mrp: 199, sku_prefix: 'CLB' },
    { name: 'Ash Gourd', price: 129, mrp: 179, sku_prefix: 'AGD' },
    { name: 'Bottle Gourd', price: 129, mrp: 179, sku_prefix: 'BGD' },
  ],
  'Dry Fruits & Nuts': [
    { name: 'Cashew', price: 899, mrp: 1199, sku_prefix: 'CSW' },
    { name: 'Roasted Cashew', price: 999, mrp: 1299, sku_prefix: 'RCS' },
    { name: 'Salted Cashew', price: 999, mrp: 1299, sku_prefix: 'SCS' },
    { name: 'Masala Cashew', price: 1099, mrp: 1399, sku_prefix: 'MCS' },
    { name: 'Honey Cashew', price: 1199, mrp: 1499, sku_prefix: 'HCS' },
    { name: 'Cashew Pieces', price: 699, mrp: 899, sku_prefix: 'CSP' },
    { name: 'Cashew Flour', price: 499, mrp: 699, sku_prefix: 'CSF' },
    { name: 'Cashew Butter', price: 699, mrp: 899, sku_prefix: 'CSB' },
    { name: 'Cashew Milk', price: 399, mrp: 549, sku_prefix: 'CSM' },
    { name: 'Almonds', price: 799, mrp: 1099, sku_prefix: 'ALM' },
    { name: 'Walnuts', price: 899, mrp: 1199, sku_prefix: 'WLN' },
    { name: 'Raisins', price: 399, mrp: 549, sku_prefix: 'RSN' },
    { name: 'Figs', price: 599, mrp: 799, sku_prefix: 'FIG' },
  ],
  'Mango Products': [
    { name: 'Aamras', price: 399, mrp: 549, sku_prefix: 'AAM' },
    { name: 'Mango Pulp', price: 349, mrp: 499, sku_prefix: 'MPL' },
    { name: 'Mango Jam', price: 249, mrp: 349, sku_prefix: 'MJA' },
    { name: 'Mango Squash', price: 299, mrp: 399, sku_prefix: 'MSQ' },
    { name: 'Mango Bar', price: 199, mrp: 299, sku_prefix: 'MBA' },
    { name: 'Aam Papad', price: 149, mrp: 199, sku_prefix: 'APA' },
    { name: 'Dried Mango', price: 299, mrp: 449, sku_prefix: 'DMA' },
    { name: 'Raw Mango Powder', price: 199, mrp: 299, sku_prefix: 'RMP' },
    { name: 'Mango Candy', price: 149, mrp: 199, sku_prefix: 'MCA' },
  ],
  'Rice & Grains': [
    { name: 'Indrayani Rice', price: 549, mrp: 699, sku_prefix: 'IRI' },
    { name: 'Ambemohar Rice', price: 599, mrp: 799, sku_prefix: 'ARI' },
    { name: 'Red Rice', price: 399, mrp: 549, sku_prefix: 'RRI' },
    { name: 'Brown Rice', price: 449, mrp: 599, sku_prefix: 'BRI' },
    { name: 'Kolam Rice', price: 499, mrp: 649, sku_prefix: 'KRI' },
    { name: 'Ukda Rice', price: 399, mrp: 549, sku_prefix: 'URI' },
    { name: 'Hand Pounded Rice', price: 599, mrp: 799, sku_prefix: 'HPR' },
    { name: 'Govind Bhog Rice', price: 699, mrp: 899, sku_prefix: 'GBR' },
    { name: 'Rice Flour', price: 199, mrp: 299, sku_prefix: 'RFL' },
    { name: 'Poha', price: 149, mrp: 199, sku_prefix: 'POH' },
    { name: 'Brown Poha', price: 179, mrp: 249, sku_prefix: 'BPO' },
    { name: 'Gavthi Brown Poha', price: 199, mrp: 299, sku_prefix: 'GBP' },
    { name: 'Murmura', price: 99, mrp: 149, sku_prefix: 'MUR' },
  ],
  'Flours': [
    { name: 'Rice Flour', price: 199, mrp: 299, sku_prefix: 'RF2' },
    { name: 'Nachni Flour', price: 249, mrp: 349, sku_prefix: 'NFL' },
    { name: 'Jowar Flour', price: 199, mrp: 299, sku_prefix: 'JFL' },
    { name: 'Bajra Flour', price: 199, mrp: 299, sku_prefix: 'BFL' },
    { name: 'Bhakri Flour', price: 149, mrp: 199, sku_prefix: 'BHF' },
    { name: 'Kombdi Vade Flour', price: 249, mrp: 349, sku_prefix: 'KVF' },
    { name: 'Multigrain Flour', price: 299, mrp: 399, sku_prefix: 'MGF' },
  ],
  'Masalas & Spices': [
    { name: 'Malvani Masala', price: 199, mrp: 299, sku_prefix: 'MMA' },
    { name: 'Fish Curry Masala', price: 149, mrp: 199, sku_prefix: 'FCM' },
    { name: 'Chicken Masala', price: 149, mrp: 199, sku_prefix: 'CHM' },
    { name: 'Goda Masala', price: 199, mrp: 299, sku_prefix: 'GMA' },
    { name: 'Garam Masala', price: 149, mrp: 199, sku_prefix: 'GRM' },
    { name: 'Turmeric Powder', price: 99, mrp: 149, sku_prefix: 'TUR' },
    { name: 'Black Pepper', price: 299, mrp: 399, sku_prefix: 'BPE' },
    { name: 'Byadgi Chilli', price: 249, mrp: 349, sku_prefix: 'BCH' },
    { name: 'Red Chilli Powder', price: 199, mrp: 299, sku_prefix: 'RCP' },
    { name: 'Jeera (Cumin)', price: 199, mrp: 299, sku_prefix: 'JEE' },
    { name: 'Coriander Powder', price: 149, mrp: 199, sku_prefix: 'COR' },
    { name: 'Cardamom', price: 399, mrp: 549, sku_prefix: 'CAR' },
    { name: 'Cloves', price: 349, mrp: 499, sku_prefix: 'CLO' },
    { name: 'Dalchini (Cinnamon)', price: 249, mrp: 349, sku_prefix: 'DAL' },
    { name: 'Tirphal (Teppal)', price: 399, mrp: 549, sku_prefix: 'TIR' },
    { name: 'Nutmeg', price: 299, mrp: 399, sku_prefix: 'NUT' },
    { name: 'Mace', price: 399, mrp: 549, sku_prefix: 'MAC' },
    { name: 'Star Anise', price: 299, mrp: 399, sku_prefix: 'STA' },
  ],
  'Pickles': [
    { name: 'Mango Pickle', price: 249, mrp: 349, sku_prefix: 'MPI' },
    { name: 'Lime Pickle', price: 199, mrp: 299, sku_prefix: 'LPI' },
    { name: 'Garlic Pickle', price: 299, mrp: 399, sku_prefix: 'GPI' },
    { name: 'Green Chilli Pickle', price: 249, mrp: 349, sku_prefix: 'GCP' },
    { name: 'Prawn Pickle', price: 449, mrp: 599, sku_prefix: 'PPI' },
    { name: 'Fish Pickle', price: 399, mrp: 549, sku_prefix: 'FPI' },
    { name: 'Karvanda Pickle', price: 249, mrp: 349, sku_prefix: 'KPI' },
    { name: 'Jackfruit Pickle', price: 299, mrp: 399, sku_prefix: 'JPI' },
    { name: 'Mixed Vegetable Pickle', price: 199, mrp: 299, sku_prefix: 'MVP' },
    { name: 'Tendli Pickle', price: 249, mrp: 349, sku_prefix: 'TPI' },
  ],
  'Chutneys': [
    { name: 'Dry Coconut Chutney', price: 149, mrp: 199, sku_prefix: 'DCC' },
    { name: 'Peanut Chutney', price: 129, mrp: 179, sku_prefix: 'PNC' },
    { name: 'Garlic Chutney', price: 149, mrp: 199, sku_prefix: 'GAC' },
    { name: 'Sesame Chutney', price: 149, mrp: 199, sku_prefix: 'SEC' },
    { name: 'Dry Fish Chutney', price: 199, mrp: 299, sku_prefix: 'DFC' },
    { name: 'Kokum Chutney', price: 149, mrp: 199, sku_prefix: 'KOC' },
    { name: 'Tamarind Chutney', price: 129, mrp: 179, sku_prefix: 'TAC' },
  ],
  'Seafood': [
    { name: 'Dry Fish', price: 399, mrp: 549, sku_prefix: 'DFI' },
    { name: 'Dry Bombil (Bombay Duck)', price: 449, mrp: 599, sku_prefix: 'DBO' },
    { name: 'Dry Jawla (Shrimp)', price: 499, mrp: 649, sku_prefix: 'DJA' },
    { name: 'Dry Kolambi (Prawns)', price: 599, mrp: 799, sku_prefix: 'DKO' },
    { name: 'Dry Mandeli', price: 349, mrp: 499, sku_prefix: 'DMA' },
  ],
  'Snacks': [
    { name: 'Chakli', price: 149, mrp: 199, sku_prefix: 'CHA' },
    { name: 'Murukku', price: 149, mrp: 199, sku_prefix: 'MUR' },
    { name: 'Chivda', price: 129, mrp: 179, sku_prefix: 'CHI' },
    { name: 'Banana Chips', price: 149, mrp: 199, sku_prefix: 'BCH' },
    { name: 'Jackfruit Chips', price: 199, mrp: 299, sku_prefix: 'JCH' },
    { name: 'Rice Papad', price: 99, mrp: 149, sku_prefix: 'RPA' },
    { name: 'Sabudana Papad', price: 99, mrp: 149, sku_prefix: 'SPA' },
    { name: 'Kurdai', price: 129, mrp: 179, sku_prefix: 'KUR' },
    { name: 'Sandge', price: 149, mrp: 199, sku_prefix: 'SAN' },
    { name: 'Peanut Chikki', price: 149, mrp: 199, sku_prefix: 'PCH' },
    { name: 'Til Ladoo', price: 199, mrp: 299, sku_prefix: 'TIL' },
  ],
  'Sweets': [
    { name: 'Kaju Katli', price: 499, mrp: 699, sku_prefix: 'KAT' },
    { name: 'Coconut Barfi', price: 299, mrp: 399, sku_prefix: 'CBA' },
    { name: 'Khobra Pak', price: 349, mrp: 499, sku_prefix: 'KHP' },
    { name: 'Ukadiche Modak Mix', price: 249, mrp: 349, sku_prefix: 'UMM' },
    { name: 'Modak', price: 399, mrp: 549, sku_prefix: 'MOD' },
    { name: 'Phanas Poli', price: 299, mrp: 399, sku_prefix: 'PPO' },
    { name: 'Aam Papad', price: 149, mrp: 199, sku_prefix: 'AMP' },
    { name: 'Mango Burfi', price: 349, mrp: 499, sku_prefix: 'MBU' },
  ],
  'Beverages': [
    { name: 'Kokum Juice', price: 199, mrp: 299, sku_prefix: 'KJU' },
    { name: 'Sugarcane Juice', price: 149, mrp: 199, sku_prefix: 'SJU' },
    { name: 'Fresh Lime Juice', price: 149, mrp: 199, sku_prefix: 'LJU' },
    { name: 'Coconut Water', price: 99, mrp: 149, sku_prefix: 'CWA' },
    { name: 'Buttermilk Mix', price: 129, mrp: 179, sku_prefix: 'BTM' },
    { name: 'Cashew Apple Juice', price: 249, mrp: 349, sku_prefix: 'CAJ' },
    { name: 'Mango Juice', price: 199, mrp: 299, sku_prefix: 'MJU' },
  ],
  'Natural Sweeteners': [
    { name: 'Jaggery', price: 199, mrp: 299, sku_prefix: 'JAG' },
    { name: 'Palm Jaggery', price: 249, mrp: 349, sku_prefix: 'PJA' },
    { name: 'Coconut Jaggery', price: 299, mrp: 399, sku_prefix: 'CJA' },
    { name: 'Jaggery Powder', price: 199, mrp: 299, sku_prefix: 'JPO' },
    { name: 'Raw Honey', price: 599, mrp: 799, sku_prefix: 'HON' },
    { name: 'Wild Honey', price: 799, mrp: 999, sku_prefix: 'WHO' },
  ],
  'Ready To Cook': [
    { name: 'Ghavne Mix', price: 149, mrp: 199, sku_prefix: 'GHA' },
    { name: 'Thalipeeth Mix', price: 149, mrp: 199, sku_prefix: 'THM' },
    { name: 'Kombdi Vade Mix', price: 199, mrp: 299, sku_prefix: 'KVM' },
    { name: 'Modak Mix', price: 199, mrp: 299, sku_prefix: 'MDM' },
    { name: 'Sol Kadhi Mix', price: 149, mrp: 199, sku_prefix: 'SKM' },
  ],
  'Traditional Foods': [
    { name: 'Rice Bhakri', price: 99, mrp: 149, sku_prefix: 'RBH' },
    { name: 'Nachni Bhakri', price: 129, mrp: 179, sku_prefix: 'NBH' },
    { name: 'Bhakri Flour', price: 149, mrp: 199, sku_prefix: 'BHF' },
    { name: 'Sol Kadhi', price: 199, mrp: 299, sku_prefix: 'SKD' },
    { name: 'Kombdi Vade', price: 299, mrp: 399, sku_prefix: 'KVD' },
  ],
  'Eco Friendly Products': [
    { name: 'Areca Leaf Plates (10 pcs)', price: 149, mrp: 199, sku_prefix: 'ALP' },
    { name: 'Banana Fiber Products', price: 249, mrp: 349, sku_prefix: 'BFP' },
    { name: 'Bamboo Basket', price: 399, mrp: 549, sku_prefix: 'BBA' },
    { name: 'Coconut Shell Handicrafts', price: 299, mrp: 449, sku_prefix: 'CSH' },
    { name: 'Wooden Spice Box', price: 499, mrp: 699, sku_prefix: 'WSB' },
    { name: 'Handloom Towel Set', price: 399, mrp: 549, sku_prefix: 'HTO' },
    { name: 'Coir Products', price: 199, mrp: 299, sku_prefix: 'COI' },
  ],
  'Gift Hampers': [
    { name: 'Mango Gift Box', price: 1499, mrp: 1999, sku_prefix: 'MGB' },
    { name: 'Cashew Gift Box', price: 1299, mrp: 1699, sku_prefix: 'CGB' },
    { name: 'Konkan Festival Box', price: 1999, mrp: 2499, sku_prefix: 'KFB' },
    { name: 'Healthy Konkan Box', price: 1599, mrp: 1999, sku_prefix: 'HKB' },
    { name: 'Traditional Konkan Box', price: 1799, mrp: 2299, sku_prefix: 'TKB' },
    { name: 'Corporate Gift Hamper', price: 2999, mrp: 3999, sku_prefix: 'CGH' },
  ],
};

// ── Helpers ──────────────────────────────────────────────
function slugifyName(text) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

async function getUniqueSlug(pool, baseSlug) {
  let slug = baseSlug;
  let suffix = 0;
  while (true) {
    const [rows] = await pool.query('SELECT id FROM products WHERE slug = ?', [slug]);
    if (rows.length === 0) return slug;
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }
}

// ── MAIN ──────────────────────────────────────────────────
async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar',
    waitForConnections: true,
    connectionLimit: 1,
    charset: 'utf8mb4',
  });

  try {
    // ── Step 1: Delete incorrect subcategories under NEW top-level categories ──
    // Get all top-level categories first
    const [topCats] = await pool.query(
      'SELECT id, name FROM categories WHERE parent_id IS NULL ORDER BY name'
    );

    // Build lookup: category_name → category_id
    const catNameToId = {};
    for (const c of topCats) catNameToId[c.name] = c.id;

    let deletedCount = 0;

    for (const [catName, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
      const catId = catNameToId[catName];
      if (!catId) {
        console.log(`⚠️  Category "${catName}" not found in top-level categories, skipping.`);
        continue;
      }

      // Delete subcategories under this category that match our product names
      const productNames = products.map(p => p.name);
      
      // Get subcategory IDs to delete
      const [subs] = await pool.query(
        'SELECT id, name FROM categories WHERE parent_id = ? AND name IN (?)',
        [catId, productNames]
      );

      if (subs.length > 0) {
        const idsToDelete = subs.map(s => s.id);
        //First, update any products referencing these categories to use the parent
        await pool.query(
          'UPDATE products SET category_id = ? WHERE category_id IN (?)',
          [catId, idsToDelete]
        );
        // Now delete the subcategories
        await pool.query('DELETE FROM categories WHERE id IN (?)', [idsToDelete]);
        deletedCount += subs.length;
        console.log(`🗑️  Deleted ${subs.length} subcategories under "${catName}": ${subs.map(s => s.name).join(', ')}`);
      } else {
        console.log(`⏭️  No subcategories to delete under "${catName}"`);
      }
    }

    console.log(`\n✅ Deleted ${deletedCount} subcategories total.\n`);

    // ── Step 2: Create products ──
    let created = 0;
    let skipped = 0;

    for (const [catName, products] of Object.entries(PRODUCTS_BY_CATEGORY)) {
      const catId = catNameToId[catName];
      if (!catId) {
        console.log(`⚠️  Category "${catName}" not found, skipping ${products.length} products.`);
        skipped += products.length;
        continue;
      }

      for (const prod of products) {
        // Check if product already exists by name
        const [existing] = await pool.query(
          'SELECT id FROM products WHERE name = ? AND category_id = ?',
          [prod.name, catId]
        );
        if (existing.length > 0) {
          console.log(`⏭️  "${prod.name}" already exists as product, skipping.`);
          skipped++;
          continue;
        }

        const slug = await getUniqueSlug(pool, slugifyName(prod.name));
        const sku = `KB-${prod.sku_prefix}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
        const discountPercent = Math.round(((prod.mrp - prod.price) / prod.mrp) * 100);

        await pool.query(
          `INSERT INTO products (name, slug, description, short_description, price, mrp, stock_quantity, sku, category_id, brand, weight_grams, unit, is_active, is_featured)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
          [
            prod.name,
            slug,
            `Premium ${prod.name} sourced directly from the Konkan region. Fresh, authentic, and delivered with care.`,
            `Fresh ${prod.name} from Konkan.`,
            prod.price,
            prod.mrp,
            Math.floor(Math.random() * 100) + 20, // stock: 20-120
            sku,
            catId,
            'Konkan Bazaar',
            prod.price > 500 ? 500 : 250, // weight estimate
            'piece',
          ]
        );
        created++;
        console.log(`✅ "${prod.name}" → Category: "${catName}" | ₹${prod.price} | SKU: ${sku}`);
      }
    }

    console.log(`\n🎉 Complete! Created ${created} products, skipped ${skipped} duplicates.`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
