#!/usr/bin/env node
/**
 * ============================================================
 * KONKAN BAZAAR — Kokan Catalog Migration
 * ============================================================
 * Saves the complete Konkan catalog into the database:
 *
 *   53 categories → 630+ subcategories → 630+ products
 *
 * Every product gets rich demo data — description, price, MRP,
 * stock, SKU, brand, unit, region, shelf life, ingredients,
 * nutritional info, storage instructions, ratings, tags and a
 * primary image — all generated deterministically (re-running
 * the migration produces the exact same data, so it is safe to
 * run again and again).
 *
 * All data lives in the DATABASE. Nothing is hardcoded in the
 * app code. This script + database/kokan-catalog-data.js are
 * the single source of truth and are safe to commit to git.
 *
 * Usage (run from project root):
 *   node database/migrate-kokan-catalog.js              # safe upsert — adds/updates rows
 *   node database/migrate-kokan-catalog.js --reset      # clear existing catalog data first, then insert fresh
 *   node database/migrate-kokan-catalog.js --dry-run    # print what would happen, touch nothing
 *
 * Env: reads DB_HOST / DB_USER / DB_PASS / DB_NAME from .env
 *      (root .env, same file the backend uses).
 * ============================================================
 */
const path = require('path');

// ── Resolve deps from backend/node_modules (works from any cwd) ──
const backendRequire = require('module').createRequire(
  path.join(__dirname, '..', 'backend', 'package.json')
);
const mysql = backendRequire('mysql2/promise');
const slugify = backendRequire('slugify');
const dotenv = backendRequire('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
if (!process.env.DB_HOST) {
  dotenv.config({ path: path.resolve(__dirname, '..', 'backend', '.env') });
}

const CATALOG = require('./kokan-catalog-data');

const args = process.argv.slice(2);
const RESET = args.includes('--reset');
const RESET_ALL = args.includes('--reset-all');
const DRY_RUN = args.includes('--dry-run');
const HELP = args.includes('--help') || args.includes('-h');

// ============================================================
// PRODUCT PROFILE LIBRARY — drives realistic demo data
// ============================================================
const PROFILE = {
  fresh: {
    typeLabel: 'Fresh Produce',
    unit: 'kg',
    units: ['kg', 'dozen', 'pack', 'piece'],
    weight: [250, 2000],
    shelf: [3, 10],
    price: [49, 349],
    suffixes: [' – 1kg', ' – 500g', ' – 1 dozen', ' – 6 pcs'],
    ingredients: '100% naturally grown produce — no chemicals, no preservatives',
    storage: 'Store in a cool, dry place. Refrigerate after ripening and consume within 2–3 days for best freshness.',
    nutrition: { calories: 65, serving_size: '100g', fiber: '2g', vitamin_c: '20mg' },
    description: [
      'Harvested at peak ripeness from small family farms across the Konkan belt and packed the same day to lock in natural flavour.',
      'Grown without synthetic chemicals and picked fresh, this produce carries the true taste of the Konkan coast.',
      'Sourced directly from local farmers so you get the freshest stock, every single time.'
    ],
    short: 'farm-fresh produce from the Konkan region'
  },
  process: {
    typeLabel: 'Traditional Processed Food',
    unit: 'jar',
    units: ['jar', 'pack', 'bottle'],
    weight: [200, 1000],
    shelf: [180, 365],
    price: [99, 449],
    suffixes: [' – 500g', ' – 200g', ' – 1kg', ' – 750ml'],
    ingredients: 'Premium local ingredients, traditional spices — no artificial colours or preservatives',
    storage: 'Store in an airtight container away from moisture and direct sunlight. Refrigerate after opening.',
    nutrition: { calories: 110, serving_size: '100g', sugar: '18g' },
    description: [
      'Prepared using age-old Konkan recipes with no artificial colours or preservatives.',
      'Small-batch production preserves the authentic homemade taste your family will love.',
      'Made from carefully selected local ingredients and hygienically packed at our Konkan facility.'
    ],
    short: 'traditional Konkan recipe, no preservatives'
  },
  dry: {
    typeLabel: 'Dry Grocery',
    unit: 'pack',
    units: ['pack', 'bag', 'kg'],
    weight: [250, 5000],
    shelf: [180, 540],
    price: [79, 499],
    suffixes: [' – 1kg', ' – 500g', ' – 5kg', ' – 250g'],
    ingredients: 'Naturally dried premium grains — no additives, no preservatives',
    storage: 'Store in an airtight container in a cool, dry place away from moisture.',
    nutrition: { calories: 350, serving_size: '100g', carbohydrates: '72g', fiber: '4g' },
    description: [
      'Slow-dried and cleaned with traditional methods to keep every grain and piece perfectly intact.',
      'Naturally processed, free from additives, and packed in moisture-proof packaging.'
    ],
    short: 'naturally processed, chemical-free'
  },
  spice: {
    typeLabel: 'Spices & Masalas',
    unit: 'pack',
    units: ['pack', 'jar'],
    weight: [50, 500],
    shelf: [365, 540],
    price: [99, 399],
    suffixes: [' – 100g', ' – 200g', ' – 250g', ' – 500g'],
    ingredients: 'Premium Konkan spices, stone-ground in small batches',
    storage: 'Store in an airtight jar in a cool, dry place. Keep away from direct sunlight.',
    nutrition: { calories: 15, serving_size: '5g', fiber: '1g' },
    description: [
      'Stone-ground and blended in small batches for maximum aroma and potency.',
      'Sourced from Konkan farms where these spices have been cultivated for generations.'
    ],
    short: 'premium stone-ground Konkan spice'
  },
  snack: {
    typeLabel: 'Snacks',
    unit: 'pack',
    units: ['pack', 'box'],
    weight: [100, 1000],
    shelf: [30, 180],
    price: [49, 299],
    suffixes: [' – 200g', ' – 400g', ' – 500g', ' – 1kg'],
    ingredients: 'Flour, spices, salt and edible oil — no preservatives',
    storage: 'Keep in a cool, dry place. For longer shelf life, refrigerate after opening.',
    nutrition: { calories: 480, serving_size: '100g', fat: '24g', carbohydrates: '60g' },
    description: [
      'Crisp, golden and made fresh — a traditional Konkan snack for every occasion.',
      'Prepared with the perfect balance of spices, salt and crunch, just like home.'
    ],
    short: 'crispy traditional Konkan snack'
  },
  sweet: {
    typeLabel: 'Sweets & Mithai',
    unit: 'pack',
    units: ['pack', 'box'],
    weight: [100, 1000],
    shelf: [10, 30],
    price: [99, 449],
    suffixes: [' – 250g', ' – 500g', ' – 1kg', ' – 12 pcs'],
    ingredients: 'Pure jaggery, coconut, ghee and premium local ingredients',
    storage: 'Store in a cool, dry place. Refrigerate for longer shelf life.',
    nutrition: { calories: 220, serving_size: '50g', sugar: '30g' },
    description: [
      'A beloved Konkan sweet, handcrafted in small batches using traditional recipes.',
      'Made with pure jaggery, coconut and premium local ingredients for an authentic taste.'
    ],
    short: 'handcrafted traditional Konkan sweet'
  },
  beverage: {
    typeLabel: 'Beverages & Sharbat',
    unit: 'bottle',
    units: ['bottle', 'carton'],
    weight: [500, 2000],
    shelf: [180, 365],
    price: [99, 349],
    suffixes: [' – 750ml', ' – 1L', ' – 500ml'],
    ingredients: 'Natural concentrate, sugar and water (permitted preservatives)',
    storage: 'Store in a cool place. Refrigerate after opening and consume within 30 days.',
    nutrition: { calories: 80, serving_size: '30ml concentrate', sugar: '18g' },
    description: [
      'A refreshing Konkan beverage, perfect for hot summer days.',
      'Just dilute with water, add ice and enjoy the authentic taste of the coast.'
    ],
    short: 'refreshing traditional Konkan drink'
  },
  seafood: {
    typeLabel: 'Dry Seafood',
    unit: 'pack',
    units: ['pack', 'jar'],
    weight: [100, 500],
    shelf: [90, 180],
    price: [199, 649],
    suffixes: [' – 250g', ' – 500g', ' – 1kg'],
    ingredients: 'Sun-dried seafood and salt — nothing else',
    storage: 'Keep in an airtight, moisture-proof container. No refrigeration needed if kept dry.',
    nutrition: { calories: 240, serving_size: '100g', protein: '48g', omega_3: '2.5g' },
    description: [
      'Sun-dried using traditional coastal techniques that preserve the intense, authentic flavour.',
      'Caught fresh from the Arabian Sea and dried the natural way, without any chemicals.'
    ],
    short: 'traditionally sun-dried coastal delicacy'
  },
  craft: {
    typeLabel: 'Handicrafts',
    unit: 'piece',
    units: ['piece', 'set'],
    weight: [50, 1500],
    shelf: [365, 3650],
    price: [49, 599],
    suffixes: ['', '', '', ''],
    ingredients: 'Natural bamboo / cane / wood / leaf — handcrafted',
    storage: 'Keep in a dry place, away from prolonged moisture and direct sunlight.',
    nutrition: { material: 'Natural, biodegradable', care: 'Wipe with a dry cloth' },
    description: [
      'Handcrafted by skilled Konkan artisans using sustainably sourced natural materials.',
      'Each piece is unique and reflects the heritage craft traditions of the Konkan region.'
    ],
    short: 'handcrafted by Konkan artisans'
  },
  tool: {
    typeLabel: 'Farm & Kitchen Tools',
    unit: 'piece',
    units: ['piece', 'set'],
    weight: [100, 3000],
    shelf: [365, 3650],
    price: [99, 699],
    suffixes: ['', '', '', ''],
    ingredients: 'Natural hardwood and bamboo — handcrafted',
    storage: 'Keep in a dry place. Wipe clean after use.',
    nutrition: { material: 'Natural hardwood / bamboo', care: 'Hand wash, dry well' },
    description: [
      'Sturdy, traditional and hand-finished by Konkan village craftsmen.',
      'Built to last with time-tested natural materials and generations of skill.'
    ],
    short: 'traditional handcrafted Konkan tool'
  },
  gift: {
    typeLabel: 'Gift Boxes & Hampers',
    unit: 'box',
    units: ['box', 'hamper'],
    weight: [1000, 5000],
    shelf: [30, 180],
    price: [399, 2499],
    suffixes: [' – Premium Box', ' – Gift Pack', '', ''],
    ingredients: 'Assorted premium Konkan delicacies',
    storage: 'Store in a cool, dry place. Consume perishable items soon after opening.',
    nutrition: { includes: 'Assorted Konkan delicacies', weight: 'Mixed' },
    description: [
      'Thoughtfully curated with the finest Konkan produce — perfect for gifting.',
      'Beautifully packed and ready to impress your loved ones on any occasion.'
    ],
    short: 'curated Konkan hamper, gift-ready'
  }
};

// Brand & region pools (picked deterministically per product)
const BRANDS = [
  'Konkan Bazaar Select',
  'Konkan Heritage',
  'Konkan Delight',
  'Gavran Organic',
  'Malvani Masale',
  'Goan Roots',
  'Kokan Fresh',
  'Sahyadri Naturals'
];

const REGIONS = [
  'Ratnagiri', 'Devgad', 'Sindhudurg', 'Sawantwadi', 'Vengurla',
  'Malvan', 'Kudal', 'Dapoli', 'Guhagar', 'Harnai', 'Goa'
];

// Categories that are naturally seasonal
const SEASONAL_CATS = new Set([1, 3, 4, 5, 6, 7, 29]);

// ============================================================
// DETERMINISTIC RANDOM (same input → same output, every run)
// ============================================================
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slugifyName(text) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

function uniqueSlug(base, used) {
  let slug = slugifyName(base);
  let n = 2;
  while (used.has(slug)) {
    slug = `${slugifyName(base)}-${n}`;
    n++;
  }
  used.add(slug);
  return slug;
}

const round5 = (n) => Math.max(5, Math.round(n / 5) * 5);

// Normalized base name: strips size suffixes like " – 500g" so "Mango Pickle – 500g"
// and "Mango Pickle – 1kg" are treated as the same product (used for dedup).
// Mirrors the SQL REGEXP_REPLACE used in dedupeProducts().
const baseName = (n) => String(n).toLowerCase().trim().replace(/\s*–\s*.*$/, '');

// ============================================================
// PRODUCT GENERATOR — builds the full demo record
// ============================================================
function buildProduct({ subcatName, catName, catNum, profileKey, priceRange, usedSlugs, usedSkus }) {
  const prof = PROFILE[profileKey];
  const seedStr = `${catNum}|${subcatName}`;
  const rand = mulberry32(hashString(seedStr));

  const suffix = prof.suffixes[Math.floor(rand() * prof.suffixes.length)];
  const name = `${subcatName}${suffix}`;

  const [minP, maxP] = priceRange || prof.price;
  const price = round5(minP + rand() * (maxP - minP));
  const mrp = round5(price * (1.18 + rand() * 0.22));
  const stock = 40 + Math.floor(rand() * 460);
  const rating = (3.5 + rand() * 1.4).toFixed(2);
  const reviewCount = 4 + Math.floor(rand() * 96);
  const totalSold = 15 + Math.floor(rand() * 985);
  const views = totalSold * (6 + Math.floor(rand() * 15));
  const weight = Math.max(25, Math.round(((prof.weight[0] + rand() * (prof.weight[1] - prof.weight[0])) / 25)) * 25);
  const unit = prof.units[Math.floor(rand() * prof.units.length)];
  const region = REGIONS[Math.floor(rand() * REGIONS.length)];
  const brand = BRANDS[Math.floor(rand() * BRANDS.length)];
  const shelfLife = prof.shelf[0] + Math.floor(rand() * (prof.shelf[1] - prof.shelf[0] + 1));

  const isFood = ['fresh', 'process', 'dry', 'spice', 'snack', 'sweet', 'beverage', 'seafood'].includes(profileKey);
  const isOrganic = isFood ? rand() > 0.45 : 0;
  const isFeatured = rand() > 0.88 ? 1 : 0;
  const isBestseller = rand() > 0.82 ? 1 : 0;
  const seasonalBase = profileKey === 'fresh' || SEASONAL_CATS.has(catNum);
  const isSeasonal = seasonalBase && rand() > 0.4 ? 1 : 0;

  const typeSentence = prof.description[Math.floor(rand() * prof.description.length)];
  const description = `${name} — authentic ${catName.toLowerCase()} from the Konkan region. ${typeSentence} Packed fresh and shipped from our Konkan facility — ideal for everyday use and gifting.`;

  const shortDescription = `${name} — ${prof.short}.`;

  const slug = uniqueSlug(name, usedSlugs);

  // SKU is derived from a stable hash of the product identity (NOT a positional
  // counter), so re-running the migration — even after editing the data file —
  // never produces duplicate SKUs or shifts existing ones.
  const skuPrefix = `KK-${String(catNum).padStart(2, '0')}`;
  let sku = `${skuPrefix}-${String((hashString(subcatName) % 899999) + 100000)}`;
  let skuN = 2;
  while (usedSkus.has(sku)) {
    sku = `${skuPrefix}-${String(((hashString(subcatName) + skuN * 7919) % 899999) + 100000)}`;
    skuN++;
  }
  usedSkus.add(sku);

  const tags = [catName, subcatName, prof.typeLabel, 'Konkan', isOrganic ? 'Organic' : null]
    .filter(Boolean)
    .slice(0, 5);

  return {
    name,
    slug,
    description,
    short_description: shortDescription.slice(0, 500),
    price,
    mrp,
    stock_quantity: stock,
    sku,
    brand,
    weight_grams: weight,
    unit,
    is_active: 1,
    is_featured: isFeatured,
    is_bestseller: isBestseller,
    is_seasonal: isSeasonal,
    is_organic: isOrganic,
    region_origin: region,
    shelf_life_days: shelfLife,
    ingredients: prof.ingredients,
    nutritional_info: JSON.stringify(prof.nutrition),
    storage_instructions: prof.storage,
    average_rating: rating,
    review_count: reviewCount,
    total_sold: totalSold,
    views_count: views,
    meta_title: `${name} | Konkan Bazaar`.slice(0, 255),
    meta_description: shortDescription.slice(0, 500),
    meta_keywords: `${subcatName}, ${catName}, Konkan, buy online, ${region}`,
    tags
  };
}

// ============================================================
// FLATTEN CATALOG → [{ cat, subcats: [names] }]
// ============================================================
function flattenCatalog() {
  const usedCategorySlugs = new Set();
  return CATALOG.map((cat) => {
    const catNum = cat.sortOrder;
    const catSlug = uniqueSlug(cat.name, usedCategorySlugs);
    const subcats = cat.children.map((child) =>
      typeof child === 'string' ? child : child.name
    );
    return { cat, catNum, catSlug, subcats };
  });
}

// ============================================================
// DB HELPERS
// ============================================================
async function upsertCategory(pool, { name, slug, description, imageUrl, parentId, sortOrder, metaTitle, metaDescription }) {
  const [rows] = await pool.query('SELECT id, name FROM categories WHERE slug = ?', [slug]);
  if (rows.length > 0) {
    if (rows[0].name !== name) {
      console.log(`   slug "${slug}" already exists as "${rows[0].name}" — updating it to match the catalog (safe mode merges same-slug rows; use --reset-all for a clean catalog).`);
    }
    await pool.query(
      `UPDATE categories SET name = ?, description = ?, image_url = ?, parent_id = ?, is_active = 1, sort_order = ?, meta_title = ?, meta_description = ? WHERE id = ?`,
      [name, description, imageUrl, parentId, sortOrder, metaTitle, metaDescription, rows[0].id]
    );
    return { id: rows[0].id, created: false };
  }
  const [res] = await pool.query(
    `INSERT INTO categories (name, slug, description, image_url, parent_id, is_active, sort_order, meta_title, meta_description)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    [name, slug, description, imageUrl, parentId, sortOrder, metaTitle, metaDescription]
  );
  return { id: res.insertId, created: true };
}

async function upsertProduct(pool, p, categoryId) {
  const [rows] = await pool.query('SELECT id FROM products WHERE slug = ?', [p.slug]);
  if (rows.length > 0) {
    await pool.query(
      `UPDATE products SET
         name = ?, description = ?, short_description = ?, price = ?, mrp = ?,
         stock_quantity = ?, sku = ?, category_id = ?, brand = ?, weight_grams = ?, unit = ?,
         is_active = 1, is_featured = ?, is_bestseller = ?, is_seasonal = ?, is_organic = ?,
         region_origin = ?, shelf_life_days = ?, ingredients = ?, nutritional_info = ?,
         storage_instructions = ?, average_rating = ?, review_count = ?, total_sold = ?, views_count = ?,
         meta_title = ?, meta_description = ?, meta_keywords = ?
       WHERE id = ?`,
      [
        p.name, p.description, p.short_description, p.price, p.mrp, p.stock_quantity, p.sku,
        categoryId, p.brand, p.weight_grams, p.unit, p.is_featured, p.is_bestseller,
        p.is_seasonal, p.is_organic, p.region_origin, p.shelf_life_days, p.ingredients,
        p.nutritional_info, p.storage_instructions, p.average_rating, p.review_count,
        p.total_sold, p.views_count, p.meta_title, p.meta_description, p.meta_keywords,
        rows[0].id
      ]
    );
    return { id: rows[0].id, created: false };
  }
  const [res] = await pool.query(
    `INSERT INTO products
       (name, slug, description, short_description, price, mrp, stock_quantity, sku, category_id,
        brand, weight_grams, unit, is_active, is_featured, is_bestseller, is_seasonal, is_organic,
        region_origin, shelf_life_days, ingredients, nutritional_info, storage_instructions,
        average_rating, review_count, total_sold, views_count, meta_title, meta_description, meta_keywords)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      p.name, p.slug, p.description, p.short_description, p.price, p.mrp, p.stock_quantity, p.sku,
      categoryId, p.brand, p.weight_grams, p.unit, p.is_featured, p.is_bestseller, p.is_seasonal,
      p.is_organic, p.region_origin, p.shelf_life_days, p.ingredients, p.nutritional_info,
      p.storage_instructions, p.average_rating, p.review_count, p.total_sold, p.views_count,
      p.meta_title, p.meta_description, p.meta_keywords
    ]
  );
  return { id: res.insertId, created: true };
}

