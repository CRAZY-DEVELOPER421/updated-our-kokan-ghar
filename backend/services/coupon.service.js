const pool = require('../config/db');

// applicable_categories / applicable_products are native MySQL JSON columns —
// the driver already parses them into JS values. Handle both raw-array and
// stringified forms safely.
const parseRestriction = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const validateCoupon = async (code, userId, cartTotal, cartItems) => {
  try {
    const [coupons] = await pool.query(
      `SELECT * FROM coupons 
       WHERE code = ? AND is_active = 1 
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND valid_until >= NOW()`,
      [code.toUpperCase()]
    );

    if (coupons.length === 0) {
      return { valid: false, message: 'Invalid or expired coupon code.' };
    }

    const coupon = coupons[0];

    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, message: 'Coupon usage limit reached.' };
    }

    if (cartTotal < coupon.min_order_amount) {
      return { valid: false, message: `Minimum order amount of ₹${coupon.min_order_amount} required.` };
    }

    if (userId) {
      const [usage] = await pool.query(
        'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
        [coupon.id, userId]
      );
    }

    const applicableProducts = parseRestriction(coupon.applicable_products);
    if (applicableProducts.length > 0) {
      const hasApplicableProduct = cartItems.some(item =>
        applicableProducts.includes(item.product_id)
      );
      if (!hasApplicableProduct) {
        return { valid: false, message: 'Coupon not applicable to items in cart.' };
      }
    }

    const applicableCategories = parseRestriction(coupon.applicable_categories);
    if (applicableCategories.length > 0) {
      const productIds = cartItems.map(item => item.product_id);
      if (productIds.length > 0) {
        const [products] = await pool.query(
          `SELECT DISTINCT category_id FROM products WHERE id IN (?)`,
          [productIds]
        );
        const hasApplicableCategory = products.some(p =>
          applicableCategories.includes(p.category_id)
        );
        if (!hasApplicableCategory) {
          return { valid: false, message: 'Coupon not applicable to items in cart.' };
        }
      }
    }

    return { valid: true, coupon };
  } catch (error) {
    console.error('Coupon validation error:', error.message);
    return { valid: false, message: 'Error validating coupon.' };
  }
};

const calculateDiscount = (coupon, cartTotal) => {
  let discountAmount = 0;

  switch (coupon.type) {
    case 'percentage':
      discountAmount = (cartTotal * coupon.value) / 100;
      if (coupon.max_discount && discountAmount > coupon.max_discount) {
        discountAmount = coupon.max_discount;
      }
      break;

    case 'flat':
      discountAmount = coupon.value;
      break;

    case 'free_shipping':
      discountAmount = 0;
      break;

    case 'bogo':
      discountAmount = 0;
      break;

    default:
      discountAmount = 0;
  }

  return Math.round(discountAmount * 100) / 100;
};

const applyCoupon = async (code, userId, cartTotal, cartItems) => {
  const validation = await validateCoupon(code, userId, cartTotal, cartItems);

  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const discountAmount = calculateDiscount(validation.coupon, cartTotal);

  return {
    success: true,
    discountAmount,
    couponCode: validation.coupon.code,
    couponId: validation.coupon.id,
    couponType: validation.coupon.type,
    message: `Coupon ${validation.coupon.code} applied! You saved ₹${discountAmount}`
  };
};

const getApplicableCoupons = async (cartTotal, categoryIds) => {
  try {
    let query = `SELECT * FROM coupons WHERE is_active = 1 AND (valid_from IS NULL OR valid_from <= NOW()) AND valid_until >= NOW()`;
    const params = [];

    const [coupons] = await pool.query(query, params);

    const applicable = coupons.filter(coupon => {
      if (coupon.min_order_amount > 0 && cartTotal < coupon.min_order_amount) {
        return false;
      }
      if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
        return false;
      }
      return true;
    });

    return applicable;
  } catch (error) {
    console.error('Get applicable coupons error:', error.message);
    return [];
  }
};

const suggestCoupons = async (cartTotal, cartItems, userId) => {
  try {
    const [coupons] = await pool.query(
      `SELECT * FROM coupons
       WHERE is_active = 1
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND valid_until >= NOW()`
    );

    const productIds = cartItems.map(item => item.product_id);
    let cartCategoryIds = [];
    if (productIds.length > 0) {
      const [products] = await pool.query(
        `SELECT DISTINCT category_id FROM products WHERE id IN (?)`,
        [productIds]
      );
      cartCategoryIds = products.map(p => p.category_id);
    }

    const applicable = [];
    for (const coupon of coupons) {
      // Basic guards
      if (coupon.min_order_amount > 0 && cartTotal < coupon.min_order_amount) continue;
      if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) continue;

      // Product-restricted coupons
      const allowedProducts = parseRestriction(coupon.applicable_products);
      if (allowedProducts.length > 0 && !productIds.some(id => allowedProducts.includes(id))) continue;

      // Category-restricted coupons
      const allowedCategories = parseRestriction(coupon.applicable_categories);
      if (allowedCategories.length > 0 && !cartCategoryIds.some(id => allowedCategories.includes(id))) continue;

      // Per-user usage guard (skip silently — just don't suggest already-used coupons)
      if (userId) {
        const [usage] = await pool.query(
          'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
          [coupon.id, userId]
        );
        if (usage[0].count > 0) continue;
      }

      let discountAmount = calculateDiscount(coupon, cartTotal);
      // Free-shipping coupons save the ₹49 shipping charge on sub-₹499 carts
      if (coupon.type === 'free_shipping' && cartTotal < 499) {
        discountAmount = 49;
      }
      applicable.push({
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        max_discount: coupon.max_discount,
        min_order_amount: coupon.min_order_amount,
        description: coupon.description,
        valid_until: coupon.valid_until,
        discountAmount
      });
    }

    // Best offers first — by rupee savings (free_shipping / bogo come last since they save ₹0 in this model)
    applicable.sort((a, b) => b.discountAmount - a.discountAmount);
    return applicable.slice(0, 2);
  } catch (error) {
    console.error('Suggest coupons error:', error.message);
    return [];
  }
};

module.exports = {
  validateCoupon,
  calculateDiscount,
  applyCoupon,
  getApplicableCoupons,
  suggestCoupons
};
