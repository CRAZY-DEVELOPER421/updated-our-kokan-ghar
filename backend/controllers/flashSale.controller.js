const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Public — returns active flash sales joined with product info (incl. ends_at for countdowns)
const getActiveFlashSales = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT fs.id, fs.product_id, fs.sale_price, fs.original_price, fs.quantity_limit,
            fs.sold_count, fs.starts_at, fs.ends_at,
            p.name as product_name, p.slug as product_slug,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image
     FROM flash_sales fs
     JOIN products p ON fs.product_id = p.id
     WHERE fs.is_active = 1
       AND p.is_active = 1
       AND NOW() BETWEEN fs.starts_at AND fs.ends_at
     ORDER BY fs.ends_at ASC`
  );

  // Normalize DATETIME to ISO strings so the frontend countdown parses
  // consistently across browsers (new Date('YYYY-MM-DD HH:MM:SS') is invalid in Safari).
  const flashSales = rows.map((fs) => ({
    ...fs,
    starts_at: fs.starts_at ? new Date(fs.starts_at).toISOString() : null,
    ends_at: fs.ends_at ? new Date(fs.ends_at).toISOString() : null,
  }));

  return ApiResponse.success(res, { flashSales });
});

module.exports = {
  getActiveFlashSales
};