async function syncProductImages(pool, productId, imageUrl, altText) {
  const [rows] = await pool.query('SELECT id FROM product_images WHERE product_id = ? LIMIT 1', [productId]);
  if (rows.length > 0) return 0;
  await pool.query(
    'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, 1, 1)',
    [productId, imageUrl, altText]
  );
  return 1;
}

async function syncProductTags(pool, productId, tags) {
  await pool.query('DELETE FROM product_tags WHERE product_id = ?', [productId]);
  if (!tags || tags.length === 0) return;
  for (const tag of tags) {
    await pool.query(
      'INSERT INTO product_tags (product_id, tag) VALUES (?, ?)',
      [productId, tag]
    );
  }
}

async function dedupeProducts(pool) {
  // Removes products that share the same base name (size suffix ignored) across
  // different categories — e.g. "Wooden Spoon" under two categories, "Mango Pickle"
  // under both Mango Products and Pickles. Keeps the first occurrence (lowest id).
  // Safe to run any time: it is a no-op when no duplicates exist.
  console.log('\nRemoving duplicate products (same name across categories, keeping the first)...');
  const [res] = await pool.query(
    `DELETE p FROM products p
     JOIN (
       SELECT LOWER(TRIM(REGEXP_REPLACE(name, '\\s*–\\s*.*$', ''))) AS base, MIN(id) AS keep_id
       FROM products
       GROUP BY base
       HAVING COUNT(*) > 1
     ) d
       ON LOWER(TRIM(REGEXP_REPLACE(p.name, '\\s*–\\s*.*$', ''))) = d.base
      AND p.id <> d.keep_id`
  );
  if (res.affectedRows > 0) {
    console.log(`   Removed ${res.affectedRows} duplicate product(s).`);
  } else {
    console.log('   No duplicate products found.');
  }
  return res.affectedRows;
}

