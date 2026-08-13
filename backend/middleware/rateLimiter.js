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

// ============================================================================
// TEMPORARILY COMMENTED OUT — auth rate limiting (5 attempts / 15 min / IP).
// Disabled during development/testing so repeated login/OTP attempts never hit
// "Too many authentication attempts". To RE-ENABLE: uncomment the block below
// and uncomment the `authLimiter` usages in routes/auth.routes.js (search for
// "RE-ENABLE AUTH LIMITER").
// ============================================================================
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 5,
//   message: {
//     success: false,
//     message: 'Too many authentication attempts, please try again after 15 minutes.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });

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

// RE-ENABLE AUTH LIMITER: restore `authLimiter` in this export too.
module.exports = { generalLimiter, apiLimiter };
