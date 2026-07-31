const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateUniqueSlug } = require('../utils/generateSlug');
const { createNotification } = require('../services/notification.service');

// ===== PRODUCT MANAGEMENT =====
const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { search, category, imageStatus, status } = req.query;

  let whereClause = 'WHERE 1=1';
  const params = [];

  if (search) {
    whereClause += ' AND p.name LIKE ?';
    params.push(`%${search}%`);
  }

  if (category) {
    const categoryId = isNaN(category) ? null : parseInt(category);
    if (categoryId) {
      whereClause += ' AND p.category_id = ?';
      params.push(categoryId);
    }
  }

  if (status === 'active') {
    whereClause += ' AND p.is_active = 1';
  } else if (status === 'inactive') {
    whereClause += ' AND p.is_active = 0';
  }

  // Count query (respects all filters except imageStatus)
  let countQuery = `SELECT COUNT(*) as total FROM products p ${whereClause}`;

  if (imageStatus === 'uploaded') {
    countQuery = `SELECT COUNT(*) as total FROM products p WHERE EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id) ${whereClause.replace('WHERE 1=1', '')}`;
  } else if (imageStatus === 'pending') {
    countQuery = `SELECT COUNT(*) as total FROM products p WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id) ${whereClause.replace('WHERE 1=1', '')}`;
  }

  const [countResult] = await pool.query(countQuery, params);

  // Build main query
  let mainQuery = `
    SELECT p.*,
      c.name as category_name,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereClause}
  `;

  if (imageStatus === 'uploaded') {
    mainQuery = `
      SELECT p.*,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id) ${whereClause.replace('WHERE 1=1', '')}
    `;
  } else if (imageStatus === 'pending') {
    mainQuery = `
      SELECT p.*,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id) ${whereClause.replace('WHERE 1=1', '')}
    `;
  }

  mainQuery += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';

  const [products] = await pool.query(mainQuery, [...params, limit, offset]);

  return ApiResponse.paginated(res, { products }, {
    page, limit,
    total: countResult[0].total,
    pages: Math.ceil(countResult[0].total / limit)
  });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, short_description, price, mrp, stock_quantity, sku, category_id, brand, weight_grams, unit, is_featured, is_bestseller, is_seasonal, is_organic, region_origin, shelf_life_days, ingredients, nutritional_info, storage_instructions } = req.body;

  const slug = await generateUniqueSlug(name, 'products', pool);

  const [result] = await pool.query(
    `INSERT INTO products (name, slug, description, short_description, price, mrp, stock_quantity, sku, category_id, brand, weight_grams, unit, is_featured, is_bestseller, is_seasonal, is_organic, region_origin, shelf_life_days, ingredients, nutritional_info, storage_instructions)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, slug, description, short_description, price, mrp, stock_quantity, sku, category_id, brand, weight_grams, unit, is_featured || 0, is_bestseller || 0, is_seasonal || 0, is_organic || 0, region_origin, shelf_life_days, ingredients, nutritional_info ? JSON.stringify(nutritional_info) : null, storage_instructions]
  );

  return ApiResponse.created(res, { id: result.insertId, slug }, 'Product created.');
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id' && key !== 'slug') {
      if (key === 'nutritional_info') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
  }

  if (fields.length === 0) {
    return ApiResponse.error(res, 'No fields to update.', 400);
  }

  values.push(id);
  await pool.query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    values
  );

  return ApiResponse.success(res, {}, 'Product updated.');
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Product deleted.');
});

const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [products] = await pool.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ?`,
    [id]
  );

  if (products.length === 0) {
    return ApiResponse.error(res, 'Product not found.', 404);
  }

  const product = products[0];

  const [images] = await pool.query(
    'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC',
    [id]
  );

  const [variants] = await pool.query(
    'SELECT * FROM product_variants WHERE product_id = ?',
    [id]
  );

  const [tags] = await pool.query(
    'SELECT tag FROM product_tags WHERE product_id = ?',
    [id]
  );

  const [flashSale] = await pool.query(
    `SELECT * FROM flash_sales
     WHERE product_id = ? AND is_active = 1
     AND NOW() BETWEEN starts_at AND ends_at
     LIMIT 1`,
    [id]
  );

  product.images = images;
  product.variants = variants;
  product.tags = tags.map(t => t.tag);
  product.flash_sale = flashSale.length > 0 ? flashSale[0] : null;

  try {
    product.nutritional_info = typeof product.nutritional_info === 'string'
      ? JSON.parse(product.nutritional_info)
      : product.nutritional_info;
  } catch (e) {
    product.nutritional_info = null;
  }

  return ApiResponse.success(res, { product });
});

