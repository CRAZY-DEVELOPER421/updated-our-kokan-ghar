const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const search = asyncHandler(async (req, res) => {
  const { q, category, min_price, max_price, rating, sort } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 24;
  const offset = (page - 1) * limit;

  if (!q || q.trim().length < 2) {
    return ApiResponse.error(res, 'Search query must be at least 2 characters.', 400);
  }

  let whereClause = 'WHERE p.is_active = 1';
  const params = [];

  const searchTerm = `%${q.trim()}%`;
  whereClause += ' AND (p.name LIKE ? OR p.short_description LIKE ? OR p.ingredients LIKE ? OR p.brand LIKE ?)';
  params.push(searchTerm, searchTerm, searchTerm, searchTerm);

  if (category) {
    whereClause += ' AND p.category_id = ?';
    params.push(category);
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

  let orderClause = 'ORDER BY p.total_sold DESC, p.average_rating DESC';
  switch (sort) {
    case 'price_asc': orderClause = 'ORDER BY p.price ASC'; break;
    case 'price_desc': orderClause = 'ORDER BY p.price DESC'; break;
    case 'rating': orderClause = 'ORDER BY p.average_rating DESC'; break;
    case 'newest': orderClause = 'ORDER BY p.created_at DESC'; break;
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

  await pool.query(
    'INSERT INTO search_logs (query, results_count, ip_address) VALUES (?, ?, ?)',
    [q.trim(), countResult[0].total, req.ip]
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

module.exports = {
  search,
  getSuggestions,
  getTrending
};
