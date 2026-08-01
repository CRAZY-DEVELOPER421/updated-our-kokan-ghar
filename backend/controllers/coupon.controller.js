const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getAvailableCoupons = asyncHandler(async (req, res) => {
  const [coupons] = await pool.query(
    `SELECT c.id, c.code, c.type, c.value, c.min_order_amount, c.max_discount, c.description, c.valid_until,
            c.used_count, c.usage_limit,
            (SELECT COUNT(*) FROM coupon_usage cu WHERE cu.coupon_id = c.id AND cu.used_at >= CURDATE()) AS used_today
     FROM coupons c
     WHERE c.is_active = 1 
       AND (c.valid_from IS NULL OR c.valid_from <= NOW())
       AND c.valid_until >= NOW()
       AND (c.usage_limit = 0 OR c.used_count < c.usage_limit)
     ORDER BY c.value DESC`
  );

  return ApiResponse.success(res, { coupons });
});

module.exports = {
  getAvailableCoupons
};