// ===== CATEGORY MANAGEMENT =====
const getCategories = asyncHandler(async (req, res) => {
  const [categories] = await pool.query(
    `SELECT c.*,
      (SELECT COUNT(*) FROM products WHERE category_id = c.id) as product_count,
      (SELECT name FROM categories WHERE id = c.parent_id) as parent_name
     FROM categories c
     ORDER BY c.sort_order ASC, c.name ASC`
  );

  return ApiResponse.success(res, { categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image_url, parent_id, sort_order, meta_title, meta_description } = req.body;
  const slug = await generateUniqueSlug(name, 'categories', pool);

  const [result] = await pool.query(
    'INSERT INTO categories (name, slug, description, image_url, parent_id, sort_order, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, slug, description, image_url, parent_id || null, sort_order || 0, meta_title, meta_description]
  );

  return ApiResponse.created(res, { id: result.insertId, slug }, 'Category created.');
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return ApiResponse.error(res, 'No fields to update.', 400);
  }

  values.push(id);
  await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);

  return ApiResponse.success(res, {}, 'Category updated.');
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM categories WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Category deleted.');
});

// ===== ORDER MANAGEMENT =====
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, message, location } = req.body;

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  if (!validStatuses.includes(status)) {
    return ApiResponse.error(res, 'Invalid status.', 400);
  }

  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

  await pool.query(
    'INSERT INTO order_tracking (order_id, status, message, location) VALUES (?, ?, ?, ?)',
    [id, status, message || `Status updated to ${status}`, location || null]
  );

  if (status === 'delivered') {
    await pool.query('UPDATE orders SET delivered_at = NOW() WHERE id = ?', [id]);
  }

  // Send notification to the order's user based on status
  const [orderInfo] = await pool.query(
    'SELECT user_id, order_number FROM orders WHERE id = ?',
    [id]
  );

  if (orderInfo.length > 0) {
    const { user_id, order_number } = orderInfo[0];

    if (status === 'shipped') {
      await createNotification(
        user_id,
        'order_shipped',
        `Order #${order_number} has been shipped!`,
        `Your order is on its way! ${location ? `Current location: ${location}` : 'Track your order for real-time updates.'}`,
        { order_id: id, order_number, location: location || null }
      );
    } else if (status === 'out_for_delivery') {
      await createNotification(
        user_id,
        'order_shipped',
        `Order #${order_number} is out for delivery!`,
        `Your package is out for delivery and will arrive soon!`,
        { order_id: id, order_number }
      );
    } else if (status === 'delivered') {
      await createNotification(
        user_id,
        'order_delivered',
        `Order #${order_number} delivered! 🎉`,
        'Your order has been delivered. Enjoy your Konkan products! Please leave a review.',
        { order_id: id, order_number }
      );
    } else if (status === 'confirmed') {
      await createNotification(
        user_id,
        'order_confirmed',
        `Order #${order_number} confirmed!`,
        'Your order has been confirmed and is being prepared.',
        { order_id: id, order_number }
      );
    }
  }

  return ApiResponse.success(res, {}, 'Order status updated.');
});

