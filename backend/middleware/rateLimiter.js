const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: parseInt(process.env.API_RATE_LIMIT) || 1000,
  message: {
    success: false,
    message: 'Too many API requests, please try again after a minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => req.path.includes('/uploads') || req.path.includes('/images')
});

module.exports = { generalLimiter, authLimiter, apiLimiter };
