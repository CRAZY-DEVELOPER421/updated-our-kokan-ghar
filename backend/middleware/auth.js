const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const pool = require('../config/db');
const { resolveUserStatus } = require('../services/suspension.service');

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token expired.', 401);
    }
    return ApiResponse.error(res, 'Invalid token.', 401);
  }

  // Re-check the account on EVERY request — a JWT alone is never enough. This
  // makes an admin suspension take effect immediately (the old code only
  // verified the signature, so a suspended user kept working until their
  // 15-minute access token expired).
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, is_active, suspend_until FROM users WHERE id = ?',
      [decoded.id]
    );
    if (users.length === 0) {
      return ApiResponse.error(res, 'User not found.', 404);
    }

    const result = await resolveUserStatus(users[0]);
    if (!result.ok) {
      return ApiResponse.error(res, result.message, result.statusCode, null, {
        code: result.code,
        suspendUntil: result.suspendUntil,
        permanent: result.permanent,
      });
    }

    req.user = { ...decoded, ...users[0] };
    next();
  } catch (error) {
    return ApiResponse.error(res, 'Server error.', 500);
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT role FROM users WHERE id = ? AND is_active = 1',
      [req.user.id]
    );

    if (users.length === 0) {
      return ApiResponse.error(res, 'User not found.', 404);
    }

    if (users[0].role !== 'admin') {
      return ApiResponse.error(res, 'Access denied. Admin only.', 403);
    }

    next();
  } catch (error) {
    return ApiResponse.error(res, 'Server error.', 500);
  }
};

const isSeller = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT role FROM users WHERE id = ? AND is_active = 1',
      [req.user.id]
    );

    if (users.length === 0) {
      return ApiResponse.error(res, 'User not found.', 404);
    }

    if (users[0].role !== 'seller' && users[0].role !== 'admin') {
      return ApiResponse.error(res, 'Access denied. Seller or admin only.', 403);
    }

    next();
  } catch (error) {
    return ApiResponse.error(res, 'Server error.', 500);
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Suspended users are treated as anonymous on optional-auth routes — they
    // shouldn't see personalized data (wishlist state, saved cart, etc.).
    const [users] = await pool.query(
      'SELECT id, is_active, suspend_until FROM users WHERE id = ?',
      [decoded.id]
    );
    if (users.length === 0) {
      req.user = null;
      return next();
    }
    const status = await resolveUserStatus(users[0]);
    if (!status.ok) {
      req.user = null;
      return next();
    }
    req.user = { ...decoded, ...users[0] };
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = { verifyToken, isAdmin, isSeller, optionalAuth };