const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { status } = req.query;

  let whereClause = '';
  const params = [];

  if (status) {
    whereClause = 'WHERE o.status = ?';
    params.push(status);
  }

  const [countResult] = await pool.query(
    `SELECT COUNT(*) as total FROM orders o ${whereClause}`, params
  );

  const [orders] = await pool.query(
    `SELECT o.*, u.name as user_name, u.email as user_email
     FROM orders o
     JOIN users u ON o.user_id = u.id
     ${whereClause}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return ApiResponse.paginated(res, { orders }, {
    page, limit,
    total: countResult[0].total,
    pages: Math.ceil(countResult[0].total / limit)
  });
});

// ===== COUPON MANAGEMENT =====
const getCoupons = asyncHandler(async (req, res) => {
  const [coupons] = await pool.query(
    'SELECT * FROM coupons ORDER BY created_at DESC'
  );

  return ApiResponse.success(res, { coupons });
});

const createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, min_order_amount, max_discount, usage_limit, is_active, valid_from, valid_until, description } = req.body;

  const [result] = await pool.query(
    'INSERT INTO coupons (code, type, value, min_order_amount, max_discount, usage_limit, is_active, valid_from, valid_until, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [code.toUpperCase(), type, value, min_order_amount || 0, max_discount, usage_limit || 0, is_active !== undefined ? is_active : 1, valid_from, valid_until, description]
  );

  return ApiResponse.created(res, { id: result.insertId, code: code.toUpperCase() }, 'Coupon created.');
});

const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return ApiResponse.error(res, 'No fields to update.', 400);
  }

  values.push(id);
  await pool.query(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`, values);

  return ApiResponse.success(res, {}, 'Coupon updated.');
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM coupons WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Coupon deleted.');
});

// ===== BANNER MANAGEMENT =====
const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, image_url, mobile_image_url, link_url, position, sort_order, is_active } = req.body;

  const [result] = await pool.query(
    'INSERT INTO banners (title, subtitle, image_url, mobile_image_url, link_url, position, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [title, subtitle, image_url, mobile_image_url, link_url, position || 'hero', sort_order || 0, is_active !== undefined ? is_active : 1]
  );

  return ApiResponse.created(res, { id: result.insertId }, 'Banner created.');
});

const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return ApiResponse.error(res, 'No fields to update.', 400);
  }

  values.push(id);
  await pool.query(`UPDATE banners SET ${fields.join(', ')} WHERE id = ?`, values);

  return ApiResponse.success(res, {}, 'Banner updated.');
});

const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM banners WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Banner deleted.');
});

// ===== FLASH SALE MANAGEMENT =====
const createFlashSale = asyncHandler(async (req, res) => {
  const { product_id, sale_price, original_price, quantity_limit, starts_at, ends_at } = req.body;

  const [result] = await pool.query(
    'INSERT INTO flash_sales (product_id, sale_price, original_price, quantity_limit, starts_at, ends_at, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [product_id, sale_price, original_price, quantity_limit, starts_at, ends_at]
  );

  return ApiResponse.created(res, { id: result.insertId }, 'Flash sale created.');
});

// ===== USER MANAGEMENT =====
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);
  return ApiResponse.success(res, {}, `User ${is_active ? 'activated' : 'suspended'}.`);
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Don't allow deleting self
  if (parseInt(id) === req.user.id) {
    return ApiResponse.error(res, 'Cannot delete your own account.', 400);
  }

  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'User deleted.');
});

const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [orders] = await pool.query(
    `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
     FROM orders o
     JOIN users u ON o.user_id = u.id
     WHERE o.id = ?`,
    [id]
  );

  if (orders.length === 0) {
    return ApiResponse.error(res, 'Order not found.', 404);
  }

  const order = orders[0];

  const [items] = await pool.query(
    'SELECT * FROM order_items WHERE order_id = ?',
    [id]
  );

  const [tracking] = await pool.query(
    'SELECT * FROM order_tracking WHERE order_id = ? ORDER BY created_at ASC',
    [id]
  );

  const [addresses] = await pool.query(
    'SELECT * FROM addresses WHERE id = ?',
    [order.address_id]
  );

  order.items = items;
  order.tracking = tracking;
  order.address = addresses[0] || null;

  return ApiResponse.success(res, { order });
});

