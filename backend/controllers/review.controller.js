const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const createReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, body } = req.body;

  const [existing] = await pool.query(
    'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (existing.length > 0) {
    return ApiResponse.error(res, 'You have already reviewed this product.', 400);
  }

  // Auto-approved on insert so reviews (and their rating) show up on the
  // product page immediately — the admin moderation panel can hide them later.
  const [result] = await pool.query(
    'INSERT INTO reviews (product_id, user_id, rating, title, body, is_approved) VALUES (?, ?, ?, ?, ?, 1)',
    [id, req.user.id, rating, title || null, body || null]
  );

  const [avgRating] = await pool.query(
    'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = ? AND is_approved = 1',
    [id]
  );

  if (avgRating[0].review_count > 0) {
    await pool.query(
      'UPDATE products SET average_rating = ?, review_count = ? WHERE id = ?',
      [Math.round(avgRating[0].avg_rating * 100) / 100, avgRating[0].review_count, id]
    );
  }

  const [review] = await pool.query(
    `SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.id = ?`,
    [result.insertId]
  );

  return ApiResponse.created(res, { review: review[0] }, 'Review submitted.');
});

/**
 * GET /reviews/home  (public)
 * Reviews for the homepage "What Our Customers Say" slider.
 *
 * Priority:
 *   1. Reviews the admin explicitly marked "Add to Home" (show_on_home = 1,
 *      must also be approved) — newest first.
 *   2. If none are featured yet, fall back to the latest approved reviews
 *      so the slider is never empty on a fresh store.
 */
const getHomeReviews = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 8, 20);

  const [featured] = await pool.query(
    `SELECT r.id, r.rating, r.title, r.body, r.created_at, r.show_on_home,
            u.name as user_name, u.avatar_url as user_avatar,
            p.name as product_name, p.slug as product_slug
     FROM reviews r
     JOIN users u ON r.user_id = u.id
     JOIN products p ON r.product_id = p.id
     WHERE r.is_approved = 1 AND r.show_on_home = 1
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [limit]
  );

  let reviews = featured;

  if (reviews.length === 0) {
    const [recent] = await pool.query(
      `SELECT r.id, r.rating, r.title, r.body, r.created_at, r.show_on_home,
              u.name as user_name, u.avatar_url as user_avatar,
              p.name as product_name, p.slug as product_slug
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       JOIN products p ON r.product_id = p.id
       WHERE r.is_approved = 1
       ORDER BY r.created_at DESC
       LIMIT ?`,
      [limit]
    );
    reviews = recent;
  }

  return ApiResponse.success(res, {
    reviews,
    source: featured.length > 0 ? 'featured' : 'recent',
  });
});

const voteHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_helpful } = req.body;

  const [existing] = await pool.query(
    'SELECT id, is_helpful FROM review_votes WHERE review_id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (existing.length > 0) {
    if (existing[0].is_helpful === (is_helpful ? 1 : 0)) {
      // Toggling off the same vote
      await pool.query('DELETE FROM review_votes WHERE id = ?', [existing[0].id]);
      const delta = existing[0].is_helpful ? -1 : 0;
      await pool.query('UPDATE reviews SET helpful_count = GREATEST(helpful_count + ?, 0) WHERE id = ?', [delta, id]);
      return ApiResponse.success(res, {}, 'Vote removed.');
    }

    // Changing vote type: if old vote was helpful, decrement; if new vote is helpful, increment
    const delta = existing[0].is_helpful ? -1 : (is_helpful ? 1 : 0);
    await pool.query(
      'UPDATE review_votes SET is_helpful = ? WHERE id = ?',
      [is_helpful ? 1 : 0, existing[0].id]
    );
    await pool.query('UPDATE reviews SET helpful_count = GREATEST(helpful_count + ?, 0) WHERE id = ?', [delta, id]);
  } else {
    await pool.query(
      'INSERT INTO review_votes (review_id, user_id, is_helpful) VALUES (?, ?, ?)',
      [id, req.user.id, is_helpful ? 1 : 0]
    );

    const helpfulDelta = is_helpful ? 1 : 0;
    await pool.query('UPDATE reviews SET helpful_count = helpful_count + ? WHERE id = ?', [helpfulDelta, id]);
  }

  return ApiResponse.success(res, {}, 'Vote recorded.');
});

module.exports = {
  createReview,
  getHomeReviews,
  voteHelpful
};