async function resetCatalog(pool, resetAll) {
  console.log('\nResetting existing catalog data...');

  // When --reset-all is used, dependent/transactional data is cleared first so the
  // catalog tables can be fully wiped. Otherwise only catalog tables are attempted
  // (they will fail cleanly if orders still reference old products).
  const steps = [];
  if (resetAll) {
    steps.push(
      ['bundle_products', 'DELETE FROM bundle_products'],
      ['bundles', 'DELETE FROM bundles'],
      ['flash_sales', 'DELETE FROM flash_sales'],
      ['reviews', 'DELETE FROM reviews'],
      ['wishlist', 'DELETE FROM wishlist'],
      ['cart_items', 'DELETE FROM cart_items'],
      ['cart', 'DELETE FROM cart'],
      ['order_tracking', 'DELETE FROM order_tracking'],
      ['order_items', 'DELETE FROM order_items'],
      ['orders', 'DELETE FROM orders']
    );
  }
  steps.push(
    ['product_tags', 'DELETE FROM product_tags'],
    ['product_images', 'DELETE FROM product_images'],
    ['products', 'DELETE FROM products'],
    ['categories', 'DELETE FROM categories']
  );

  for (const [label, sql] of steps) {
    try {
      const [res] = await pool.query(sql);
      console.log(`   ${label}: ${res.affectedRows} rows deleted`);
    } catch (err) {
      console.log(`   ${label}: could not clear (${err.message}). Keeping existing rows — they may be referenced by orders.`);
    }
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  if (HELP) {
    console.log(`
KOKAN BAZAAR — Kokan Catalog Migration

Usage:
  node database/migrate-kokan-catalog.js              safe upsert (adds/updates rows)
  node database/migrate-kokan-catalog.js --reset      clear catalog tables, then insert fresh
  node database/migrate-kokan-catalog.js --reset-all  ALSO clear orders, reviews, carts, bundles
                                                     (everything referencing products) — clean slate
  node database/migrate-kokan-catalog.js --yes        skip the confirmation prompt for --reset-all
  node database/migrate-kokan-catalog.js --dry-run    print a summary without touching the DB

Data source: database/kokan-catalog-data.js (53 categories, 630+ subcategories)
`);
    return;
  }

  const catalog = flattenCatalog();
  const totalSubcats = catalog.reduce((sum, c) => sum + c.subcats.length, 0);
  const totalProducts = totalSubcats; // one demo product per subcategory

  console.log('============================================================');
  console.log(' KONKAN BAZAAR — Kokan Catalog Migration');
  console.log('============================================================');
  console.log(` Categories   : ${catalog.length}`);
  console.log(` Subcategories: ${totalSubcats}`);
  console.log(` Products     : ${totalProducts}`);
  console.log(` Mode         : ${RESET_ALL ? 'FULL RESET (all data) + insert fresh' : RESET ? 'RESET catalog + insert fresh' : 'safe upsert'}${DRY_RUN ? ' (dry-run)' : ''}`);

  if (DRY_RUN) {
    console.log('\nDry run complete — nothing was written to the database.');
    return;
  }

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar',
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4'
  });

  const stats = {
    categoriesCreated: 0,
    categoriesUpdated: 0,
    subcategoriesCreated: 0,
    subcategoriesUpdated: 0,
    productsCreated: 0,
    productsUpdated: 0,
    imagesAdded: 0,
    tagsAdded: 0,
    duplicatesSkipped: 0
  };

  const usedProductSlugs = new Set();
  const usedProductSkus = new Set();
  const usedBases = new Set();

  try {
    // Pre-flight warning for the destructive flag
    if (RESET_ALL && !args.includes('--yes')) {
      const [counts] = await pool.query(
        `SELECT
           (SELECT COUNT(*) FROM orders) AS orders,
           (SELECT COUNT(*) FROM reviews) AS reviews,
           (SELECT COUNT(*) FROM cart_items) AS cart_items,
           (SELECT COUNT(*) FROM bundles) AS bundles,
           (SELECT COUNT(*) FROM products) AS products,
           (SELECT COUNT(*) FROM categories) AS categories`
      );
      const c = counts[0];
      console.log('\n--reset-all will PERMANENTLY DELETE the following:');
      console.log(`     orders=${c.orders}  reviews=${c.reviews}  cart_items=${c.cart_items}  bundles=${c.bundles}`);
      console.log(`     products=${c.products}  categories=${c.categories}  (+ product_images, product_tags)`);
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      const answer = await new Promise((resolve) => rl.question('\nType YES to continue: ', resolve));
      rl.close();
      if (answer.trim().toUpperCase() !== 'YES') {
        console.log('Aborted — nothing was changed.');
        return;
      }
    }

    if (RESET || RESET_ALL) await resetCatalog(pool, RESET_ALL);

    for (const { cat, catNum, catSlug, subcats } of catalog) {
      const prof = PROFILE[cat.profile];
      const priceRange = cat.price;

      const catRes = await upsertCategory(pool, {
        name: cat.name,
        slug: catSlug,
        description: cat.description,
        imageUrl: `/images/categories/${catSlug}.jpg`,
        parentId: null,
        sortOrder: cat.sortOrder,
        metaTitle: `${cat.name} | Konkan Bazaar`.slice(0, 255),
        metaDescription: cat.description
      });
      catRes.created ? stats.categoriesCreated++ : stats.categoriesUpdated++;

      const usedSubcatSlugs = new Set();
      let subIndex = 0;
      for (const subcatName of subcats) {
        subIndex++;
        const subRes = await upsertCategory(pool, {
          name: subcatName,
          slug: uniqueSlug(`${catSlug}-${subcatName}`, usedSubcatSlugs),
          description: `${subcatName} — ${cat.description}`,
          imageUrl: `/images/categories/${catSlug}.jpg`,
          parentId: catRes.id,
          sortOrder: subIndex,
          metaTitle: `${subcatName} | Konkan Bazaar`.slice(0, 255),
          metaDescription: `${subcatName} — ${prof.short}`
        });
        subRes.created ? stats.subcategoriesCreated++ : stats.subcategoriesUpdated++;

        const product = buildProduct({
          subcatName,
          catName: cat.name,
          catNum,
          profileKey: cat.profile,
          priceRange,
          usedSlugs: usedProductSlugs,
          usedSkus: usedProductSkus
        });

        // Skip duplicates: when the same product name already appeared earlier in the
        // catalog tree (e.g. "Wooden Spoon" under two categories), keep only the first
        // occurrence — the later subcategory stays but gets no product. This avoids
        // create-then-delete churn and keeps every run idempotent.
        const base = baseName(product.name);
        if (usedBases.has(base)) {
          stats.duplicatesSkipped++;
          continue;
        }
        usedBases.add(base);

        const prodRes = await upsertProduct(pool, product, subRes.id);
        prodRes.created ? stats.productsCreated++ : stats.productsUpdated++;

        stats.imagesAdded += await syncProductImages(
          pool,
          prodRes.id,
          `/images/products/${product.slug}.jpg`,
          product.name
        );

        await syncProductTags(pool, prodRes.id, product.tags);
        stats.tagsAdded += product.tags.length;
      }

      console.log(
        `   [${String(catNum).padStart(2, '0')}/${catalog.length}] ${cat.name} — ${subcats.length} subcategory(ies), ${subcats.length} product(s)`
      );
    }

    // Safety net: remove any leftover duplicate products (same base name). Normally a
    // no-op because duplicates are already skipped during insertion above.
    await dedupeProducts(pool);

    // Final summary
    const [finalCat] = await pool.query(
      'SELECT COUNT(*) AS total, SUM(parent_id IS NULL) AS top FROM categories'
    );
    const [finalProd] = await pool.query('SELECT COUNT(*) AS total FROM products');
    const [finalImg] = await pool.query('SELECT COUNT(*) AS total FROM product_images');
    const [finalTags] = await pool.query('SELECT COUNT(*) AS total FROM product_tags');

    console.log('\nMigration complete!');
    console.log('──────────────────────────────────────────────');
    console.log(` Categories created/updated : ${stats.categoriesCreated}/${stats.categoriesUpdated}`);
    console.log(` Subcategories created/upd  : ${stats.subcategoriesCreated}/${stats.subcategoriesUpdated}`);
    console.log(` Products created/updated   : ${stats.productsCreated}/${stats.productsUpdated}`);
    console.log(` Duplicate products skipped : ${stats.duplicatesSkipped}`);
    console.log(` Product images added       : ${stats.imagesAdded}`);
    console.log(` Product tags written       : ${stats.tagsAdded}`);
    console.log('──────────────────────────────────────────────');
    console.log(`Total categories in DB    : ${finalCat[0].total} (${finalCat[0].top} top-level)`);
    console.log(`Total products in DB      : ${finalProd[0].total}`);
    console.log(`Total product images      : ${finalImg[0].total}`);
    console.log(`Total product tags        : ${finalTags[0].total}`);
    console.log('\n Done. All catalog data now lives in the database.');
  console.log(' (Duplicates are removed automatically on every run — re-running is safe.)');
  } catch (err) {
    console.error('\nMigration failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
