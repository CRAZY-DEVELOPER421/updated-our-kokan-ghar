const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail, sendOTPEmail, sendWelcomeEmail } = require('../services/email.service');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
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
  const { name, email, password, phone } = req.body;

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return ApiResponse.error(res, 'Email already registered.', 409);
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, password_hash, phone || null, 'customer']
  );

  const accessToken = generateAccessToken({ id: result.insertId, email, role: 'customer' });
  const refreshToken = generateRefreshToken({ id: result.insertId });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  const welcomeEmail = sendWelcomeEmail(email, name);
  await sendEmail({
    to: email,
    subject: 'Welcome to Konkan Bazaar!',
    html: welcomeEmail.html
  });

  return ApiResponse.created(res, {
    user: { id: result.insertId, name, email, role: 'customer' },
    accessToken
  }, 'Registration successful! Welcome to Konkan Bazaar.');
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const [users] = await pool.query(
    'SELECT id, name, email, password_hash, role, is_verified, is_active FROM users WHERE email = ?',
    [email]
  );

  if (users.length === 0) {
    return ApiResponse.error(res, 'Invalid email or password.', 401);
  }

  const user = users[0];

  if (!user.is_active) {
    return ApiResponse.error(res, 'Account has been deactivated. Contact support.', 403);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return ApiResponse.error(res, 'Invalid email or password.', 401);
  }

  await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

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
      'SELECT id, email, role FROM users WHERE id = ? AND is_active = 1',
      [decoded.id]
    );

    if (users.length === 0) {
      return ApiResponse.error(res, 'User not found.', 404);
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
  resendVerifyEmail
};
