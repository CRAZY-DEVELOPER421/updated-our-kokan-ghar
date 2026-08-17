const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail, sendOTPEmail, sendWelcomeEmail, sendLoginEmail } = require('../services/email.service');
const { resolveUserStatus } = require('../services/suspension.service');
const loyaltyService = require('../services/loyalty.service');
const { generateReferralCode } = require('./referral.controller');

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      // Included for role-based access control (brief requirement); refresh
      // re-checks is_active against the DB, so deactivation takes effect
      // within one access-token lifetime even if the JWT is stale.
      is_active: user.is_active ?? 1
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, referral_code } = req.body;

  // Client IP — the device this signup came from. Used to enforce the
  // one-referral-per-device rule below. Prefers the proxy header (the app
  // runs behind ngrok/tunnel in production), falls back to the socket IP.
  const xff = req.headers['x-forwarded-for'];
  const clientIp = (typeof xff === 'string' && xff.trim()
    ? xff.split(',')[0].trim()
    : (req.ip || req.socket?.remoteAddress || '')).slice(0, 45);

  // ── 1. Email uniqueness ───────────────────────────────────────────────
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    // Friendly message for the "already have an account" popup — the frontend
    // guides the user to sign in instead of showing a scary red error toast.
    return ApiResponse.error(res, 'This email is already registered. Please sign in to continue.', 409);
  }

  // ── 2. Phone — required + globally unique (anti-fake-signup core) ─────
  // The same phone can NEVER create a second account, so swapping emails to
  // farm referral coins is impossible.
  const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(0, 10) : '';
  if (cleanPhone.length !== 10) {
    return ApiResponse.error(res, 'A valid 10-digit phone number is required.', 400);
  }
  const [phoneUsers] = await pool.query(
    'SELECT id, referral_code FROM users WHERE phone = ?',
    [cleanPhone]
  );
  if (phoneUsers.length > 0) {
    return ApiResponse.error(res, 'This phone number is already registered. Please sign in to continue.', 409);
  }

  // ── 3. Referral code (optional) — validated strictly ──────────────────
  let referrer = null;
  let normalizedRefCode = null;
  if (referral_code && String(referral_code).trim()) {
    normalizedRefCode = String(referral_code).trim().toUpperCase();
    const [refUsers] = await pool.query(
      'SELECT id, phone, is_active, signup_ip FROM users WHERE referral_code = ?',
      [normalizedRefCode]
    );
    if (refUsers.length === 0 || Number(refUsers[0].is_active) !== 1) {
      return ApiResponse.error(res, 'Invalid referral code. Please check and try again.', 400);
    }
    referrer = refUsers[0];

    // Anti-fraud: a user's own code can't be used to farm coins — the same
    // phone is already blocked above, but this is a second explicit guard.
    if (referrer.phone && referrer.phone === cleanPhone) {
      return ApiResponse.error(res, 'You cannot use your own referral code.', 400);
    }

    // ── Device guard (the "only NEW users" rule) ────────────────────────
    // A referral code is only honoured when the device has never created an
    // account before. This stops the same person from repeatedly signing up
    // with a fresh phone+email from one device to farm coins. (Signing up
    // WITHOUT a code is always allowed, so shared home WiFi is unaffected.)
    const [ipUsers] = await pool.query(
      'SELECT id FROM users WHERE signup_ip = ? LIMIT 1',
      [clientIp]
    );
    if (ipUsers.length > 0) {
      return ApiResponse.error(
        res,
        'Referral codes can only be used by new users. This device already has an account — please sign in to continue.',
        400
      );
    }

    // A friend using a code from the SAME device as the referrer is almost
    // certainly the same person — reject it explicitly.
    if (referrer.signup_ip && referrer.signup_ip === clientIp) {
      return ApiResponse.error(res, 'You cannot use a referral code from the same device as the referrer.', 400);
    }
  }

  // ── 4. Personal referral code for the new account ─────────────────────
  // Collision-safe: the INSERT below retries on ER_DUP_ENTRY (referral-code
  // collisions) with a fresh code, up to 5 attempts.
  let newReferralCode = null;

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  let insertId;
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateReferralCode();
    try {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash, phone, referral_code, signup_ip, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, password_hash, cleanPhone, candidate, clientIp, 'customer']
      );
      insertId = result.insertId;
      newReferralCode = candidate;
      break;
    } catch (err) {
      // Duplicate email/phone/referral-code from a race → decide.
      if (err.code === 'ER_DUP_ENTRY') {
        const dupEmail = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (dupEmail[0].length > 0) {
          return ApiResponse.error(res, 'This email is already registered. Please sign in to continue.', 409);
        }
        const dupPhone = await pool.query('SELECT id FROM users WHERE phone = ?', [cleanPhone]);
        if (dupPhone[0].length > 0) {
          return ApiResponse.error(res, 'This phone number is already registered. Please sign in to continue.', 409);
        }
        // Referral-code collision only → retry with a fresh code.
        continue;
      }
      throw err;
    }
  }
  if (!insertId) {
    return ApiResponse.error(res, 'Could not create account. Please try again.', 500);
  }

  // ── 5. Referral rewards — 50 coins to BOTH sides (only when a valid
  //       referral code was actually used at signup) ─────────────────────
  if (referrer) {
    const [rewardRows] = await pool.query(
      "SELECT value FROM site_settings WHERE setting_key = 'referral_reward_amount'"
    );
    const reward = rewardRows.length > 0 ? Number(rewardRows[0].value) : 50;
    try {
      await pool.query(
        'INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_given) VALUES (?, ?, ?, 1)',
        [referrer.id, insertId, normalizedRefCode]
      );
      await loyaltyService.awardPoints(referrer.id, reward, 'Referral reward — you referred a friend');
      await loyaltyService.awardPoints(insertId, reward, 'Referral welcome bonus — you joined via a friend');
    } catch (refErr) {
      console.error('Referral reward failed (signup still succeeds):', refErr.message);
    }
  }

  const accessToken = generateAccessToken({ id: insertId, email, role: 'customer' });
  const refreshToken = generateRefreshToken({ id: insertId });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  // Welcome email — fire-and-forget so a slow SMTP never delays signup.
  // sendEmail catches its own errors, so no unhandled rejection can occur.
  sendEmail({
    to: email,
    subject: 'Welcome to Kokan Ghar!',
    html: sendWelcomeEmail(email, name).html
  });

  return ApiResponse.created(res, {
    user: { id: insertId, name, email, phone: cleanPhone, role: 'customer', referral_code: newReferralCode },
    accessToken
  }, 'Registration successful! Welcome to Konkan Bazaar.');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [users] = await pool.query(
    'SELECT id, name, email, password_hash, role, is_verified, is_active, suspend_until FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    // Friendly, distinct message when the account does not exist at all — the
    // frontend shows this as a warm "please sign up" popup instead of a scary
    // red error toast.
    return ApiResponse.error(res, 'This account is not available. Please sign up to continue.', 404);
  }

  const user = users[0];

  const status = await resolveUserStatus(user);
  if (!status.ok) {
    return ApiResponse.error(res, status.message, status.statusCode, null, {
      code: status.code,
      suspendUntil: status.suspendUntil,
      permanent: status.permanent,
    });
  }

  if (!user.password_hash) {
    // Account was created via Google/Facebook — no password is stored, so an
    // email/password attempt can never match. Explain WHY instead of the
    // generic "Invalid email or password" so the user isn't left guessing.
    // The `code` lets the frontend show a friendly popup with a
    // "Continue with Google" / "Forgot Password" choice.
    return ApiResponse.error(
      res,
      'This account was created with Google/Facebook. Please sign in with your social account, or use Forgot Password to set a new password.',
      401,
      null,
      { code: 'OAUTH_ONLY_ACCOUNT' }
    );
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return ApiResponse.error(res, 'Invalid email or password.', 401);
  }

  await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

  // Welcome-back email for existing users — fire-and-forget so it never delays login.
  // sendEmail catches its own errors, so no unhandled rejection can occur.
  sendEmail({
    to: user.email,
    subject: 'Welcome back to Kokan Ghar!',
    html: sendLoginEmail(user.name).html
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return ApiResponse.success(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified
    },
    accessToken
  }, 'Login successful.');
});

