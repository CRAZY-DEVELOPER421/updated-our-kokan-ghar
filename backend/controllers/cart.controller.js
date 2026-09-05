const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const couponService = require('../services/coupon.service');
const { computeSlabDiscount } = require('../services/slabDiscount.service');

// A cart belongs to either a user (user_id) or a guest device (guest_id).
const getOrCreateCart = async (userId, guestId) => {
  if (userId) {
    let [carts] = await pool.query('SELECT * FROM cart WHERE user_id = ?', [userId]);
    if (carts.length === 0) {
      const [result] = await pool.query('INSERT INTO cart (user_id) VALUES (?)', [userId]);
      carts = [{ id: result.insertId, user_id: userId, guest_id: null, coupon_code: null, coupon_discount: 0 }];
    }
    return carts[0];
  }

  let [carts] = await pool.query('SELECT * FROM cart WHERE guest_id = ?', [guestId]);
  if (carts.length === 0) {
    const [result] = await pool.query('INSERT INTO cart (guest_id) VALUES (?)', [guestId]);
    carts = [{ id: result.insertId, user_id: null, guest_id: guestId, coupon_code: null, coupon_discount: 0 }];
  }
  return carts[0];
};

// Resolve which cart the request operates on. Logged-in users always win
// (their cart) even when a stale guest id is also present.
const resolveCart = async (req) => {
  if (req.user && req.user.id) {
    return { cart: await getOrCreateCart(req.user.id, null), owner: { userId: req.user.id } };
  }
  return { cart: await getOrCreateCart(null, req.guestId), owner: { guestId: req.guestId } };
};

const getCart = asyncHandler(async (req, res) => {
  const { cart } = await resolveCart(req);

  const [items] = await pool.query(
    `SELECT ci.*, p.name, p.slug, p.price, p.mrp, p.stock_quantity, p.weight_grams, p.unit,
      pv.variant_name, pv.variant_value,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
     FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     LEFT JOIN product_variants pv ON ci.variant_id = pv.id
     WHERE ci.cart_id = ?`,
    [cart.id]
  );

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalMrp = items.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
  const totalDiscount = totalMrp - subtotal;
  const shippingCharge = subtotal >= 499 ? 0 : 49;
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const couponDiscount = cart.coupon_discount || 0;
  // Buy More, Save More slab — same calculation as order creation
  // (backend/services/slabDiscount.service.js) so the cart total is ALWAYS
  // the amount that will be charged at checkout.
  const { percent: slabPercent, discount: slabDiscount } = computeSlabDiscount(subtotal, couponDiscount);
  const finalTotal = Math.max(subtotal - couponDiscount - slabDiscount, 0) + shippingCharge + taxAmount;

  const freeShippingRemaining = subtotal >= 499 ? 0 : 499 - subtotal;

  return ApiResponse.success(res, {
    cart: {
      id: cart.id,
      coupon_code: cart.coupon_code,
      coupon_discount: cart.coupon_discount || 0
    },
    items,
    summary: {
      subtotal: Math.round(subtotal * 100) / 100,
      total_mrp: Math.round(totalMrp * 100) / 100,
      total_discount: Math.round(totalDiscount * 100) / 100,
      coupon_discount: couponDiscount,
      slab_discount: slabDiscount,
      slab_percent: slabPercent,
      shipping_charge: shippingCharge,
      free_shipping_remaining: freeShippingRemaining,
      tax_amount: taxAmount,
      total: Math.round(finalTotal * 100) / 100,
      item_count: items.reduce((sum, item) => sum + item.quantity, 0)
    }
  });
});

const addToCart = asyncHandler(async (req, res) => {
  const { product_id, variant_id, quantity } = req.body;
  const qty = quantity || 1;

  const [products] = await pool.query(
    'SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND is_active = 1',
    [product_id]
  );

  if (products.length === 0) {
    return ApiResponse.error(res, 'Product not found.', 404);
  }

  if (products[0].stock_quantity < qty) {
    return ApiResponse.error(res, `Only ${products[0].stock_quantity} items in stock.`, 400);
  }

  const { cart } = await resolveCart(req);

  let [existing] = await pool.query(
    'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
    [cart.id, product_id, variant_id || null, variant_id || null]
  );

  if (existing.length > 0) {
    const newQty = existing[0].quantity + qty;
    if (newQty > products[0].stock_quantity) {
      return ApiResponse.error(res, `Only ${products[0].stock_quantity} items available.`, 400);
    }
    await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
  } else {
    await pool.query(
      'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
      [cart.id, product_id, variant_id || null, qty]
    );
  }

  return ApiResponse.success(res, {}, 'Item added to cart.');
});

const updateCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  const { cart } = await resolveCart(req);

  const [items] = await pool.query(
    `SELECT ci.*, p.stock_quantity FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.id = ? AND ci.cart_id = ?`,
    [id, cart.id]
  );

  if (items.length === 0) {
    return ApiResponse.error(res, 'Cart item not found.', 404);
  }

  if (quantity > items[0].stock_quantity) {
    return ApiResponse.error(res, `Only ${items[0].stock_quantity} items available.`, 400);
  }

  if (quantity <= 0) {
    await pool.query('DELETE FROM cart_items WHERE id = ?', [id]);
    return ApiResponse.success(res, {}, 'Item removed from cart.');
  }

  await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);

  return ApiResponse.success(res, {}, 'Cart updated.');
});

