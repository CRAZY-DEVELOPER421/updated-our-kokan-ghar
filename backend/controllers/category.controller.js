const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getCategories = asyncHandler(async (req, res) => {
  const [categories] = await pool.query(
    `SELECT c.*, 
      (SELECT COUNT(*) FROM products p
        JOIN categories ch ON p.category_id = ch.id
        WHERE (ch.id = c.id OR ch.parent_id = c.id) AND p.is_active = 1) as product_count,
      (SELECT name FROM categories WHERE id = c.parent_id) as parent_name
     FROM categories c 
     WHERE c.is_active = 1 
     ORDER BY c.sort_order ASC, c.name ASC`
  );

  const parentCategories = categories.filter(c => c.parent_id === null);
  const childCategories = categories.filter(c => c.parent_id !== null);

  const formattedCategories = parentCategories.map(parent => ({
    ...parent,
    children: childCategories.filter(child => child.parent_id === parent.id)
  }));

  return ApiResponse.success(res, { categories: formattedCategories, all: categories });
});

const getCategoryBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const [categories] = await pool.query(
    `SELECT c.*, 
      (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
     FROM categories c WHERE c.slug = ? AND c.is_active = 1`,
    [slug]
  );

  if (categories.length === 0) {
    return ApiResponse.error(res, 'Category not found.', 404);
  }

  const category = categories[0];

  const [children] = await pool.query(
    `SELECT c.*,
      (SELECT COUNT(*) FROM products WHERE category_id = c.id AND is_active = 1) as product_count
     FROM categories c WHERE c.parent_id = ? AND c.is_active = 1
     ORDER BY c.sort_order ASC`,
    [category.id]
  );

  const parentResult = category.parent_id
    ? await pool.query('SELECT id, name, slug FROM categories WHERE id = ?', [category.parent_id])
    : [];

  category.children = children;
  category.parent = parentResult[0] || null;

  return ApiResponse.success(res, { category });
});

const getCategoryProducts = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 24;
  const offset = (page - 1) * limit;
  const { sort, min_price, max_price, rating } = req.query;

  const [categories] = await pool.query(
    'SELECT id FROM categories WHERE slug = ? AND is_active = 1',
    [slug]
  );

  if (categories.length === 0) {
    return ApiResponse.error(res, 'Category not found.', 404);
  }

  const categoryId = categories[0].id;

  const [children] = await pool.query(
    'SELECT id FROM categories WHERE parent_id = ?',
    [categoryId]
  );

  const categoryIds = [categoryId, ...children.map(c => c.id)];
  const placeholders = categoryIds.map(() => '?').join(',');

  let whereClause = `WHERE p.category_id IN (${placeholders}) AND p.is_active = 1`;
  const params = [...categoryIds];

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

  let orderClause = 'ORDER BY p.created_at DESC';
  switch (sort) {
    case 'price_asc': orderClause = 'ORDER BY p.price ASC'; break;
    case 'price_desc': orderClause = 'ORDER BY p.price DESC'; break;
    case 'rating': orderClause = 'ORDER BY p.average_rating DESC'; break;
    case 'newest': orderClause = 'ORDER BY p.created_at DESC'; break;
    case 'bestseller': orderClause = 'ORDER BY p.total_sold DESC'; break;
  }

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM products p ${whereClause}`, params
  );

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
    page, limit,
    total: countResult[0].total,
    pages: Math.ceil(countResult[0].total / limit)
  });
});

module.exports = {
  getCategories,
  getCategoryBySlug,
  getCategoryProducts
};
