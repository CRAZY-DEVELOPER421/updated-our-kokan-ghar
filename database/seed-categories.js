/**
 * Category Seed Script
 *
 * Logic:
 * - If a category name already exists in DB AND has subcategories → skip entirely
 * - If a category name exists but has NO subcategories → add subcategories from this tree
 * - If a category name doesn't exist → create it and all its subcategories
 *
 * Usage: node database/seed-categories.js
 */

const mysql = require('mysql2/promise');
const slugify = require('slugify');
require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });

// ──────────────────────────────────────────────
// CATEGORY TREE — matches the user's structure
// ──────────────────────────────────────────────
const CATEGORY_TREE = [
  {
    name: 'Fresh Fruits',
    children: [
      {
        name: 'Mangoes', children: [
          'Alphonso', 'Payri', 'Mankurad', 'Kesar', 'Totapuri', 'Rajapuri', 'Raw Mango'
        ]
      },
      'Jackfruit', 'Cashew Apple', 'Banana', 'Jamun', 'Karvanda', 'Kokum',
      'Pineapple', 'Papaya', 'Watermelon', 'Sitaphal', 'Tender Coconut'
    ]
  },
  {
    name: 'Fresh Vegetables',
    children: [
      'Tendli', 'Ratale (Sweet Potato)', 'Suran (Elephant Foot Yam)',
      'Colocasia', 'Drumstick', 'Brinjal', 'Pumpkin', 'Raw Banana',
      'Green Chilli', 'Okra', 'Cluster Beans', 'Ash Gourd', 'Bottle Gourd'
    ]
  },
  {
    name: 'Dry Fruits & Nuts',
    children: [
      {
        name: 'Cashew', children: [
          'Roasted Cashew', 'Salted Cashew', 'Masala Cashew', 'Honey Cashew',
          'Cashew Pieces', 'Cashew Flour', 'Cashew Butter', 'Cashew Milk'
        ]
      },
      'Almonds', 'Walnuts', 'Raisins', 'Figs'
    ]
  },
  {
    name: 'Coconut Products',
    children: [
      'Coconut Oil', 'Virgin Coconut Oil', 'Fresh Coconut', 'Dry Coconut',
      'Coconut Powder', 'Coconut Cream', 'Coconut Milk', 'Coconut Sugar',
      'Coconut Vinegar', 'Coconut Chips', 'Coconut Laddu', 'Coconut Barfi'
    ]
  },
  {
    name: 'Kokum Products',
    children: [
      'Fresh Kokum', 'Dried Kokum', 'Kokum Syrup', 'Kokum Sharbat',
      'Kokum Agal', 'Sol Kadhi Mix', 'Sol Kadhi Concentrate'
    ]
  },
  {
    name: 'Mango Products',
    children: [
      'Aamras', 'Mango Pulp', 'Mango Jam', 'Mango Squash', 'Mango Bar',
      'Aam Papad', 'Dried Mango', 'Raw Mango Powder', 'Mango Candy'
    ]
  },
  {
    name: 'Rice & Grains',
    children: [
      'Indrayani Rice', 'Ambemohar Rice', 'Red Rice', 'Brown Rice',
      'Kolam Rice', 'Ukda Rice', 'Hand Pounded Rice', 'Govind Bhog',
      'Rice Flour', 'Poha', 'Brown Poha', 'Gavthi Brown Poha', 'Murmura'
    ]
  },
  {
    name: 'Flours',
    children: [
      'Rice Flour', 'Nachni Flour', 'Jowar Flour', 'Bajra Flour',
      'Bhakri Flour', 'Kombdi Vade Flour', 'Multigrain Flour'
    ]
  },
  {
    name: 'Masalas & Spices',
    children: [
      'Malvani Masala', 'Fish Curry Masala', 'Chicken Masala', 'Goda Masala',
      'Garam Masala', 'Turmeric', 'Black Pepper', 'Byadgi Chilli',
      'Red Chilli Powder', 'Jeera', 'Coriander', 'Cardamom', 'Cloves',
      'Dalchini', 'Tirphal (Teppal)', 'Nutmeg', 'Mace', 'Star Anise'
    ]
  },
  {
    name: 'Pickles',
    children: [
      'Mango Pickle', 'Lime Pickle', 'Garlic Pickle', 'Green Chilli Pickle',
      'Prawn Pickle', 'Fish Pickle', 'Karvanda Pickle', 'Jackfruit Pickle',
      'Mixed Vegetable Pickle', 'Tendli Pickle'
    ]
  },
  {
    name: 'Chutneys',
    children: [
      'Dry Coconut Chutney', 'Peanut Chutney', 'Garlic Chutney',
      'Sesame Chutney', 'Dry Fish Chutney', 'Kokum Chutney', 'Tamarind Chutney'
    ]
  },
  {
    name: 'Seafood',
    children: [
      'Dry Fish', 'Dry Bombil', 'Dry Jawla', 'Dry Kolambi', 'Dry Mandeli'
    ]
  },
  {
    name: 'Snacks',
    children: [
      'Chakli', 'Murukku', 'Chivda', 'Banana Chips', 'Jackfruit Chips',
      'Rice Papad', 'Sabudana Papad', 'Kurdai', 'Sandge',
      'Peanut Chikki', 'Til Ladoo'
    ]
  },
  {
    name: 'Sweets',
    children: [
      'Kaju Katli', 'Coconut Barfi', 'Khobra Pak', 'Ukadiche Modak Mix',
      'Modak', 'Phanas Poli', 'Aam Papad', 'Mango Burfi'
    ]
  },
  {
    name: 'Beverages',
    children: [
      'Kokum Juice', 'Sugarcane Juice', 'Fresh Lime Juice', 'Coconut Water',
      'Buttermilk Mix', 'Cashew Apple Juice', 'Mango Juice'
    ]
  },
  {
    name: 'Natural Sweeteners',
    children: [
      'Jaggery', 'Palm Jaggery', 'Coconut Jaggery', 'Jaggery Powder',
      'Raw Honey', 'Wild Honey'
    ]
  },
  {
    name: 'Ready To Cook',
    children: [
      'Ghavne Mix', 'Thalipeeth Mix', 'Kombdi Vade Mix', 'Modak Mix', 'Sol Kadhi Mix'
    ]
  },
  {
    name: 'Traditional Foods',
    children: [
      'Rice Bhakri', 'Nachni Bhakri', 'Bhakri Flour',
      'Malvani Masala', 'Sol Kadhi', 'Kombdi Vade'
    ]
  },
  {
    name: 'Eco Friendly Products',
    children: [
      'Areca Leaf Plates', 'Banana Fiber Products', 'Bamboo Basket',
      'Coconut Shell Handicrafts', 'Wooden Spice Box',
      'Handloom Towels', 'Coir Products'
    ]
  },
  {
    name: 'Gift Hampers',
    children: [
      'Mango Gift Box', 'Cashew Gift Box', 'Konkan Festival Box',
      'Healthy Konkan Box', 'Traditional Konkan Box', 'Corporate Gift Hampers'
    ]
  }
];

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
function generateSlug(text) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar',
    waitForConnections: true,
    connectionLimit: 1,
    charset: 'utf8mb4'
  });

  try {
    // 1. Fetch ALL existing categories
    const [existing] = await pool.query(
      'SELECT id, name, parent_id FROM categories'
    );

    // Build lookup maps
    const nameToId = {};   // name -> id (case-insensitive)
    const parentToChildren = {}; // parent_id -> [child categories]
    for (const c of existing) {
      const key = c.name.toLowerCase().trim();
      nameToId[key] = c.id;
      if (!parentToChildren[c.parent_id]) parentToChildren[c.parent_id] = [];
      parentToChildren[c.parent_id].push(c);
    }

    const topLevelExisting = parentToChildren[null] || [];

    console.log(`\n📋 Found ${existing.length} existing categories in DB.\n`);

    // 2. Process each top-level category from the tree
    let created = 0;
    let skipped = 0;
    let subcategoriesAdded = 0;

    for (const topCat of CATEGORY_TREE) {
      const key = topCat.name.toLowerCase().trim();
      const existingId = nameToId[key];

      if (existingId) {
        // Category exists — check if it has subcategories
        const existingSubs = parentToChildren[existingId] || [];
        if (existingSubs.length > 0) {
          // Has subcategories already → skip entirely
          console.log(`⏭️  "${topCat.name}" — already exists with ${existingSubs.length} subcategory(ies), skipping.`);
          skipped++;
          continue;
        } else {
          // Exists but NO subcategories → add them
          console.log(`➕ "${topCat.name}" — exists but has no subcategories, adding ${topCat.children.length} subcategory(ies)...`);
          let sortOrder = 1;
          for (const child of topCat.children) {
            await insertCategory(pool, child, existingId, nameToId, sortOrder++);
            subcategoriesAdded++;
          }
        }
      } else {
        // Category doesn't exist → create it and all children
        console.log(`🆕 "${topCat.name}" — new top-level category, creating with ${topCat.children.length} subcategory(ies)...`);

        // Generate slug for new category
        let slug = generateSlug(topCat.name);
        let suffix = 0;
        while (nameToId[slug] !== undefined) {
          suffix++;
          slug = `${generateSlug(topCat.name)}-${suffix}`;
        }

        const [result] = await pool.query(
          'INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES (?, ?, NULL, ?, 1)',
          [topCat.name, slug, created + 1] // sort_order
        );
        const newId = result.insertId;
        nameToId[key] = newId;
        nameToId[slug] = newId; // for slug uniqueness check
        created++;

        let sortOrder = 1;
        for (const child of topCat.children) {
          await insertCategory(pool, child, newId, nameToId, sortOrder++);
          subcategoriesAdded++;
        }
      }
    }

    console.log(`\n✅ Done!`);
    console.log(`   - Created new categories: ${created}`);
    console.log(`   - Skipped (already had subcategories): ${skipped}`);
    console.log(`   - Subcategories added: ${subcategoriesAdded}`);
    console.log(`   - Total categories in DB: ${existing.length + created + subcategoriesAdded}\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Insert a single category (or category with children) into the database.
 * Handles both leaf (string) and parent (object with children) items.
 */
async function insertCategory(pool, item, parentId, nameToId, sortOrder) {
  if (typeof item === 'string') {
    // Leaf category
    const key = item.toLowerCase().trim();
    if (nameToId[key]) {
      console.log(`   ⏭️  "${item}" — already exists, skipping.`);
      return;
    }

    let slug = generateSlug(item);
    let suffix = 0;
    while (nameToId[slug] !== undefined) {
      suffix++;
      slug = `${generateSlug(item)}-${suffix}`;
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES (?, ?, ?, ?, 1)',
      [item, slug, parentId, sortOrder]
    );
    nameToId[key] = result.insertId;
    nameToId[slug] = result.insertId;
    console.log(`   ✅ "${item}" — created (parent_id: ${parentId})`);
  } else {
    // Category with children
    const key = item.name.toLowerCase().trim();
    if (nameToId[key]) {
      console.log(`   ⏭️  "${item.name}" — already exists, skipping.`);
      return;
    }

    let slug = generateSlug(item.name);
    let suffix = 0;
    while (nameToId[slug] !== undefined) {
      suffix++;
      slug = `${generateSlug(item.name)}-${suffix}`;
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, slug, parent_id, sort_order, is_active) VALUES (?, ?, ?, ?, 1)',
      [item.name, slug, parentId, sortOrder]
    );
    const newId = result.insertId;
    nameToId[key] = newId;
    nameToId[slug] = newId;
    console.log(`   ✅ "${item.name}" — created (parent_id: ${parentId})`);

    // Insert children
    let childSort = 1;
    for (const child of item.children) {
      await insertCategory(pool, child, newId, nameToId, childSort++);
    }
  }
}

main();
