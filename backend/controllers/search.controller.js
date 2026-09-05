const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const sharp = require('sharp');

// ── Color histogram helpers (must match compute-image-fingerprints.js) ──
const BINS_PER_CHANNEL = 4;
const TOTAL_BINS = BINS_PER_CHANNEL ** 3;

async function computeHistogram(imageBuffer) {
  const { data } = await sharp(imageBuffer)
    .resize(32, 32, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const histogram = new Array(TOTAL_BINS).fill(0);

  for (let i = 0; i < data.length; i += 3) {
    const rBin = Math.min(Math.floor(data[i] / (256 / BINS_PER_CHANNEL)), BINS_PER_CHANNEL - 1);
    const gBin = Math.min(Math.floor(data[i + 1] / (256 / BINS_PER_CHANNEL)), BINS_PER_CHANNEL - 1);
    const bBin = Math.min(Math.floor(data[i + 2] / (256 / BINS_PER_CHANNEL)), BINS_PER_CHANNEL - 1);
    const idx = rBin * BINS_PER_CHANNEL * BINS_PER_CHANNEL + gBin * BINS_PER_CHANNEL + bBin;
    histogram[idx]++;
  }

  const max = Math.max(...histogram, 1);
  return histogram.map(v => Math.round((v / max) * 255));
}

function histogramDistance(h1, h2) {
  let sum = 0;
  for (let i = 0; i < h1.length; i++) {
    const diff = h1[i] - h2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

const search = asyncHandler(async (req, res) => {
  const {
    q, category, min_price, max_price, rating, sort,
    brand, region, discount, organic, seasonal, bestseller, in_stock,
  } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 24;
  const offset = (page - 1) * limit;

  const term = (q || '').trim();

  // `q` is now OPTIONAL when the caller browses by filters only (e.g. voice
  // search: "cashew under 500" → ?category=...&max_price=500 with no q).
  const hasBrowseFilter = !!(category || min_price || max_price || rating
    || brand || region || discount || organic || seasonal || bestseller || in_stock);

  if (!term) {
    if (!hasBrowseFilter) {
      return ApiResponse.error(res, 'Search query must be at least 2 characters.', 400);
    }
  } else if (term.length < 2 && !hasBrowseFilter) {
    return ApiResponse.error(res, 'Search query must be at least 2 characters.', 400);
  }

  let whereClause = 'WHERE p.is_active = 1';
  const params = [];

  if (term.length >= 2) {
    const searchTerm = `%${term}%`;
    whereClause += ' AND (p.name LIKE ? OR p.short_description LIKE ? OR p.ingredients LIKE ? OR p.brand LIKE ?)';
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Category — supports numeric id OR slug. Includes the category's child
  // subcategories (products live in the children) so a parent slug such as
  // konkan-mangoes-fruits lists the whole category, like /api/products does.
  if (category) {
    let categoryId = isNaN(category) ? null : parseInt(category, 10);
    if (categoryId === null) {
      const [catRows] = await pool.query(
        'SELECT id FROM categories WHERE slug = ? AND is_active = 1 LIMIT 1',
        [category]
      );
      if (catRows.length > 0) categoryId = catRows[0].id;
    }

    if (categoryId) {
      const [childRows] = await pool.query(
        'SELECT id FROM categories WHERE parent_id = ? AND is_active = 1',
        [categoryId]
      );
      const catIds = [categoryId, ...childRows.map(c => c.id)];
      const placeholders = catIds.map(() => '?').join(',');
      whereClause += ` AND p.category_id IN (${placeholders})`;
      params.push(...catIds);
    } else {
      // Category not found — return no results
      whereClause += ' AND 1 = 0';
    }
  }

  if (min_price) {
    whereClause += ' AND p.price >= ?';
    params.push(min_price);
  }

  if (max_price) {
    whereClause += ' AND p.price <= ?';
    params.push(max_price);
  }

  if (rating) {
    whereClause += ' AND p.average_rating >= ?';
    params.push(rating);
  }

  if (organic === 'true') {
    whereClause += ' AND p.is_organic = 1';
  }

  if (seasonal === 'true') {
    whereClause += ' AND p.is_seasonal = 1';
  }

  if (bestseller === 'true') {
    whereClause += ' AND p.total_sold > 0';
  }

  if (in_stock === 'true') {
    whereClause += ' AND p.stock_quantity > 0';
  }

  if (brand) {
    // Multi-select, case-insensitive: ?brand=kokan%20fresh,goan%20roots
    const brandList = String(brand).split(',').map(b => b.trim().toLowerCase()).filter(Boolean);
    if (brandList.length > 0) {
      const placeholders = brandList.map(() => '?').join(',');
      whereClause += ` AND LOWER(p.brand) IN (${placeholders})`;
      params.push(...brandList);
    }
  }

  if (region) {
    // Multi-select, case-insensitive: ?region=goa,ratnagiri
    const regionList = String(region).split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
    if (regionList.length > 0) {
      const placeholders = regionList.map(() => '?').join(',');
      whereClause += ` AND LOWER(p.region_origin) IN (${placeholders})`;
      params.push(...regionList);
    }
  }

  if (discount && !isNaN(parseInt(discount))) {
    // ?discount=30 → products with ≥30% off (generated discount_percent column)
    whereClause += ' AND p.discount_percent >= ?';
    params.push(parseInt(discount));
  }

  let orderClause = 'ORDER BY p.total_sold DESC, p.average_rating DESC';
  switch (sort) {
    case 'price_asc': orderClause = 'ORDER BY p.price ASC'; break;
    case 'price_desc': orderClause = 'ORDER BY p.price DESC'; break;
    case 'rating': orderClause = 'ORDER BY p.average_rating DESC'; break;
    case 'newest': orderClause = 'ORDER BY p.created_at DESC'; break;
    case 'bestseller': orderClause = 'ORDER BY p.total_sold DESC'; break;
    case 'discount': orderClause = 'ORDER BY p.discount_percent DESC'; break;
    case 'relevance': orderClause = 'ORDER BY p.total_sold DESC, p.average_rating DESC'; break;
  }

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM products p ${whereClause}`, params
  );

  const [products] = await pool.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p
     JOIN categories c ON p.category_id = c.id
     ${whereClause}
     ${orderClause}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // Attach active flash-sale info so search-result cards show the ⚡ badge,
  // sale price and scarcity bar just like the all-products grid.
  const [flashSales] = await pool.query(
    `SELECT product_id, sale_price, original_price, quantity_limit, sold_count, ends_at
     FROM flash_sales
     WHERE is_active = 1 AND NOW() BETWEEN starts_at AND ends_at`
  );
  const flashMap = new Map(flashSales.map((fs) => [Number(fs.product_id), fs]));
  for (const product of products) {
    const fs = flashMap.get(Number(product.id));
    if (fs) {
      product.flash_sale = {
        sale_price: fs.sale_price,
        original_price: fs.original_price,
        quantity_limit: fs.quantity_limit,
        sold_count: fs.sold_count,
        ends_at: fs.ends_at ? new Date(fs.ends_at).toISOString() : null,
      };
    }
  }

  await pool.query(
    'INSERT INTO search_logs (query, results_count, ip_address) VALUES (?, ?, ?)',
    [term || '[filter-browse]', countResult[0].total, req.ip]
  );

  return ApiResponse.paginated(res, { products }, {
    page, limit,
    total: countResult[0].total,
    pages: Math.ceil(countResult[0].total / limit)
  });
});

const getSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length < 2) {
    return ApiResponse.success(res, { suggestions: [] });
  }

  const [suggestions] = await pool.query(
    `SELECT DISTINCT name, slug FROM products 
     WHERE is_active = 1 AND name LIKE ? 
     LIMIT 8`,
    [`%${q.trim()}%`]
  );

  const [categorySuggestions] = await pool.query(
    `SELECT DISTINCT name, slug FROM categories 
     WHERE is_active = 1 AND name LIKE ? 
     LIMIT 4`,
    [`%${q.trim()}%`]
  );

  return ApiResponse.success(res, {
    suggestions,
    categorySuggestions
  });
});

const getTrending = asyncHandler(async (req, res) => {
  const [trending] = await pool.query(
    `SELECT query, COUNT(*) as search_count 
     FROM search_logs 
     WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
     GROUP BY query 
     ORDER BY search_count DESC 
     LIMIT 10`
  );

  return ApiResponse.success(res, { trending });
});

// ── Image-based visual similarity search ──
const searchByImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'Please upload an image to search.', 400);
  }

  try {
    // 1. Compute histogram for uploaded image
    const uploadedHistogram = await computeHistogram(req.file.buffer);

    // 2. Fetch all product images with pre-computed histograms
    const [images] = await pool.query(`
      SELECT pi.product_id, pi.image_url, pi.color_histogram,
             p.name, p.slug, p.price, p.mrp, p.average_rating, p.total_sold,
             c.name as category_name, c.slug as category_slug
      FROM product_images pi
      JOIN products p ON pi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = 1
        AND pi.color_histogram IS NOT NULL
        AND pi.is_primary = 1
    `);

    if (images.length === 0) {
      return ApiResponse.success(res, {
        products: [],
        message: 'No product images have fingerprints yet. Run the compute script first.',
      });
    }

    // 3. Compare and rank by similarity (lower distance = more similar)
    const scored = images.map((img) => {
      const histogram = typeof img.color_histogram === 'string'
        ? JSON.parse(img.color_histogram)
        : img.color_histogram;
      const distance = histogramDistance(uploadedHistogram, histogram);
      // Convert distance to similarity score (0-100, higher = more similar)
      // Max possible distance = sqrt(64 * 255^2) ≈ 2040
      const similarity = Math.max(0, Math.round((1 - distance / 2040) * 100));

      return {
        id: img.product_id,
        name: img.name,
        slug: img.slug,
        price: img.price,
        mrp: img.mrp,
        average_rating: img.average_rating,
        total_sold: img.total_sold,
        category_name: img.category_name,
        category_slug: img.category_slug,
        primary_image: img.image_url,
        similarity,
        distance: Math.round(distance),
      };
    });

    // 4. Sort by similarity (highest first) and return top 20
    scored.sort((a, b) => b.similarity - a.similarity);
    const results = scored.slice(0, 20);

    // 5. Log the search
    await pool.query(
      'INSERT INTO search_logs (query, results_count, ip_address) VALUES (?, ?, ?)',
      [`[image] ${results.length} results`, results.length, req.ip]
    ).catch(() => {}); // Non-critical

    return ApiResponse.success(res, {
      products: results,
      total: results.length,
      query_type: 'image',
    });
  } catch (err) {
    console.error('Image search error:', err);
    return ApiResponse.error(res, 'Image analysis failed. Please try another image.', 500);
  }
});

module.exports = {
  search,
  getSuggestions,
  getTrending,
  searchByImage,
};
