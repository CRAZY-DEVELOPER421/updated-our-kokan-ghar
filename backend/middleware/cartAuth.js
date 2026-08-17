const ApiResponse = require('../utils/apiResponse');
const { verifyToken } = require('./auth');

/**
 * Cart middleware — lets GUESTS use the cart with an X-Guest-Id device id
 * (no account needed), while logged-in users keep using their JWT.
 *
 * - JWT present (Bearer ...)  → full user cart (verifyToken sets req.user)
 * - No JWT but X-Guest-Id     → guest cart (req.guestId)
 * - Neither                   → 401
 *
 * This is what makes "add to cart without login" work: visitors carry a
 * device id from first visit; the merge endpoint later converts that guest
 * cart into the user's cart after signup/login.
 */
const cartAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(req, res, next);
  }

  const guestId = req.headers['x-guest-id'];

  if (!guestId || typeof guestId !== 'string') {
    return ApiResponse.error(res, 'Access denied. Login or guest session required.', 401);
  }

  if (guestId.length < 8 || guestId.length > 64 || !/^[A-Za-z0-9_-]+$/.test(guestId)) {
    return ApiResponse.error(res, 'Invalid guest session.', 400);
  }

  req.guestId = guestId;
  return next();
};

module.exports = { cartAuth };
