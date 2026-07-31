const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getBanners = asyncHandler(async (req, res) => {
  const { position } = req.query;

  let whereClause = 'WHERE is_active = 1 AND (valid_from IS NULL OR valid_from <= NOW()) AND (valid_until IS NULL OR valid_until >= NOW())';
  const params = [];

  if (position) {
    whereClause += ' AND position = ?';
    params.push(position);
  }

  const [banners] = await pool.query(
    `SELECT * FROM banners ${whereClause} ORDER BY sort_order ASC`,
    params
  );

  return ApiResponse.success(res, { banners });
});

module.exports = {
  getBanners
};
