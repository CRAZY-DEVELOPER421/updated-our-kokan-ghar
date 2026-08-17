const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 24;
  const offset = (page - 1) * limit;
  const { category, min_price, max_price, rating, sort, q, organic, seasonal, featured } = req.query;

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

  let orderClause = 'ORDER BY p.created_at DESC';
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
      orderClause = 'ORDER BY p.discount_percent DESC';
      break;
    default:
      orderClause = 'ORDER BY p.created_at DESC';
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

  return ApiResponse.paginated(res, { products }, {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

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

  const [product] = await pool.query('SELECT category_id FROM products WHERE id = ?', [id]);
  if (product.length === 0) {
    return ApiResponse.error(res, 'Product not found.', 404);
  }

  const [products] = await pool.query(
    `SELECT p.*,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM products p 
     WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
     ORDER BY RAND() LIMIT 8`,
    [product[0].category_id, id]
  );

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
});

module.exports = {
  getProducts,
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
  getRandomProducts
};
