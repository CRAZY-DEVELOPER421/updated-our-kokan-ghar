const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');  const getProducts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const offset = (page - 1) * limit;
    const { category, sub, min_price, max_price, rating, sort, q, organic, seasonal, featured, region, brand, in_stock, discount, bestseller, lang } = req.query;

  let whereClause = 'WHERE p.is_active = 1';
  const params = [];

  if (category) {
    // Resolve category slug to ID if not already numeric
    let categoryId = isNaN(category) ? null : parseInt(category);
    if (categoryId === null) {
      const [catRows] = await pool.query(
        'SELECT id FROM categories WHERE slug = ? AND is_active = 1',
        [category]
      );
      if (catRows.length > 0) {
        categoryId = catRows[0].id;
      }
    }

    if (categoryId) {
      // If `sub` is set, filter to that specific subcategory only.
      // Otherwise include the parent + all children.
      if (sub) {
        let subId = isNaN(sub) ? null : parseInt(sub);
        if (subId === null) {
          const [subRows] = await pool.query(
            'SELECT id FROM categories WHERE slug = ? AND is_active = 1',
            [sub]
          );
          if (subRows.length > 0) subId = subRows[0].id;
        }
        if (subId) {
          whereClause += ' AND p.category_id = ?';
          params.push(subId);
        }
      } else {
        // Find child category IDs (subcategories)
        const [childRows] = await pool.query(
          'SELECT id FROM categories WHERE parent_id = ? AND is_active = 1',
          [categoryId]
        );

        // Build list of category IDs: the category itself + its children
        const catIds = [categoryId, ...childRows.map(c => c.id)];
        const placeholders = catIds.map(() => '?').join(',');
        whereClause += ` AND p.category_id IN (${placeholders})`;
        params.push(...catIds);
      }
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

  if (featured === 'true') {
    whereClause += ' AND p.is_featured = 1';
  }

  if (q) {
    whereClause += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.short_description LIKE ?)';
    const searchTerm = `%${q}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (region) {
    // Multi-select, case-insensitive: ?region=goa,ratnagiri matches either.
    const regionList = String(region).split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
    if (regionList.length > 0) {
      const placeholders = regionList.map(() => '?').join(',');
      whereClause += ` AND LOWER(p.region_origin) IN (${placeholders})`;
      params.push(...regionList);
    }
  }

  if (brand) {
    // Multi-select, case-insensitive: ?brand=kokan%20fresh,goan%20roots matches either.
    const brandList = String(brand).split(',').map((b) => b.trim().toLowerCase()).filter(Boolean);
    if (brandList.length > 0) {
      const placeholders = brandList.map(() => '?').join(',');
      whereClause += ` AND LOWER(p.brand) IN (${placeholders})`;
      params.push(...brandList);
    }
  }

  if (in_stock === 'true') {
    whereClause += ' AND p.stock_quantity > 0';
  }

  if (discount && !isNaN(parseInt(discount))) {
    // ?discount=30 → products with ≥30% off (discount_percent column)
    whereClause += ' AND p.discount_percent >= ?';
    params.push(parseInt(discount));
  }

  if (bestseller === 'true') {
    whereClause += ' AND p.total_sold > 0';
  }

  // Default (no explicit sort) = alphabetical by name so shoppers can
  // quickly find a specific product while browsing a category.
  let orderClause = 'ORDER BY p.name ASC';
  switch (sort) {
    case 'price_asc':
      orderClause = 'ORDER BY p.price ASC';
      break;
    case 'price_desc':
      orderClause = 'ORDER BY p.price DESC';
      break;
    case 'rating':
      orderClause = 'ORDER BY p.average_rating DESC';
      break;
    case 'newest':
      orderClause = 'ORDER BY p.created_at DESC';
      break;
    case 'bestseller':
      orderClause = 'ORDER BY p.total_sold DESC';
      break;
    case 'discount':
    case 'discount_desc':
      orderClause = 'ORDER BY p.discount_percent DESC';
      break;
    default:
      // 'relevance' or unknown values → alphabetical (case-insensitive
      // thanks to the utf8mb4_unicode_ci collation).
      orderClause = 'ORDER BY p.name ASC';
  }

  const countQuery = `SELECT COUNT(*) as total FROM products p JOIN categories c ON p.category_id = c.id ${whereClause}`;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  const query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
    FROM products p
    JOIN categories c ON p.category_id = c.id
    ${whereClause}
    ${orderClause}
    LIMIT ? OFFSET ?
  `;

  const [products] = await pool.query(query, [...params, limit, offset]);

  // Attach active flash-sale info to each product so cards can show
  // "⚡ Flash Sale" badges, sale pricing and scarcity bars.
  const [flashSales] = await pool.query(
    `SELECT product_id, sale_price, original_price, quantity_limit, sold_count, starts_at, ends_at
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

  // Apply regional content to each product in the listing
  for (const p of products) resolveRegional(p, lang);

  return ApiResponse.paginated(res, { products }, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

// Helper: resolve regional content for a product based on ?lang= query param.
// If lang is provided and the product has a translation, the regional fields
// override the English defaults so the frontend can render localized content.
function resolveRegional(product, lang) {
  if (!lang || lang === 'en' || !product) return product;
  const suffix = `_${lang}`;
  // name_mr, description_mr, short_description_mr, meta_title_mr, meta_description_mr
  for (const field of ['name', 'description', 'short_description', 'meta_title', 'meta_description']) {
    const regionalField = `${field}${suffix}`;
    if (product[regionalField]) {
      product[`regional_${field}`] = product[regionalField];
    }
  }
  product.regional_lang = lang;
  return product;
}

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const lang = req.query.lang || req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';

  const [products] = await pool.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.slug = ? AND p.is_active = 1`,
    [slug]
  );

  if (products.length === 0) {
    return ApiResponse.error(res, 'Product not found.', 404);
  }

  const product = products[0];

  const [images] = await pool.query(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    [product.id]
  );

  const [variants] = await pool.query(
    'SELECT * FROM product_variants WHERE product_id = ?',
    [product.id]
  );

  const [tags] = await pool.query(
    'SELECT tag FROM product_tags WHERE product_id = ?',
    [product.id]
  );

  const [flashSale] = await pool.query(
    `SELECT * FROM flash_sales 
     WHERE product_id = ? AND is_active = 1 
     AND NOW() BETWEEN starts_at AND ends_at
     LIMIT 1`,
    [product.id]
  );

  await pool.query(
    'UPDATE products SET views_count = views_count + 1 WHERE id = ?',
    [product.id]
  );

  product.images = images;
  product.variants = variants;
  product.tags = tags.map(t => t.tag);
  product.flash_sale = flashSale.length > 0 ? flashSale[0] : null;
  product.tags_list = tags.map(t => t.tag);

  // Apply regional content based on ?lang= param
  resolveRegional(product, lang);

  return ApiResponse.success(res, { product });
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const [products] = await pool.query(
    `SELECT p.*, 
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p WHERE p.is_active = 1 AND p.is_featured = 1 
     ORDER BY p.created_at DESC LIMIT 12`
  );

  return ApiResponse.success(res, { products });
});

