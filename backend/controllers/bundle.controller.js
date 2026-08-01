const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getActiveBundles = asyncHandler(async (req, res) => {
  const [bundles] = await pool.query(
    `SELECT b.id, b.name, b.slug, b.description,
            b.bundle_price, b.original_price,
            ROUND(((b.original_price - b.bundle_price) / NULLIF(b.original_price, 0)) * 100) AS savings_percent
     FROM bundles b
     WHERE b.is_active = 1
       AND (b.valid_from IS NULL OR b.valid_from <= NOW())
       AND (b.valid_until IS NULL OR b.valid_until >= NOW())
     ORDER BY b.sort_order ASC, b.id ASC`
  );

  // Attach each bundle's products (name, slug, price, rating, primary image, qty)
  for (const bundle of bundles) {
    const [products] = await pool.query(
      `SELECT bp.product_id, bp.quantity,
              p.name, p.slug, p.price, p.mrp, p.average_rating, p.review_count,
              p.short_description,
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

module.exports = {
  getActiveBundles
};
