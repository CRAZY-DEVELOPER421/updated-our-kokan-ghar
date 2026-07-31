const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getAvailableCoupons = asyncHandler(async (req, res) => {
  const [coupons] = await pool.query(
    `SELECT code, type, value, min_order_amount, max_discount, description, valid_until
     FROM coupons 
     WHERE is_active = 1 
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND valid_until >= NOW()
       AND (usage_limit = 0 OR used_count < usage_limit)
     ORDER BY value DESC`
  );

  return ApiResponse.success(res, { coupons });
});

module.exports = {
  getAvailableCoupons
};
