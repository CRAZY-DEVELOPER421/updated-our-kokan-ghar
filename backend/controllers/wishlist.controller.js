const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getWishlist = asyncHandler(async (req, res) => {
  const [items] = await pool.query(
    `SELECT w.*, p.name, p.slug, p.price, p.mrp, p.discount_percent, p.stock_quantity, p.average_rating, p.review_count,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
     FROM wishlist w
     JOIN products p ON w.product_id = p.id
     WHERE w.user_id = ? AND p.is_active = 1
     ORDER BY w.added_at DESC`,
    [req.user.id]
  );

  return ApiResponse.success(res, { wishlist: items });
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  // price_at_add is stamped at wishlist-time — the price-drop cron compares
  // today's price against this baseline (or the last alert price) to decide
  // whether to fire a "price dropped!" notification + email.
  const [products] = await pool.query('SELECT id, price FROM products WHERE id = ? AND is_active = 1', [productId]);
  if (products.length === 0) {
    return ApiResponse.error(res, 'Product not found.', 404);
  }

  const [existing] = await pool.query(
    'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
    [req.user.id, productId]
  );

  if (existing.length > 0) {
    return ApiResponse.error(res, 'Product already in wishlist.', 400);
  }

  await pool.query(
    'INSERT INTO wishlist (user_id, product_id, price_at_add) VALUES (?, ?, ?)',
    [req.user.id, productId, products[0].price]
  );

  return ApiResponse.created(res, {}, 'Added to wishlist.');
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  await pool.query(
    'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
    [req.user.id, productId]
  );

  return ApiResponse.success(res, {}, 'Removed from wishlist.');
});

const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const [wishlistItems] = await pool.query(
    'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
    [req.user.id, productId]
  );

  if (wishlistItems.length === 0) {
    return ApiResponse.error(res, 'Product not in wishlist.', 404);
  }

  const [products] = await pool.query(
    'SELECT id, stock_quantity FROM products WHERE id = ? AND is_active = 1',
    [productId]
  );

  if (products.length === 0) {
    return ApiResponse.error(res, 'Product not found.', 404);
  }

  if (products[0].stock_quantity < 1) {
    return ApiResponse.error(res, 'Product is out of stock.', 400);
  }

  let [carts] = await pool.query('SELECT id FROM cart WHERE user_id = ?', [req.user.id]);
  if (carts.length === 0) {
    const [result] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [req.user.id]);
    carts = [{ id: result.insertId }];
  }

  const [existingCartItem] = await pool.query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
    [carts[0].id, productId]
  );

  if (existingCartItem.length > 0) {
    await pool.query('UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?', [existingCartItem[0].id]);
  } else {
    await pool.query('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, 1)', [carts[0].id, productId]);
  }

  await pool.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', [req.user.id, productId]);

  return ApiResponse.success(res, {}, 'Moved to cart.');
});

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  moveToCart
};
