const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateUniqueSlug } = require('../utils/generateSlug');
const { createNotification } = require('../services/notification.service');
const { sendEmail, sendOfferEmail, sendSuspensionEmail } = require('../services/email.service');
const { statusOf, reactivateExpiredSuspensions } = require('../services/suspension.service');

// ===== PRODUCT MANAGEMENT =====

// Ensures bundles + bundle_products tables exist (with product_id link to the
// combo product). Safe to call on every create/update — no-op when present.
const columnExists = async (conn, tableName, columnName) => {
  const [rows] = await conn.query(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [tableName, columnName]
  );
  return rows.length > 0;
};

const ensureBundleTables = async (conn) => {
  await conn.query(`CREATE TABLE IF NOT EXISTS bundles (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    product_id INT UNSIGNED,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    description VARCHAR(500),
    bundle_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    valid_from DATETIME,
    valid_until DATETIME,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bundles_active (is_active, valid_until),
    INDEX idx_bundles_sort (sort_order),
    INDEX idx_bundles_product (product_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Self-heal: if the table pre-existed (e.g. from an older seed) without
  // the product_id column, add it so combo saves never fail.
  if (!(await columnExists(conn, 'bundles', 'product_id'))) {
    await conn.query('ALTER TABLE bundles ADD COLUMN product_id INT UNSIGNED NULL AFTER id, ADD INDEX idx_bundles_product (product_id)');
  }

  await conn.query(`CREATE TABLE IF NOT EXISTS bundle_products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    bundle_id INT UNSIGNED NOT NULL,
    product_id INT UNSIGNED NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    UNIQUE KEY uk_bundle_product (bundle_id, product_id),
    FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_bp_product (product_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
};

// Self-heal: add timed-suspension support to the users table if it predates
// the feature (mirrors ensureDeliveryColumns). suspend_until NULL + is_active=0
// means a PERMANENT suspension; a future DATETIME means a timed suspension.
const ensureUserSuspendColumn = async (conn) => {
  if (!(await columnExists(conn, 'users', 'suspend_until'))) {
    await conn.query('ALTER TABLE users ADD COLUMN suspend_until DATETIME NULL AFTER is_active, ADD INDEX idx_users_suspend (is_active, suspend_until)');
  }
};

// Self-heal: add per-product delivery fields (free_delivery + delivery_estimate)
// if the products table predates them. Mirrors the ensureBundleTables pattern.
const ensureDeliveryColumns = async (conn) => {
  if (!(await columnExists(conn, 'products', 'free_delivery'))) {
    await conn.query("ALTER TABLE products ADD COLUMN free_delivery TINYINT(1) NOT NULL DEFAULT 1 AFTER unit");
  }
  if (!(await columnExists(conn, 'products', 'delivery_estimate'))) {
    await conn.query("ALTER TABLE products ADD COLUMN delivery_estimate VARCHAR(50) NOT NULL DEFAULT '3-5 days' AFTER free_delivery");
  }
};

// Saves bundle members (bundle_products) for a bundle, replacing any existing ones
const syncBundleProducts = async (conn, bundleId, items) => {
  await conn.query('DELETE FROM bundle_products WHERE bundle_id = ?', [bundleId]);
  if (Array.isArray(items)) {
    for (const item of items) {
      if (!item || !item.product_id) continue;
      await conn.query(
        'INSERT INTO bundle_products (bundle_id, product_id, quantity) VALUES (?, ?, ?)',
        [bundleId, item.product_id, item.quantity || 1]
      );
    }
  }
};

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

  // Guard the is_bundle flag: only reference the bundles table if the combo
  // schema (product_id column) is present, otherwise the whole products list
  // would fail on databases that only have the legacy bundles table.
  const hasBundleProductCol = await columnExists(pool, 'bundles', 'product_id');
  const bundleFlag = hasBundleProductCol
    ? 'EXISTS(SELECT 1 FROM bundles b WHERE b.product_id = p.id) as is_bundle,'
    : '0 as is_bundle,';

  // Build main query
  let mainQuery = `
    SELECT p.*,
      c.name as category_name,
      ${bundleFlag}
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ${whereClause}
  `;

  if (imageStatus === 'uploaded') {
    mainQuery = `
      SELECT p.*,
        c.name as category_name,
        ${bundleFlag}
        (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id) ${whereClause.replace('WHERE 1=1', '')}
    `;
  } else if (imageStatus === 'pending') {
    mainQuery = `
      SELECT p.*,
        c.name as category_name,
        ${bundleFlag}
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
  const { name, description, short_description, price, mrp, stock_quantity, sku, category_id, brand, weight_grams, unit, is_featured, is_bestseller, is_seasonal, is_organic, region_origin, shelf_life_days, ingredients, nutritional_info, storage_instructions, is_active, free_delivery, delivery_estimate, product_type, bundle_products, bundle_valid_from, bundle_valid_until } = req.body;

  const slug = await generateUniqueSlug(name, 'products', pool);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await ensureDeliveryColumns(conn);

    const [result] = await conn.query(
      `INSERT INTO products (name, slug, description, short_description, price, mrp, stock_quantity, sku, category_id, brand, weight_grams, unit, is_featured, is_bestseller, is_seasonal, is_organic, region_origin, shelf_life_days, ingredients, nutritional_info, storage_instructions, is_active, free_delivery, delivery_estimate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, slug, description, short_description, price, mrp, stock_quantity, sku, category_id, brand, weight_grams, unit, is_featured || 0, is_bestseller || 0, is_seasonal || 0, is_organic || 0, region_origin, shelf_life_days, ingredients, nutritional_info ? JSON.stringify(nutritional_info) : null, storage_instructions, is_active !== undefined ? is_active : 1, free_delivery !== undefined ? free_delivery : 1, delivery_estimate || '3-5 days']
    );

    // Combo/bundle: create a linked bundle record + member mapping
    if (product_type === 'combo') {
      await ensureBundleTables(conn);
      const bundleSlug = await generateUniqueSlug(name, 'bundles', conn);
      const [bundleResult] = await conn.query(
        `INSERT INTO bundles (product_id, name, slug, description, bundle_price, original_price, is_active, valid_from, valid_until, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [result.insertId, name, bundleSlug, short_description || description || null, price, mrp, is_active !== undefined ? is_active : 1, bundle_valid_from || null, bundle_valid_until || null]
      );
      await syncBundleProducts(conn, bundleResult.insertId, bundle_products);
    }

    await conn.commit();
    return ApiResponse.created(res, { id: result.insertId, slug }, 'Product created.');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id' && key !== 'slug' && key !== 'product_type' && key !== 'bundle_products' && key !== 'bundle_valid_from' && key !== 'bundle_valid_until') {
      if (key === 'nutritional_info') {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
  }

  if (fields.length === 0 && updates.product_type !== 'combo') {
    return ApiResponse.error(res, 'No fields to update.', 400);
  }

  values.push(id);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await ensureDeliveryColumns(conn);

    if (fields.length > 0) {
      await conn.query(
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Combo/bundle sync: create-or-update linked bundle + refresh members
    if (updates.product_type === 'combo') {
      await ensureBundleTables(conn);
      const [existing] = await conn.query(
        'SELECT id FROM bundles WHERE product_id = ?',
        [id]
      );
      const bundleName = updates.name || updates.bundle_name || 'Combo Pack';
      if (existing.length > 0) {
        const bundleId = existing[0].id;
        await conn.query(
          `UPDATE bundles SET name = ?, description = ?, bundle_price = ?, original_price = ?, is_active = ?, valid_from = ?, valid_until = ? WHERE id = ?`,
          [bundleName, updates.short_description || updates.description || null, updates.price || 0, updates.mrp || 0, updates.is_active !== undefined ? updates.is_active : 1, updates.bundle_valid_from || null, updates.bundle_valid_until || null, bundleId]
        );
        await syncBundleProducts(conn, bundleId, updates.bundle_products);
      } else {
        const bundleSlug = await generateUniqueSlug(bundleName, 'bundles', conn);
        const [bundleResult] = await conn.query(
          `INSERT INTO bundles (product_id, name, slug, description, bundle_price, original_price, is_active, valid_from, valid_until, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [id, bundleName, bundleSlug, updates.short_description || updates.description || null, updates.price || 0, updates.mrp || 0, updates.is_active !== undefined ? updates.is_active : 1, updates.bundle_valid_from || null, updates.bundle_valid_until || null]
        );
        await syncBundleProducts(conn, bundleResult.insertId, updates.bundle_products);
      }
    } else if (updates.product_type === 'single' && (await columnExists(conn, 'bundles', 'product_id'))) {
      // Combo → Single: remove the linked bundle so it stops appearing on the Offers page
      const [existing] = await conn.query('SELECT id FROM bundles WHERE product_id = ? LIMIT 1', [id]);
      if (existing.length > 0) {
        await conn.query('DELETE FROM bundles WHERE product_id = ?', [id]);
      }
    }

    await conn.commit();
    return ApiResponse.success(res, {}, 'Product updated.');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Remove linked bundle (bundle_products cascade via FK) if this was a combo
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (await columnExists(conn, 'bundles', 'product_id')) {
      await conn.query('DELETE FROM bundles WHERE product_id = ?', [id]);
    }
    await conn.query('DELETE FROM products WHERE id = ?', [id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

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

  // Attach bundle data if this product is a combo pack
  // (guarded so a DB without the combo schema never breaks the edit page)
  let bundles = [];
  if (await columnExists(pool, 'bundles', 'product_id')) {
    [bundles] = await pool.query(
      'SELECT * FROM bundles WHERE product_id = ?',
      [id]
    );
  }
  if (bundles.length > 0) {
    const bundle = bundles[0];
    const [bundleProducts] = await pool.query(
      `SELECT bp.product_id, bp.quantity,
              p.name, p.slug, p.price, p.mrp,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM bundle_products bp
       JOIN products p ON bp.product_id = p.id
       WHERE bp.bundle_id = ?
       ORDER BY bp.id ASC`,
      [bundle.id]
    );
    bundle.products = bundleProducts;
    product.bundle = bundle;
  } else {
    product.bundle = null;
  }

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
        `Order #${order_number} delivered!`,
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

// Fire-and-forget: email every active user about a published or edited offer.
// The API responds immediately — emails go out in the background.
const notifyAllUsersOfOffer = (offer) => {
  pool
    .query('SELECT name, email FROM users WHERE is_active = 1 AND email IS NOT NULL AND email <> ?', [''])
    .then(([users]) => {
      if (!users.length) return;
      const { subject, html } = sendOfferEmail(offer);
      // Send in chunks (max 25 in flight) so a large user base never hammers
      // the SMTP server with thousands of simultaneous connections.
      const CHUNK = 25;
      let index = 0;
      const sendChunk = () => {
        const batch = users.slice(index, index + CHUNK);
        index += CHUNK;
        if (batch.length === 0) return;
        Promise.allSettled(batch.map((u) => sendEmail({ to: u.email, subject, html }))).then(sendChunk);
      };
      sendChunk();
      console.log(`[Offers] Promotional email queued for ${users.length} user(s).`);
    })
    .catch((err) => console.error('[Offers] Broadcast failed:', err.message));
};

const getCoupons = asyncHandler(async (req, res) => {
  const [coupons] = await pool.query(
    'SELECT * FROM coupons ORDER BY created_at DESC'
  );

  return ApiResponse.success(res, { coupons });
});

const createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, min_order_amount, max_discount, usage_limit, is_active, valid_from, valid_until, description } = req.body;

  const active = is_active !== undefined ? is_active : 1;

  const [result] = await pool.query(
    'INSERT INTO coupons (code, type, value, min_order_amount, max_discount, usage_limit, is_active, valid_from, valid_until, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [code.toUpperCase(), type, value, min_order_amount || 0, max_discount, usage_limit || 0, active, valid_from, valid_until, description]
  );

  // New published offer → email it to every active user (fire-and-forget).
  if (Number(active) !== 0) {
    notifyAllUsersOfOffer({
      code: code.toUpperCase(),
      type,
      value,
      min_order_amount,
      max_discount,
      valid_until,
      description
    });
  }

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

  // Edited / re-activated offer → email it to every active user (fire-and-forget).
  // Only broadcast when the coupon ends up active, so deactivating an offer or
  // tweaking an inactive draft never spams the user base.
  const [rows] = await pool.query('SELECT * FROM coupons WHERE id = ?', [id]);
  const coupon = rows[0];
  if (coupon && Number(coupon.is_active) !== 0) {
    notifyAllUsersOfOffer({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      min_order_amount: coupon.min_order_amount,
      max_discount: coupon.max_discount,
      valid_until: coupon.valid_until,
      description: coupon.description
    });
  }

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
const getFlashSales = asyncHandler(async (req, res) => {
  const [flashSales] = await pool.query(
    `SELECT fs.*, p.name as product_name, p.slug as product_slug, p.price as product_price,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as product_image
     FROM flash_sales fs
     JOIN products p ON p.id = fs.product_id
     ORDER BY fs.is_active DESC, fs.starts_at DESC`
  );

  return ApiResponse.success(res, { flashSales });
});

const createFlashSale = asyncHandler(async (req, res) => {
  const { product_id, sale_price, original_price, quantity_limit, starts_at, ends_at } = req.body;

  const [result] = await pool.query(
    'INSERT INTO flash_sales (product_id, sale_price, original_price, quantity_limit, starts_at, ends_at, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)',
    [product_id, sale_price, original_price, quantity_limit, starts_at, ends_at]
  );

  return ApiResponse.created(res, { id: result.insertId }, 'Flash sale created.');
});

const updateFlashSale = asyncHandler(async (req, res) => {
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
  await pool.query(`UPDATE flash_sales SET ${fields.join(', ')} WHERE id = ?`, values);

  return ApiResponse.success(res, {}, 'Flash sale updated.');
});

const deleteFlashSale = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM flash_sales WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Flash sale deleted.');
});

// ===== BANK OFFER MANAGEMENT =====
const getBankOffers = asyncHandler(async (req, res) => {
  const [bankOffers] = await pool.query(
    'SELECT * FROM bank_offers ORDER BY sort_order ASC, id DESC'
  );

  return ApiResponse.success(res, { bankOffers });
});

const createBankOffer = asyncHandler(async (req, res) => {
  const { bank_name, bank_code, logo_url, offer_title, offer_description, discount_type, min_order_amount, max_discount, is_active, valid_from, valid_until, terms_url, sort_order } = req.body;

  if (!bank_name || !offer_title) {
    return ApiResponse.error(res, 'Bank name and offer title are required.', 400);
  }

  const [result] = await pool.query(
    `INSERT INTO bank_offers (bank_name, bank_code, logo_url, offer_title, offer_description, discount_type, min_order_amount, max_discount, is_active, valid_from, valid_until, terms_url, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [bank_name, bank_code || null, logo_url || null, offer_title, offer_description || null, discount_type || 'credit_card', min_order_amount || 0, max_discount, is_active !== undefined ? is_active : 1, valid_from || null, valid_until || null, terms_url || null, sort_order || 0]
  );

  return ApiResponse.created(res, { id: result.insertId }, 'Bank offer created.');
});

const updateBankOffer = asyncHandler(async (req, res) => {
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
  await pool.query(`UPDATE bank_offers SET ${fields.join(', ')} WHERE id = ?`, values);

  return ApiResponse.success(res, {}, 'Bank offer updated.');
});

const deleteBankOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM bank_offers WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Bank offer deleted.');
});

// ===== BUNDLE MANAGEMENT =====
const getBundles = asyncHandler(async (req, res) => {
  const [bundles] = await pool.query(
    `SELECT b.*,
            p.name as linked_product_name,
            p.slug as linked_product_slug,
            ROUND(((b.original_price - b.bundle_price) / NULLIF(b.original_price, 0)) * 100) AS savings_percent,
            (SELECT COUNT(*) FROM bundle_products bp WHERE bp.bundle_id = b.id) AS product_count
     FROM bundles b
     LEFT JOIN products p ON p.id = b.product_id
     ORDER BY b.sort_order ASC, b.id DESC`
  );

  // Attach each bundle's member products (name, slug, price, qty, primary image)
  for (const bundle of bundles) {
    const [products] = await pool.query(
      `SELECT bp.product_id, bp.quantity,
              p.name, p.slug, p.price, p.mrp,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
       FROM bundle_products bp
       JOIN products p ON bp.product_id = p.id
       WHERE bp.bundle_id = ?
       ORDER BY bp.id ASC`,
      [bundle.id]
    );
    bundle.products = products;
  }

  return ApiResponse.success(res, { bundles });
});

const getBundleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [bundles] = await pool.query(
    `SELECT b.*, p.name as linked_product_name, p.slug as linked_product_slug,
            ROUND(((b.original_price - b.bundle_price) / NULLIF(b.original_price, 0)) * 100) AS savings_percent
     FROM bundles b
     LEFT JOIN products p ON p.id = b.product_id
     WHERE b.id = ?`,
    [id]
  );

  if (bundles.length === 0) {
    return ApiResponse.error(res, 'Bundle not found.', 404);
  }

  const bundle = bundles[0];

  const [products] = await pool.query(
    `SELECT bp.product_id, bp.quantity,
            p.name, p.slug, p.price, p.mrp,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
     FROM bundle_products bp
     JOIN products p ON bp.product_id = p.id
     WHERE bp.bundle_id = ?
     ORDER BY bp.id ASC`,
    [id]
  );
  bundle.products = products;

  return ApiResponse.success(res, { bundle });
});

const createBundle = asyncHandler(async (req, res) => {
  const { name, description, bundle_price, original_price, is_active, valid_from, valid_until, sort_order, product_id, bundle_products } = req.body;

  if (!name || !bundle_price || !original_price) {
    return ApiResponse.error(res, 'Name, bundle price and original price are required.', 400);
  }
  if (!Array.isArray(bundle_products) || bundle_products.length === 0) {
    return ApiResponse.error(res, 'Select at least one product for this bundle.', 400);
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await ensureBundleTables(conn);

    const bundleSlug = await generateUniqueSlug(name, 'bundles', conn);
    const [result] = await conn.query(
      `INSERT INTO bundles (product_id, name, slug, description, bundle_price, original_price, is_active, valid_from, valid_until, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_id || null, name, bundleSlug, description || null, bundle_price, original_price, is_active !== undefined ? is_active : 1, valid_from || null, valid_until || null, sort_order || 0]
    );

    await syncBundleProducts(conn, result.insertId, bundle_products);

    await conn.commit();
    return ApiResponse.created(res, { id: result.insertId, slug: bundleSlug }, 'Bundle created.');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

const updateBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id' && key !== 'slug' && key !== 'bundle_products') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    if (fields.length > 0) {
      values.push(id);
      await conn.query(
        `UPDATE bundles SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
    }

    if (Array.isArray(updates.bundle_products)) {
      await syncBundleProducts(conn, id, updates.bundle_products);
    }

    // Keep the linked combo product in sync so the storefront product grid,
    // detail page, and the bundle deal always show the same values.
    const [bundleRows] = await conn.query('SELECT product_id, name, description, bundle_price, original_price, is_active FROM bundles WHERE id = ?', [id]);
    if (bundleRows.length > 0 && bundleRows[0].product_id) {
      const b = bundleRows[0];
      await conn.query(
        'UPDATE products SET name = ?, short_description = ?, price = ?, mrp = ?, is_active = ? WHERE id = ?',
        [b.name, b.description || null, b.bundle_price, b.original_price, b.is_active ? 1 : 0, b.product_id]
      );
    }

    await conn.commit();
    return ApiResponse.success(res, {}, 'Bundle updated.');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

const deleteBundle = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Grab linked product id before deleting so we can decide what to clean up
    const [bundles] = await conn.query('SELECT product_id FROM bundles WHERE id = ?', [id]);
    const productId = bundles.length > 0 ? bundles[0].product_id : null;

    await conn.query('DELETE FROM bundles WHERE id = ?', [id]);

    // If this bundle was created from a combo product, remove the linked product
    // too — unless it is also a member of another bundle (avoid cascade-removing
    // it from that bundle's members via the bundle_products FK).
    if (productId) {
      const [usedElsewhere] = await conn.query(
        'SELECT COUNT(*) AS c FROM bundle_products WHERE product_id = ?',
        [productId]
      );
      if (!usedElsewhere[0].c) {
        await conn.query('DELETE FROM products WHERE id = ?', [productId]);
      }
    }

    await conn.commit();
    return ApiResponse.success(res, {}, 'Bundle deleted.');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// ===== USER MANAGEMENT =====

/**
 * Suspend / activate a user.
 *
 * Body (JSON):
 *   { action: 'activate' }                        -> is_active = 1, clear timer
 *   { action: 'suspend' }                         -> PERMANENT suspension
 *   { action: 'suspend', duration_days: 3 }       -> timed: is_active = 0, suspend_until = now + 3 days
 *
 * Backwards compatible with the old { is_active: 0|1 } payload too.
 * A suspended user gets an email + in-app notification automatically.
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, duration_days, is_active } = req.body;

  await ensureUserSuspendColumn(pool);

  const [users] = await pool.query(
    'SELECT id, name, email, role, is_active, suspend_until FROM users WHERE id = ?',
    [id]
  );
  if (users.length === 0) {
    return ApiResponse.error(res, 'User not found.', 404);
  }
  const user = users[0];

  // Never allow suspending your own account (an admin would lock themselves
  // out and could never undo it) or another admin account. Mirrors deleteUser.
  const activating = action === 'activate' || Number(is_active) === 1;
  const suspending = action === 'suspend' || Number(is_active) === 0;
  if (suspending) {
    if (parseInt(id, 10) === req.user.id) {
      return ApiResponse.error(res, 'Cannot suspend your own account.', 400);
    }
    if (user.role === 'admin') {
      return ApiResponse.error(res, 'Admin accounts cannot be suspended.', 400);
    }
  }

  if (activating) {
    await pool.query(
      'UPDATE users SET is_active = 1, suspend_until = NULL WHERE id = ?',
      [id]
    );
    return ApiResponse.success(res, { user: { ...user, is_active: 1, suspend_until: null } }, 'User activated.');
  }

  if (suspending) {
    // duration_days > 0 -> timed suspension; otherwise permanent.
    const days = parseInt(duration_days, 10);
    const suspend_until = days > 0
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000)
      : null;

    await pool.query(
      'UPDATE users SET is_active = 0, suspend_until = ? WHERE id = ?',
      [suspend_until, id]
    );

    // In-app notification + email — both fire-and-forget so a slow SMTP or a
    // notification hiccup never blocks the admin action or makes it look like
    // it failed after the DB row was already updated.
    const notify = async () => {
      try {
        await createNotification(
          id,
          'account_suspended',
          suspend_until ? 'Account temporarily suspended' : 'Account permanently suspended',
          suspend_until
            ? `Your account has been suspended until ${suspend_until.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`
            : 'Your account has been permanently suspended. Please contact support if you believe this is a mistake.',
          { suspend_until }
        );
      } catch (err) {
        console.error('[Suspend] Notification failed:', err.message);
      }
      if (user.email) {
        const mail = sendSuspensionEmail(user.email, user.name, {
          permanent: !suspend_until,
          until: suspend_until,
        });
        sendEmail({ to: user.email, subject: mail.subject, html: mail.html });
      }
    };
    notify();

    return ApiResponse.success(res, {
      user: { ...user, is_active: 0, suspend_until: suspend_until ? suspend_until.toISOString() : null }
    }, suspend_until
      ? `User suspended for ${days} day${days === 1 ? '' : 's'}.`
      : 'User permanently suspended.');
  }

  return ApiResponse.error(res, 'Invalid action. Use "suspend", "activate" or legacy is_active.', 400);
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

  await ensureUserSuspendColumn(pool);

  // Self-heal: any timed suspension that already expired is flipped back to
  // active IN THE DATABASE right here, so the admin list/stats always agree
  // with reality (no waiting for the user to log in). Same rule as the
  // server-side background sweep and resolveUserStatus.
  await reactivateExpiredSuspensions();

  const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');
  const [users] = await pool.query(
    `SELECT id, name, email, phone, role, is_verified, is_active, suspend_until, last_login, created_at
     FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const usersWithStatus = users.map((u) => ({
    ...u,
    suspend_until: u.suspend_until ? new Date(u.suspend_until).toISOString() : null,
    status: statusOf(u),
  }));

  // Live user stats for the admin Users page (last_login is updated on every login)
  const [statsRows] = await pool.query(
    `SELECT
       COUNT(*) AS total,
       SUM(is_active = 1 OR (is_active = 0 AND suspend_until <= NOW())) AS active,
       SUM(is_active = 0 AND suspend_until IS NULL) AS permanent_suspended,
       SUM(is_active = 0 AND suspend_until IS NOT NULL AND suspend_until > NOW()) AS timed_suspended,
       SUM(role = 'admin') AS admins,
       SUM(role = 'seller') AS sellers,
       SUM(role = 'customer') AS customers,
       SUM(last_login >= NOW() - INTERVAL 24 HOUR) AS logged_in_24h,
       SUM(last_login >= NOW() - INTERVAL 7 DAY) AS logged_in_7d
     FROM users`
  );
  const s = statsRows[0] || {};
  const stats = {
    total: Number(s.total) || 0,
    active: Number(s.active) || 0,
    suspended: (Number(s.permanent_suspended) || 0) + (Number(s.timed_suspended) || 0),
    permanent_suspended: Number(s.permanent_suspended) || 0,
    timed_suspended: Number(s.timed_suspended) || 0,
    admins: Number(s.admins) || 0,
    sellers: Number(s.sellers) || 0,
    customers: Number(s.customers) || 0,
    logged_in_24h: Number(s.logged_in_24h) || 0,
    logged_in_7d: Number(s.logged_in_7d) || 0,
  };

  return ApiResponse.paginated(res, { users: usersWithStatus, stats }, {
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
  const adminPassword = process.env.ADMIN_PANEL_PASSWORD;

  // Fail closed: require an explicit password in the environment. Never fall
  // back to a hardcoded default — that would ship a known password to anyone
  // who reads the source.
  if (!adminPassword) {
    return ApiResponse.error(res, 'Admin panel password is not configured. Set ADMIN_PANEL_PASSWORD in the environment.', 500);
  }

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
  getFlashSales, createFlashSale, updateFlashSale, deleteFlashSale,
  // Bank Offers
  getBankOffers, createBankOffer, updateBankOffer, deleteBankOffer,
  // Bundles
  getBundles, getBundleById, createBundle, updateBundle, deleteBundle,
  // Users
  getUsers, updateUserStatus, deleteUser,
  // Orders
  getOrderById,
  // Analytics
  getDashboard, getTopProducts, getCategoryPerformance, getSearchTerms
};