const removeCartItem = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { cart } = await resolveCart(req);

  await pool.query(
    'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
    [id, cart.id]
  );

  return ApiResponse.success(res, {}, 'Item removed from cart.');
});

const clearCart = asyncHandler(async (req, res) => {
  const { cart } = await resolveCart(req);

  await pool.query('DELETE FROM cart_items WHERE cart_id = ?', [cart.id]);
  await pool.query('UPDATE cart SET coupon_code = NULL, coupon_discount = 0 WHERE id = ?', [cart.id]);

  return ApiResponse.success(res, {}, 'Cart cleared.');
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = req.body;
  const { cart, owner } = await resolveCart(req);
  const userId = owner.userId || null;

  const [items] = await pool.query(
    `SELECT ci.*, p.price FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [cart.id]
  );

  if (items.length === 0) {
    return ApiResponse.error(res, 'Cart is empty.', 400);
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = items.map(item => ({ product_id: item.product_id, quantity: item.quantity, price: item.price }));

  const result = await couponService.applyCoupon(code, userId, subtotal, cartItems);

  if (!result.success) {
    return ApiResponse.error(res, result.message, 400);
  }

  await pool.query(
    'UPDATE cart SET coupon_code = ?, coupon_discount = ? WHERE id = ?',
    [result.couponCode, result.discountAmount, cart.id]
  );

  return ApiResponse.success(res, { coupon_code: result.couponCode, discount: result.discountAmount }, result.message);
});

const suggestCoupons = asyncHandler(async (req, res) => {
  const { cart, owner } = await resolveCart(req);
  const userId = owner.userId || null;

  const [items] = await pool.query(
    `SELECT ci.*, p.price FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [cart.id]
  );

  if (items.length === 0) {
    return ApiResponse.success(res, { coupons: [] });
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItems = items.map(item => ({ product_id: item.product_id, quantity: item.quantity, price: item.price }));

  const coupons = await couponService.suggestCoupons(subtotal, cartItems, userId);

  return ApiResponse.success(res, {
    coupons,
    subtotal
  });
});

const removeCoupon = asyncHandler(async (req, res) => {
  const { cart } = await resolveCart(req);

  await pool.query(
    'UPDATE cart SET coupon_code = NULL, coupon_discount = 0 WHERE id = ?',
    [cart.id]
  );

  return ApiResponse.success(res, {}, 'Coupon removed.');
});

/**
 * Merge the caller's guest cart into their logged-in cart.
 * Called right after login/signup — items are combined (same product+variant
 * quantities add up, capped at stock), the coupon is kept if the user cart
 * has none, and the guest cart row is deleted.
 * Auth: JWT required (guests cannot merge).
 */
const mergeGuestCart = asyncHandler(async (req, res) => {
  const guestId = req.headers['x-guest-id'];
  if (!guestId || typeof guestId !== 'string') {
    return ApiResponse.success(res, { merged: 0 }, 'No guest cart to merge.');
  }

  const [guestCarts] = await pool.query('SELECT * FROM cart WHERE guest_id = ?', [guestId]);
  if (guestCarts.length === 0) {
    return ApiResponse.success(res, { merged: 0 }, 'No guest cart to merge.');
  }

  const guestCart = guestCarts[0];
  const userCart = await getOrCreateCart(req.user.id, null);

  const [guestItems] = await pool.query(
    `SELECT ci.*, p.stock_quantity FROM cart_items ci
     JOIN products p ON ci.product_id = p.id
     WHERE ci.cart_id = ?`,
    [guestCart.id]
  );

  let merged = 0;
  for (const item of guestItems) {
    let [existing] = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND (variant_id = ? OR (variant_id IS NULL AND ? IS NULL))',
      [userCart.id, item.product_id, item.variant_id || null, item.variant_id || null]
    );

    if (existing.length > 0) {
      const stock = item.stock_quantity;
      const newQty = Math.min(existing[0].quantity + item.quantity, stock);
      await pool.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
    } else {
      const qty = Math.min(item.quantity, item.stock_quantity);
      await pool.query(
        'INSERT INTO cart_items (cart_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
        [userCart.id, item.product_id, item.variant_id || null, qty]
      );
    }
    merged++;
  }

  // Carry the guest coupon over only if the user cart has none applied.
  if (guestCart.coupon_code && !userCart.coupon_code) {
    await pool.query(
      'UPDATE cart SET coupon_code = ?, coupon_discount = ? WHERE id = ?',
      [guestCart.coupon_code, guestCart.coupon_discount || 0, userCart.id]
    );
  }

  await pool.query('DELETE FROM cart WHERE id = ?', [guestCart.id]);

  return ApiResponse.success(res, { merged }, merged > 0 ? `${merged} item(s) moved to your cart.` : 'Nothing to merge.');
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  suggestCoupons,
  mergeGuestCart
};