const refreshTokenHandler = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!refreshToken) {
    return ApiResponse.error(res, 'Refresh token required.', 401);
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const [users] = await pool.query(
      'SELECT id, email, role, is_active, suspend_until FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return ApiResponse.error(res, 'User not found.', 404);
    }

    const status = await resolveUserStatus(users[0]);
    if (!status.ok) {
      return ApiResponse.error(res, status.message, status.statusCode, null, {
        code: status.code,
        suspendUntil: status.suspendUntil,
        permanent: status.permanent,
      });
    }
    const user = users[0];
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return ApiResponse.success(res, { accessToken: newAccessToken }, 'Token refreshed.');
  } catch (error) {
    return ApiResponse.error(res, 'Invalid refresh token.', 401);
  }
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken');
  return ApiResponse.success(res, {}, 'Logged out successfully.');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const [users] = await pool.query('SELECT id, name FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    return ApiResponse.success(res, {}, 'If email exists, OTP has been sent.');
  }

  const user = users[0];
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    'UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE id = ?',
    [otp, otpExpiry, user.id]
  );

  const otpEmail = sendOTPEmail(otp, user.name);
  await sendEmail({
    to: email,
    subject: 'Password Reset OTP - Konkan Bazaar',
    html: otpEmail.html
  });

  return ApiResponse.success(res, {}, 'OTP sent to your email.');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const [users] = await pool.query(
    'SELECT id FROM users WHERE reset_otp = ? AND reset_otp_expiry > NOW()',
    [token]
  );

  if (users.length === 0) {
    return ApiResponse.error(res, 'Invalid or expired OTP.', 400);
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  await pool.query(
    'UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expiry = NULL WHERE id = ?',
    [password_hash, users[0].id]
  );

  return ApiResponse.success(res, {}, 'Password reset successful.');
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const [users] = await pool.query(
    'SELECT id FROM users WHERE email_verify_token = ? AND email_verify_expiry > NOW()',
    [token]
  );

  if (users.length === 0) {
    return ApiResponse.error(res, 'Invalid or expired verification token.', 400);
  }

  await pool.query(
    'UPDATE users SET is_verified = 1, email_verify_token = NULL, email_verify_expiry = NULL WHERE id = ?',
    [users[0].id]
  );

  return ApiResponse.success(res, {}, 'Email verified successfully.');
});

const resendVerifyEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const [users] = await pool.query('SELECT id, name FROM users WHERE email = ?', [email]);
  if (users.length === 0) {
    return ApiResponse.success(res, {}, 'If email exists, verification link has been sent.');
  }

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await pool.query(
    'UPDATE users SET email_verify_token = ?, email_verify_expiry = ? WHERE id = ?',
    [verifyToken, verifyExpiry, users[0].id]
  );

  return ApiResponse.success(res, {}, 'Verification email sent.');
});

module.exports = {
  register,
  login,
  refreshTokenHandler,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerifyEmail,
  // Reused by social.controller.js so OAuth logins mint identical tokens.
  generateAccessToken,
  generateRefreshToken
};
