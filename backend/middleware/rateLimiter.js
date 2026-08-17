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

// Registration limiter — tighter than the general API limiter because signup
// is the #1 spam/fake-account attack surface (bot farms creating accounts to
// farm referral coins). 20 signups / 15 min / IP is generous for real users
// (even a shared office IP) but stops scripted mass-signup. The cap is
// overridable via REGISTER_RATE_LIMIT (set it high for local/test servers).
// Keys on the real client IP (X-Forwarded-For) so a tunnel proxy never makes
// all visitors share one bucket.
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.REGISTER_RATE_LIMIT) || 20,
  keyGenerator: (req) => clientIp(req),
  message: {
    success: false,
    message: 'Too many signup attempts from this device, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Client IP used for rate-limit buckets. Prefers the proxy header (the app
// runs behind ngrok/tunnel in production, where req.ip would otherwise be the
// proxy's IP for EVERY visitor and everyone would share one bucket).
const clientIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

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
module.exports = { generalLimiter, apiLimiter, registerLimiter };