const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');
  const [users] = await pool.query(
    'SELECT id, name, email, phone, role, is_verified, is_active, last_login, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );

  return ApiResponse.paginated(res, { users }, {
    page, limit,
    total: countResult[0].total,
    pages: Math.ceil(countResult[0].total / limit)
  });
});

// ===== DASHBOARD ANALYTICS =====
const getDashboard = asyncHandler(async (req, res) => {
  const [totalUsers] = await pool.query('SELECT COUNT(*) as total FROM users');
  const [totalProducts] = await pool.query('SELECT COUNT(*) as total FROM products WHERE is_active = 1');
  const [totalOrders] = await pool.query('SELECT COUNT(*) as total FROM orders');
  const [totalRevenue] = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = "paid"');
  const [recentOrders] = await pool.query(
    'SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10'
  );
  const [ordersByStatus] = await pool.query(
    'SELECT status, COUNT(*) as count FROM orders GROUP BY status'
  );
  const [monthlyRevenue] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COALESCE(SUM(total_amount), 0) as revenue
     FROM orders WHERE payment_status = 'paid' AND created_at > DATE_SUB(NOW(), INTERVAL 6 MONTH)
     GROUP BY month ORDER BY month ASC`
  );

  return ApiResponse.success(res, {
    stats: {
      total_users: totalUsers[0].total,
      total_products: totalProducts[0].total,
      total_orders: totalOrders[0].total,
      total_revenue: totalRevenue[0].total
    },
    recent_orders: recentOrders,
    orders_by_status: ordersByStatus,
    monthly_revenue: monthlyRevenue
  });
});

const getTopProducts = asyncHandler(async (req, res) => {
  const [products] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.total_sold, p.average_rating, p.views_count,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
     FROM products p
     WHERE p.is_active = 1
     ORDER BY p.total_sold DESC
     LIMIT 20`
  );

  return ApiResponse.success(res, { products });
});

const getCategoryPerformance = asyncHandler(async (req, res) => {
  const [categories] = await pool.query(
    `SELECT c.id, c.name, c.slug,
      COUNT(DISTINCT p.id) as product_count,
      COALESCE(SUM(oi.quantity), 0) as units_sold,
      COALESCE(SUM(oi.total_price), 0) as revenue
     FROM categories c
     LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
     LEFT JOIN order_items oi ON p.id = oi.product_id
     LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
     GROUP BY c.id
     ORDER BY revenue DESC`
  );

  return ApiResponse.success(res, { categories });
});

const getSearchTerms = asyncHandler(async (req, res) => {
  const [terms] = await pool.query(
    `SELECT query, COUNT(*) as search_count, AVG(results_count) as avg_results
     FROM search_logs
     WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY query
     ORDER BY search_count DESC
     LIMIT 50`
  );

  return ApiResponse.success(res, { terms });
});

// ===== IMAGE MANAGEMENT =====
const addProductImage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { image_url, alt_text, is_primary } = req.body;

  if (!image_url) {
    return ApiResponse.error(res, 'image_url is required.', 400);
  }

  // Get current max sort_order
  const [maxSort] = await pool.query(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 as next_sort FROM product_images WHERE product_id = ?',
    [id]
  );

  const [result] = await pool.query(
    'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)',
    [id, image_url, alt_text || null, maxSort[0].next_sort, is_primary ? 1 : 0]
  );

  if (is_primary) {
    await pool.query(
      'UPDATE product_images SET is_primary = 0 WHERE product_id = ? AND id != ?',
      [id, result.insertId]
    );
  }

  return ApiResponse.created(res, { id: result.insertId }, 'Image added.');
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  const [images] = await pool.query(
    'SELECT is_primary FROM product_images WHERE id = ? AND product_id = ?',
    [imageId, id]
  );

  if (images.length === 0) {
    return ApiResponse.error(res, 'Image not found.', 404);
  }

  await pool.query('DELETE FROM product_images WHERE id = ?', [imageId]);

  // If deleted image was primary, set another image as primary
  if (images[0].is_primary) {
    const [remaining] = await pool.query(
      'SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1',
      [id]
    );
    if (remaining.length > 0) {
      await pool.query(
        'UPDATE product_images SET is_primary = 1 WHERE id = ?',
        [remaining[0].id]
      );
    }
  }

  return ApiResponse.success(res, {}, 'Image deleted.');
});

