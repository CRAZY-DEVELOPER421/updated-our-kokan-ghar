const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Public — returns currently active bank offers
const getBankOffers = asyncHandler(async (req, res) => {
  const [offers] = await pool.query(
    `SELECT id, bank_name, bank_code, logo_url, offer_title, offer_description,
            discount_type, min_order_amount, max_discount, valid_until, terms_url
     FROM bank_offers
     WHERE is_active = 1
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())
     ORDER BY sort_order ASC, id ASC`
  );

  return ApiResponse.success(res, { bankOffers: offers });
});

module.exports = {
  getBankOffers
};
