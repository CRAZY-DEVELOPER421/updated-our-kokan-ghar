const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const crypto = require('crypto');
const { sendEmail } = require('../services/email.service');

// ── Email template ────────────────────────────────────────────
const BRAND = 'Kokan Ghar';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

const sendNewsletterWelcomeEmail = async (email, name) => {
  const unsubscribeToken = crypto.createHash('sha256').update(email).digest('hex');
  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: 'Inter', Arial, sans-serif; background: #FAF7F0; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <tr>
        <td style="background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%); padding: 30px; text-align: center;">
          <h1 style="color: #fff; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; margin: 0;">Welcome to ${BRAND}!</h1>
          <p style="color: #EDE0CC; margin: 5px 0 0; font-size: 13px;">Authentic Konkan Products</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 36px 30px;">
          <p style="color: #1C1C1E; font-size: 16px;">Hello ${name || 'there'},</p>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.7;">
            Thank you for subscribing to the <strong style="color: #2D6A4F;">${BRAND}</strong> newsletter!
            You'll now receive exclusive offers, seasonal updates, and authentic Konkan recipes straight to your inbox.
          </p>
          <div style="background: #FAF7F0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="color: #6B7280; font-size: 13px; margin: 0 0 8px;">Here's your welcome gift 🎁</p>
            <div style="background: #2D6A4F; border-radius: 8px; padding: 14px; display: inline-block;">
              <span style="font-size: 28px; font-weight: bold; color: #fff; letter-spacing: 4px;">FRESH100</span>
            </div>
            <p style="color: #6B7280; font-size: 13px; margin: 8px 0 0;">₹100 OFF your first order — use at checkout</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 18px;">
            <tr>
              <td style="text-align: center;">
                <a href="${FRONTEND_URL}/products" style="display: inline-block; background: #E87722; color: #fff; padding: 13px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Shop Now</a>
              </td>
            </tr>
          </table>
          <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin-top: 22px; font-style: italic;">
            We promise only the best — no spam, just Konkan goodness!
          </p>
        </td>
      </tr>
      <tr>
        <td style="background: #EDE0CC; padding: 20px; text-align: center;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} ${BRAND}. All rights reserved.<br>
            <a href="${FRONTEND_URL}/unsubscribe?token=${unsubscribeToken}" style="color: #6B7280; text-decoration: underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  return sendEmail({ to: email, subject: `Welcome to ${BRAND} — here's ₹100 off! 🎉`, html });
};

// ── POST /api/subscribers — Subscribe ─────────────────────────
router.post('/', asyncHandler(async (req, res) => {
  const { email, name } = req.body;

  if (!email || typeof email !== 'string') {
    return ApiResponse.error(res, 'Email is required.', 400);
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return ApiResponse.error(res, 'Please enter a valid email address.', 400);
  }

  // Check if already subscribed
  const [existing] = await pool.query('SELECT id, is_active FROM subscribers WHERE email = ?', [cleanEmail]);

  if (existing.length > 0) {
    if (existing[0].is_active === 1) {
      return ApiResponse.success(res, {}, 'You are already subscribed!');
    }
    // Re-activate inactive subscriber
    await pool.query('UPDATE subscribers SET is_active = 1, name = COALESCE(?, name) WHERE email = ?', [name || null, cleanEmail]);
  } else {
    // New subscriber
    const cleanName = name ? String(name).trim().slice(0, 100) : null;
    await pool.query('INSERT INTO subscribers (email, name) VALUES (?, ?)', [cleanEmail, cleanName]);
  }

  // Send welcome email (fire-and-forget — never block the response)
  sendNewsletterWelcomeEmail(cleanEmail, name).catch((err) => {
    console.error('[Newsletter] Welcome email failed:', err.message);
  });

  return ApiResponse.success(res, {}, 'Subscribed successfully! Check your inbox for ₹100 off code.');
}));

// ── POST /api/subscribers/unsubscribe — Unsubscribe ───────────
router.post('/unsubscribe', asyncHandler(async (req, res) => {
  const { email, token } = req.body;

  let cleanEmail = email ? String(email).trim().toLowerCase() : null;

  // If token provided, derive email from it (for one-click unsubscribe from email link)
  if (!cleanEmail && token) {
    // Token is sha256 of email — we need to look up by matching
    const [rows] = await pool.query('SELECT email FROM subscribers WHERE is_active = 1');
    for (const row of rows) {
      const expected = crypto.createHash('sha256').update(row.email).digest('hex');
      if (expected === token) {
        cleanEmail = row.email;
        break;
      }
    }
  }

  if (!cleanEmail) {
    return ApiResponse.error(res, 'Email is required.', 400);
  }

  const [result] = await pool.query('UPDATE subscribers SET is_active = 0 WHERE email = ?', [cleanEmail]);

  if (result.affectedRows === 0) {
    return ApiResponse.error(res, 'Email not found.', 404);
  }

  return ApiResponse.success(res, {}, 'You have been unsubscribed successfully.');
}));

// ── GET /api/subscribers — Admin: list all subscribers ─────────
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  const [countResult] = await pool.query('SELECT COUNT(*) as total FROM subscribers');
  const [subscribers] = await pool.query(
    'SELECT id, email, name, is_active, subscribed_at FROM subscribers ORDER BY subscribed_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );

  return ApiResponse.paginated(res, { subscribers }, {
    page, limit,
    total: countResult[0].total,
    pages: Math.ceil(countResult[0].total / limit)
  });
}));

// ── GET /api/subscribers/count — Admin: subscriber count ───────
router.get('/count', asyncHandler(async (req, res) => {
  const [result] = await pool.query('SELECT COUNT(*) as total FROM subscribers WHERE is_active = 1');
  return ApiResponse.success(res, { count: result[0].total });
}));

module.exports = router;