const setPrimaryImage = asyncHandler(async (req, res) => {
  const { id, imageId } = req.params;

  await pool.query(
    'UPDATE product_images SET is_primary = 0 WHERE product_id = ?',
    [id]
  );
  await pool.query(
    'UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?',
    [imageId, id]
  );

  return ApiResponse.success(res, {}, 'Primary image updated.');
});

// ===== VARIANT MANAGEMENT =====
const addVariant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { variant_name, variant_value, price_modifier, stock_quantity, sku_suffix } = req.body;

  const [result] = await pool.query(
    'INSERT INTO product_variants (product_id, variant_name, variant_value, price_modifier, stock_quantity, sku_suffix) VALUES (?, ?, ?, ?, ?, ?)',
    [id, variant_name, variant_value, price_modifier || 0, stock_quantity || 0, sku_suffix || null]
  );

  return ApiResponse.created(res, { id: result.insertId }, 'Variant added.');
});

const updateVariant = asyncHandler(async (req, res) => {
  const { id, variantId } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return ApiResponse.error(res, 'No fields to update.', 400);
  }

  values.push(variantId, id);
  await pool.query(
    `UPDATE product_variants SET ${fields.join(', ')} WHERE id = ? AND product_id = ?`,
    values
  );

  return ApiResponse.success(res, {}, 'Variant updated.');
});

const deleteVariant = asyncHandler(async (req, res) => {
  const { id, variantId } = req.params;

  await pool.query('DELETE FROM product_variants WHERE id = ? AND product_id = ?', [variantId, id]);
  return ApiResponse.success(res, {}, 'Variant deleted.');
});

// ===== AUTHENTICATION =====
const adminLogin = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PANEL_PASSWORD || 'sakshisawant';

  if (!password || password !== adminPassword) {
    return ApiResponse.error(res, 'Invalid admin password.', 401);
  }

  // Find the admin user in the database
  const [users] = await pool.query(
    'SELECT id, name, email, role FROM users WHERE role = ? AND is_active = 1 LIMIT 1',
    ['admin']
  );

  if (users.length === 0) {
    return ApiResponse.error(res, 'No admin user found in database. Please run the seed data.', 404);
  }

  const adminUser = users[0];

  // Generate JWT token with 24h expiry for admin (longer session)
  const accessToken = jwt.sign(
    { id: adminUser.id, email: adminUser.email, role: adminUser.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Also set refresh token as httpOnly cookie for token refresh
  const refreshToken = jwt.sign(
    { id: adminUser.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return ApiResponse.success(res, {
    user: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role
    },
    accessToken
  }, 'Admin login successful.');
});

module.exports = {
  // Auth
  adminLogin,
  // Products
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  // Product Images
  addProductImage, deleteProductImage, setPrimaryImage,
  // Variants
  addVariant, updateVariant, deleteVariant,
  // Categories
  getCategories, createCategory, updateCategory, deleteCategory,
  // Orders
  getOrders, updateOrderStatus,
  // Coupons
  getCoupons, createCoupon, updateCoupon, deleteCoupon,
  // Banners
  createBanner, updateBanner, deleteBanner,
  // Flash Sales
  createFlashSale,
  // Users
  getUsers, updateUserStatus, deleteUser,
  // Orders
  getOrderById,
  // Analytics
  getDashboard, getTopProducts, getCategoryPerformance, getSearchTerms
};
