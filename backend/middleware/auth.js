const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const pool = require('../config/db');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Token expired.', 401);
    }
    return ApiResponse.error(res, 'Invalid token.', 401);
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

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    req.user = null;
  }

  next();
};

module.exports = { verifyToken, isAdmin, isSeller, optionalAuth };
