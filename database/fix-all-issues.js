/**
 * COMPREHENSIVE FIX: Clean up all category-product mismatches.
 *
 * Issues found:
 * 1. "Mangoes" subcategory under "Fresh Fruits" with 7 children (should be products)
 * 2. 8 orphan Cashew variant top-level categories (should be products under "Dry Fruits & Nuts")
 * 3. Nested subcategories under "Kokum Products" (should be products under "Kokum Products" top-level)
 *
 * Usage: cd backend && NODE_PATH=./node_modules node ../database/fix-all-issues.js
 */

const mysql = require('mysql2/promise');
const slugify = require('slugify');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

function genSlug(text) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

async function createProduct(pool, name, catId, price, mrp, skuPrefix) {
  // Check if already exists
  const [existing] = await pool.query(
    'SELECT id FROM products WHERE name = ? AND category_id = ?',
    [name, catId]
  );
  if (existing.length > 0) {
    return { action: 'skipped', name };
  }

  let slug = genSlug(name);
  let suffix = 0;
  while (true) {
    const [rows] = await pool.query('SELECT id FROM products WHERE slug = ?', [slug]);
    if (rows.length === 0) break;
    suffix++;
    slug = `${genSlug(name)}-${suffix}`;
  }

  const sku = `KB-${skuPrefix}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  await pool.query(
    `INSERT INTO products (name, slug, description, short_description, price, mrp, stock_quantity, sku, category_id, brand, weight_grams, unit, is_active, is_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)`,
    [
      name, slug,
      `Premium ${name} sourced from the Konkan region. Fresh and authentic.`,
      `Fresh ${name} from Konkan.`,
      price, mrp,
      Math.floor(Math.random() * 100) + 20,
      sku, catId, 'Konkan Bazaar',
      price > 500 ? 500 : 250, 'piece',
    ]
  );
  return { action: 'created', name, sku };
}

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar',
    waitForConnections: true, connectionLimit: 1, charset: 'utf8mb4',
  });

  try {
    // ──────────── ISSUE 1: "Mangoes" subcategory under "Fresh Fruits" ────────────
    console.log('=== ISSUE 1: Mangoes subcategory under Fresh Fruits ===');
    const [mangoCat] = await pool.query(
      "SELECT id FROM categories WHERE name = 'Mangoes' AND parent_id = (SELECT id FROM categories WHERE name = 'Fresh Fruits' AND parent_id IS NULL LIMIT 1)"
    );

    if (mangoCat.length > 0) {
      const mangoId = mangoCat[0].id;

      // Get children of Mangoes
      const [mangoChildren] = await pool.query(
        'SELECT id, name FROM categories WHERE parent_id = ?', [mangoId]
      );

      console.log(`Found "Mangoes" (ID:${mangoId}) with ${mangoChildren.length} children.`);

      // Get Fresh Fruits category ID
      const [freshFruits] = await pool.query(
        "SELECT id FROM categories WHERE name = 'Fresh Fruits' AND parent_id IS NULL"
      );
      const freshFruitsId = freshFruits[0].id;

      // Map child names to products with proper names
      const productNames = {
        'Alphonso': ['Alphonso Mango', 1899, 2499, 'ALP'],
        'Payri': ['Payri Mango', 999, 1499, 'PAY'],
        'Mankurad': ['Mankurad Mango', 1599, 2199, 'MAN'],
        'Kesar': ['Kesar Mango', 1399, 1899, 'KES'],
        'Totapuri': ['Totapuri Mango', 699, 999, 'TOT'],
        'Rajapuri': ['Rajapuri Mango', 799, 1199, 'RAJ'],
        'Raw Mango': ['Raw Mango', 399, 599, 'RAW'],
      };

      for (const child of mangoChildren) {
        const prod = productNames[child.name];
        if (!prod) {
          console.log(`⚠️  No mapping for "${child.name}", skipping.`);
          continue;
        }
        const result = await createProduct(pool, prod[0], freshFruitsId, prod[1], prod[2], prod[3]);
        console.log(`  ${result.action === 'created' ? '✅ Created product' : '⏭️  Skipped'}: "${prod[0]}" under Fresh Fruits`);
      }

      // Delete the Mangoes children first (they have no products referencing them)
      // First update any products that reference these categories
      const childIds = mangoChildren.map(c => c.id);
      await pool.query(
        'UPDATE products SET category_id = ? WHERE category_id IN (?)',
        [freshFruitsId, childIds]
      );
      // Delete the children
      await pool.query('DELETE FROM categories WHERE id IN (?)', [childIds]);
      // Now delete Mangoes itself
      await pool.query('DELETE FROM categories WHERE id = ?', [mangoId]);
      console.log(`✅ Deleted "Mangoes" (ID:${mangoId}) and its ${mangoChildren.length} children.`);
    } else {
      console.log('⏭️  "Mangoes" subcategory not found, already fixed.');
    }

    // ──────────── ISSUE 2: Orphan Cashew variants as top-level categories ────────────
    console.log('\n=== ISSUE 2: Orphan Cashew variants ===');
    const cashewVariants = [
      { name: 'Roasted Cashew', catName: 'Roasted Cashew', price: 999, mrp: 1299, sku: 'RCS' },
      { name: 'Salted Cashew', catName: 'Salted Cashew', price: 999, mrp: 1299, sku: 'SCS' },
      { name: 'Masala Cashew', catName: 'Masala Cashew', price: 1099, mrp: 1399, sku: 'MCS' },
      { name: 'Honey Cashew', catName: 'Honey Cashew', price: 1199, mrp: 1499, sku: 'HCS' },
      { name: 'Cashew Pieces', catName: 'Cashew Pieces', price: 699, mrp: 899, sku: 'CSP' },
      { name: 'Cashew Flour', catName: 'Cashew Flour', price: 499, mrp: 699, sku: 'CSF' },
      { name: 'Cashew Butter', catName: 'Cashew Butter', price: 699, mrp: 899, sku: 'CSB' },
      { name: 'Cashew Milk', catName: 'Cashew Milk', price: 399, mrp: 549, sku: 'CSM' },
    ];

    // Get Dry Fruits & Nuts category ID
    const [dryFruits] = await pool.query(
      "SELECT id FROM categories WHERE name = 'Dry Fruits & Nuts' AND parent_id IS NULL"
    );

    if (dryFruits.length > 0) {
      const dryFruitsId = dryFruits[0].id;

      for (const variant of cashewVariants) {
        // Check if this exists as a top-level category
        const [catRows] = await pool.query(
          'SELECT id FROM categories WHERE name = ? AND parent_id IS NULL',
          [variant.catName]
        );

        if (catRows.length > 0) {
          const catId = catRows[0].id;

          // Check if any products reference this category, move them
          await pool.query(
            'UPDATE products SET category_id = ? WHERE category_id = ?',
            [dryFruitsId, catId]
          );

          // Delete the category
          await pool.query('DELETE FROM categories WHERE id = ?', [catId]);

          // Create as product
          const result = await createProduct(pool, variant.name, dryFruitsId, variant.price, variant.mrp, variant.sku);
          console.log(`  ${result.action === 'created' ? '✅ Created product' : '⏭️  Skipped'}: "${variant.name}" under Dry Fruits & Nuts`);
        } else {
          console.log(`  ⏭️  "${variant.name}" not found as top-level category.`);
        }
      }
    } else {
      console.log('⚠️  "Dry Fruits & Nuts" category not found!');
    }

    // ──────────── ISSUE 3: Nested items under Kokum Products (subcategory of Kokum & Beverages) ────────────
    console.log('\n=== ISSUE 3: Kokum Products nested items ===');
    // The user's tree has "Kokum Products" as a top-level category
    // Currently it's a subcategory of "Kokum & Beverages" with items like Fresh Kokum, Dried Kokum etc.
    // We need to check if "Kokum Products" exists as top-level
    const [kokumTop] = await pool.query(
      "SELECT id FROM categories WHERE name = 'Kokum Products' AND parent_id IS NULL"
    );

    if (kokumTop.length === 0) {
      // Need to create Kokum Products as a top-level category and add products
      console.log('"Kokum Products" is not a top-level category. Will handle in next steps.');
      
      // Check if it exists as a subcategory
      const [kokumSub] = await pool.query(
        "SELECT id FROM categories WHERE name = 'Kokum Products' AND parent_id IS NOT NULL"
      );
      
      if (kokumSub.length > 0) {
        const subId = kokumSub[0].id;
        // Get its children
        const [kokumChildren] = await pool.query(
          'SELECT id, name FROM categories WHERE parent_id = ?', [subId]
        );
        
        // Create Kokum Products as top-level category
        let slug = genSlug('Kokum Products');
        let suffix = 0;
        while (true) {
          const [rows] = await pool.query('SELECT id FROM categories WHERE slug = ?', [slug]);
          if (rows.length === 0) break;
          suffix++;
          slug = `kokum-products-${suffix}`;
        }
        
        const [insResult] = await pool.query(
          'INSERT INTO categories SET name = ?, slug = ?, parent_id = NULL, sort_order = 15, is_active = 1, description = ?',
          ['Kokum Products', slug, 'Authentic Kokum-based products from the Konkan region.']
        );
        
        const newKokumId = insResult.insertId;
        console.log(`✅ Created "Kokum Products" as top-level category (ID:${newKokumId})`);
        
        // Create products from the children
        const kokumProductMap = {
          'Fresh Kokum': ['Fresh Kokum', 299, 449, 'FKO'],
          'Dried Kokum': ['Dried Kokum', 199, 299, 'DKO'],
          'Kokum Syrup': ['Kokum Syrup', 249, 349, 'KSY'],
          'Kokum Sharbat': ['Kokum Sharbat', 249, 349, 'KSH'],
          'Kokum Agal': ['Kokum Agal', 349, 499, 'KAG'],
          'Sol Kadhi Mix': ['Sol Kadhi Mix', 149, 199, 'SKM'],
          'Sol Kadhi Concentrate': ['Sol Kadhi Concentrate', 199, 299, 'SKC'],
        };
        
        for (const child of kokumChildren) {
          const prod = kokumProductMap[child.name];
          if (prod) {
            const result = await createProduct(pool, prod[0], newKokumId, prod[1], prod[2], prod[3]);
            console.log(`  ${result.action === 'created' ? '✅' : '⏭️'} "${prod[0]}" under Kokum Products`);
          }
        }
        
        // Now delete the children from categories
        const childIds = kokumChildren.map(c => c.id);
        await pool.query('DELETE FROM categories WHERE id IN (?)', [childIds]);
        console.log(`✅ Deleted ${kokumChildren.length} child categories under old Kokum Products.`);
      }
    } else {
      console.log('⏭️  "Kokum Products" already exists as top-level.');
    }

    // ──────────── VERIFICATION ────────────
    console.log('\n=== FINAL COUNTS ===');
    const [topCats] = await pool.query('SELECT COUNT(*) as c FROM categories WHERE parent_id IS NULL');
    const [childCats] = await pool.query('SELECT COUNT(*) as c FROM categories WHERE parent_id IS NOT NULL');
    const [prods] = await pool.query('SELECT COUNT(*) as c FROM products');
    console.log(`Top-level categories: ${topCats[0].c}`);
    console.log(`Child categories: ${childCats[0].c}`);
    console.log(`Products: ${prods[0].c}`);

    // Show remaining child categories
    const [remainingChildren] = await pool.query(
      'SELECT c1.name, c2.name as parent FROM categories c1 JOIN categories c2 ON c1.parent_id=c2.id ORDER BY c2.name'
    );
    console.log('\n=== REMAINING CHILD CATEGORIES (should only be original ones) ===');
    remainingChildren.forEach(x => console.log(`  ${x.parent} → ${x.name}`));

    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