const getBestsellers = asyncHandler(async (req, res) => {
  const [products] = await pool.query(
    `SELECT p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p WHERE p.is_active = 1 AND p.is_bestseller = 1 
     ORDER BY p.total_sold DESC LIMIT 12`
  );

  return ApiResponse.success(res, { products });
});

const getSeasonalProducts = asyncHandler(async (req, res) => {
  const [products] = await pool.query(
    `SELECT p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p WHERE p.is_active = 1 AND p.is_seasonal = 1 
     ORDER BY p.created_at DESC LIMIT 12`
  );

  return ApiResponse.success(res, { products });
});

const getNewArrivals = asyncHandler(async (req, res) => {
  const [products] = await pool.query(
    `SELECT p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p WHERE p.is_active = 1 
     ORDER BY p.created_at DESC LIMIT 12`
  );

  return ApiResponse.success(res, { products });
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [product] = await pool.query(
    'SELECT category_id, price FROM products WHERE id = ?',
    [id]
  );
  if (product.length === 0) {
    return ApiResponse.error(res, 'Product not found.', 404);
  }

  const { category_id, price } = product[0];
  const priceNum = parseFloat(price) || 0;

  // Price range: ±40% of current product price
  const minPrice = Math.max(priceNum * 0.6, priceNum - 200);
  const maxPrice = priceNum * 1.4 + 200;

  // Find the parent category — categories are hierarchical (parent → children).
  // Each child has only 1 product, so we need to look at siblings under
  // the same parent. If this category IS the parent, use it directly.
  const [catRow] = await pool.query(
    'SELECT parent_id FROM categories WHERE id = ?',
    [category_id]
  );
  const parentId = catRow[0]?.parent_id || category_id;

  // Category IDs to search: the parent + all its children
  const [siblingCats] = await pool.query(
    'SELECT id FROM categories WHERE id = ? OR parent_id = ?',
    [parentId, parentId]
  );
  const catIds = siblingCats.map(c => c.id);
  if (catIds.length === 0) catIds.push(category_id);

  // Build the category placeholder: (?, ?, ?, ...)
  const catPlaceholders = catIds.map(() => '?').join(',');

  // First try: same parent category + similar price range (most relevant)
  let [products] = await pool.query(
    `SELECT p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
      c.name as category_name
     FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.category_id IN (${catPlaceholders}) AND p.id != ? AND p.is_active = 1
       AND p.price BETWEEN ? AND ?
     ORDER BY p.total_sold DESC, p.average_rating DESC
     LIMIT 8`,
    [...catIds, id, minPrice, maxPrice]
  );

  // Fallback: same parent category, any price (fill up to 8)
  if (products.length < 4) {
    const existingIds = products.map(p => p.id);
    const existingPlaceholders = existingIds.length > 0 ? existingIds.map(() => '?').join(',') : '0';
    const [extras] = await pool.query(
      `SELECT p.*,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
        c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.category_id IN (${catPlaceholders}) AND p.id != ? AND p.is_active = 1
         AND p.id NOT IN (${existingPlaceholders})
       ORDER BY p.total_sold DESC, p.average_rating DESC
       LIMIT ?`,
      [...catIds, id, ...existingIds, 8 - products.length]
    );
    products = [...products, ...extras];
  }

  return ApiResponse.success(res, { products });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const [reviews] = await pool.query(
    `SELECT r.*, u.name as user_name, u.avatar_url as user_avatar
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     WHERE r.product_id = ? AND r.is_approved = 1
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [id, limit, offset]
  );

  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM reviews WHERE product_id = ? AND is_approved = 1',
    [id]
  );

  const [ratingStats] = await pool.query(
    `SELECT 
      COUNT(*) as total,
      AVG(rating) as avg_rating,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
     FROM reviews WHERE product_id = ? AND is_approved = 1`,
    [id]
  );

  return ApiResponse.paginated(res, {
    reviews,
    ratingStats: ratingStats[0]
  }, {
    page,
    limit,
    total: countResult[0].total,
    pages: Math.ceil(countResult[0].total / limit)
  });
});

const createReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, body, images } = req.body;

  const [existing] = await pool.query(
    'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (existing.length > 0) {
    return ApiResponse.error(res, 'You have already reviewed this product.', 400);
  }

  // Normalize attached media: accept [{ type: 'image'|'video', url }] or legacy plain URL strings.
  let imagesJson = null;
  if (Array.isArray(images) && images.length > 0) {
    const cleaned = images
      .map((img) => {
        if (typeof img === 'string' && img.trim()) return { type: 'image', url: img.trim() };
        if (img && typeof img === 'object' && img.url && ['image', 'video'].includes(img.type)) {
          return { type: img.type, url: String(img.url).trim() };
        }
        return null;
      })
      .filter(Boolean);
    if (cleaned.length > 0) imagesJson = JSON.stringify(cleaned);
  }

  // Reviews are published immediately (auto-approved) so they (and their
  // photos/videos) show up right away. Moderation can be added later — see
  // the public query below which only returns is_approved = 1.
  const [result] = await pool.query(
    'INSERT INTO reviews (product_id, user_id, rating, title, body, images, is_approved) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [id, req.user.id, rating, title || null, body || null, imagesJson]
  );

  const [avgRating] = await pool.query(
    'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ? AND is_approved = 1',
    [id]
  );

  if (avgRating[0].review_count > 0) {
    await pool.query(
      'UPDATE products SET average_rating = ?, review_count = ? WHERE id = ?',
      [Math.round(avgRating[0].avg_rating * 100) / 100, avgRating[0].review_count, id]
    );
  }

  const [review] = await pool.query(
    `SELECT r.*, u.name as user_name 
     FROM reviews r JOIN users u ON r.user_id = u.id 
     WHERE r.id = ?`,
    [result.insertId]
  );

  return ApiResponse.created(res, { review: review[0] }, 'Review submitted successfully.');
});

const getDealsUnder999 = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;

  const [products] = await pool.query(
    `SELECT p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p
     WHERE p.is_active = 1 AND p.price <= 999 AND p.discount_percent > 0
     ORDER BY p.discount_percent DESC
     LIMIT ?`,
    [limit]
  );

  return ApiResponse.success(res, { products });
});

const getCategoryDeals = asyncHandler(async (req, res) => {
  const maxPrice = parseInt(req.query.max_price) || 499;

  const [categories] = await pool.query(
    `SELECT 
      c.id,
      c.name,
      c.slug,
      c.image_url as category_image,
      MIN(p.price) as starting_price,
      COUNT(p.id) as product_count,
      (
        SELECT pi.image_url 
        FROM products p2 
        LEFT JOIN product_images pi ON pi.product_id = p2.id AND pi.is_primary = 1
        WHERE p2.category_id = c.id AND p2.is_active = 1 AND p2.price <= ?
        ORDER BY p2.price ASC 
        LIMIT 1
      ) as representative_image
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE p.is_active = 1 AND p.price <= ?
    GROUP BY c.id, c.name, c.slug, c.image_url
    HAVING product_count > 0
    ORDER BY product_count DESC, c.name ASC`,
    [maxPrice, maxPrice]
  );

  return ApiResponse.success(res, { categories });
});

const getFilterOptions = asyncHandler(async (req, res) => {
  const [brands] = await pool.query(
    `SELECT brand, COUNT(*) as count FROM products
     WHERE is_active = 1 AND brand IS NOT NULL AND brand != ''
     GROUP BY brand ORDER BY brand ASC`
  );
  const [regions] = await pool.query(
    `SELECT region_origin, COUNT(*) as count FROM products
     WHERE is_active = 1 AND region_origin IS NOT NULL AND region_origin != ''
     GROUP BY region_origin ORDER BY region_origin ASC`
  );
  const [priceRange] = await pool.query(
    'SELECT MIN(price) as min_price, MAX(price) as max_price FROM products WHERE is_active = 1'
  );
  // Round the max up to a friendly number (e.g. 2235 → 2500) so the slider
  // feels natural; min stays as the real floor.
  const rawMax = Number(priceRange[0]?.max_price || 0);
  const maxPrice = rawMax > 0 ? Math.ceil(rawMax / 250) * 250 : 5000;
  return ApiResponse.success(res, {
    brands: brands.map((b) => ({ name: b.brand, count: Number(b.count) })),
    regions: regions.map((r) => ({ name: r.region_origin, count: Number(r.count) })),
    price_range: {
      min: Math.floor(Number(priceRange[0]?.min_price || 0)),
      max: maxPrice,
    },
  });
});

const getRegions = asyncHandler(async (req, res) => {
  const [regions] = await pool.query(
    `SELECT
      p.region_origin as name,
      COUNT(p.id) as product_count,
      MIN(p.price) as starting_price,
      (
        SELECT pi.image_url
        FROM products p2
        LEFT JOIN product_images pi ON pi.product_id = p2.id AND pi.is_primary = 1
        WHERE p2.region_origin = p.region_origin AND p2.is_active = 1
        ORDER BY p2.total_sold DESC, p2.id ASC
        LIMIT 1
      ) as representative_image
     FROM products p
     WHERE p.is_active = 1 AND p.region_origin IS NOT NULL AND p.region_origin != ''
     GROUP BY p.region_origin
     HAVING product_count > 0
     ORDER BY product_count DESC, p.region_origin ASC`
  );

  return ApiResponse.success(res, { regions });
});

const getRandomProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const offset = (page - 1) * limit;
  const { category, min_price, max_price } = req.query;

  let whereClause = 'WHERE p.is_active = 1';
  const params = [];
  const hasFilters = category || min_price || max_price;

  if (category) {
    let categoryId = isNaN(category) ? null : parseInt(category);
    if (categoryId === null) {
      const [catRows] = await pool.query(
        'SELECT id FROM categories WHERE slug = ? AND is_active = 1',
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

  // Count total matching products
  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM products p ${whereClause}`, params
  );
  const total = countResult[0].total;

  // Use RAND() when no filters, normal ordering when filters active
  const orderClause = hasFilters ? 'ORDER BY p.created_at DESC' : 'ORDER BY RAND()';

  const [products] = await pool.query(
    `SELECT p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p
     ${whereClause}
     ${orderClause}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return ApiResponse.paginated(res, { products }, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});  const getProductsByIds = asyncHandler(async (req, res) => {
    const { ids, lang } = req.query;
    if (!ids) return ApiResponse.error(res, 'ids parameter is required.', 400);

    const idList = String(ids).split(',').map(Number).filter(Boolean);
    if (idList.length === 0) return ApiResponse.error(res, 'No valid IDs provided.', 400);
    if (idList.length > 10) return ApiResponse.error(res, 'Maximum 10 products per comparison.', 400);

    const placeholders = idList.map(() => '?').join(',');
    const [products] = await pool.query(
      `SELECT p.*, c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
       FROM products p
       JOIN categories c ON p.category_id = c.id
       WHERE p.id IN (${placeholders}) AND p.is_active = 1`,
      idList
    );

    // Apply regional content
    for (const p of products) resolveRegional(p, lang);

    return ApiResponse.success(res, { products });
  });

module.exports = {
  getProducts,
  getRegions,
  getFilterOptions,
  getProductBySlug,
  getFeaturedProducts,
  getBestsellers,
  getSeasonalProducts,
  getNewArrivals,
  getRelatedProducts,
  getProductReviews,
  createReview,
  getDealsUnder999,
  getCategoryDeals,
  getRandomProducts,
  getProductsByIds
};
