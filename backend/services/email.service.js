const nodemailer = require('nodemailer');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// FRONTEND_URL may be a comma-separated list of allowed origins — use the first entry.
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

const BRAND = 'Kokan Ghar';
const BRAND_TAGLINE = 'Authentic Konkan Products';

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"${BRAND}" <noreply@kokanghar.in>`,
      to,
      subject,
      html
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

// ── Shared HTML shell ─────────────────────────────────────────────
const emailShell = ({ title, contentHtml, subtitle = BRAND_TAGLINE, footerNote }) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: 'Inter', Arial, sans-serif; background: #FAF7F0; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <tr>
        <td style="background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%); padding: 30px; text-align: center;">
          <h1 style="color: #fff; font-family: 'Playfair Display', Georgia, serif; font-size: 26px; margin: 0;">${title}</h1>
          <p style="color: #EDE0CC; margin: 5px 0 0; font-size: 13px;">${subtitle}</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 36px 30px;">${contentHtml}</td>
      </tr>
      <tr>
        <td style="background: #EDE0CC; padding: 20px; text-align: center;">
          <p style="color: #6B7280; font-size: 12px; margin: 0;">${footerNote || `© ${new Date().getFullYear()} ${BRAND}. All rights reserved.`}</p>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

const ctaButton = (href, label, bg = '#2D6A4F') => `
  <a href="${href}" style="display: inline-block; background: ${bg}; color: #fff; padding: 13px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin-top: 18px;">${label}</a>
`;

// Escape user/admin-provided text before interpolating it into HTML templates
// (prevents HTML injection via names, coupon descriptions, etc.).
const escapeHtml = (str = '') => String(str)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// ── Welcome email (sent after a new signup) ───────────────────────
const sendWelcomeEmail = (email, name) => {
  const html = emailShell({
    title: `Welcome to ${BRAND}!`,
    contentHtml: `
      <p style="color: #1C1C1E; font-size: 16px;">Hello ${escapeHtml(name)},</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7;">
        A warm welcome from the Konkan coast! You've just joined <strong style="color: #2D6A4F;">${BRAND}</strong> —
        your one-stop shop for authentic products from Maharashtra, Goa and Karnataka.
      </p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7;">Here's what's waiting for you:</p>
      <ul style="color: #6B7280; font-size: 14px; line-height: 1.9; padding-left: 18px; margin: 0;">
        <li>570+ farm-fresh products — Alphonso mangoes, premium cashews, hand-pounded spices, pickles &amp; coastal delicacies</li>
        <li>Free delivery on orders above ₹499</li>
        <li>Flash sales, bank offers &amp; combo deals updated regularly</li>
      </ul>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin: 18px 0 0;">Ready to explore? Start searching our catalogue:</p>
      ${ctaButton(`${FRONTEND_URL}/products`, 'Start Searching')}
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin-top: 22px;">
        First order? Use code <strong style="color: #E87722;">WELCOME15</strong> for <strong>15% off</strong> at checkout.
      </p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin-top: 22px; font-style: italic;">
        Thank you for visiting ${BRAND} — we can't wait to deliver a little piece of the Konkan to your home!
      </p>
    `,
  });
  return { html };
};

// ── Welcome-back email (sent after an existing user logs in) ──────
const sendLoginEmail = (name) => {
  const html = emailShell({
    title: `Welcome back to ${BRAND}!`,
    contentHtml: `
      <p style="color: #1C1C1E; font-size: 16px;">Hello ${escapeHtml(name)},</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7;">
        Good to see you again! You've just signed in to your <strong style="color: #2D6A4F;">${BRAND}</strong> account.
        Pick up right where you left off — your wishlist, cart and order history are all waiting.
      </p>
      ${ctaButton(`${FRONTEND_URL}/products`, 'Continue Shopping')}
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin-top: 22px;">
        Want to check your saved items? <a href="${FRONTEND_URL}/account/wishlist" style="color: #2D6A4F; font-weight: 600;">View your wishlist</a>.
      </p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin-top: 22px; font-style: italic;">
        Thank you for visiting ${BRAND}!
      </p>
    `,
  });
  return { html };
};

// ── Promotional offer email (broadcast to all registered users) ───
const discountLabel = (type, value) => {
  const v = Number(value) || 0;
  if (type === 'percentage') return `${v}% OFF`;
  if (type === 'flat') return `₹${v.toLocaleString('en-IN')} OFF`;
  if (type === 'bogo') return 'Buy 1 Get 1';
  if (type === 'free_shipping') return 'Free Shipping';
  return 'a special discount';
};

const sendOfferEmail = (offer = {}) => {
  const label = discountLabel(offer.type, offer.value);
  const minOrder = Number(offer.min_order_amount) || 0;
  const maxDiscount = Number(offer.max_discount) || 0;

  let details = '';
  if (minOrder > 0) {
    details += `<p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin: 0 0 6px;">• Buy <strong>₹${minOrder.toLocaleString('en-IN')} and above</strong> to avail this offer</p>`;
  }
  if (maxDiscount > 0) {
    details += `<p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin: 0 0 6px;">• Maximum discount: <strong>₹${maxDiscount.toLocaleString('en-IN')}</strong></p>`;
  }
  if (offer.valid_until) {
    const d = new Date(offer.valid_until);
    if (!Number.isNaN(d.getTime())) {
      details += `<p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin: 0 0 6px;">• Offer valid till <strong>${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></p>`;
    }
  }

  const html = emailShell({
    title: `${label} at ${BRAND} — just for you!`,
    contentHtml: `
      <p style="color: #1C1C1E; font-size: 16px;">Hello,</p>
      <p style="color: #1C1C1E; font-size: 20px; line-height: 1.5; font-weight: bold; margin: 8px 0 4px;">
        ${BRAND} gives <span style="color: #E87722;">${label}</span> on our products!
      </p>
      ${offer.description ? `<p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin: 4px 0 16px;">${escapeHtml(offer.description)}</p>` : ''}
      <div style="background: #FAF7F0; border-radius: 8px; padding: 16px; margin: 8px 0;">
        ${details || '<p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin: 0;">No minimum order required.</p>'}
      </div>
      ${offer.code ? `
        <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin: 16px 0 4px;">Use coupon code at checkout:</p>
        <div style="background: #2D6A4F; border-radius: 8px; padding: 14px; text-align: center; margin: 8px 0 4px;">
          <span style="font-size: 24px; font-weight: bold; color: #fff; letter-spacing: 4px;">${escapeHtml(offer.code)}</span>
        </div>
      ` : ''}
      ${ctaButton(`${FRONTEND_URL}/products`, 'Shop Now')}
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7; margin-top: 22px; font-style: italic;">
        Thank you for visiting ${BRAND}!
      </p>
    `,
  });
  return { subject: `${label} at ${BRAND} — grab it before it's gone!`, html };
};

// ── Account suspension email ─────────────────────────────────────
const sendSuspensionEmail = (email, name, { permanent = false, until = null } = {}) => {
  const isTimed = !permanent && until;
  const detail = isTimed
    ? `Your account has been <strong style="color: #E87722;">temporarily suspended</strong> until <strong>${new Date(until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.`
    : 'Your account has been <strong style="color: #DC2626;">permanently suspended</strong>.';

  const html = emailShell({
    title: isTimed ? 'Account Temporarily Suspended' : 'Account Suspended',
    contentHtml: `
      <p style="color: #1C1C1E; font-size: 16px;">Hello ${escapeHtml(name)},</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7;">${detail}</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.7;">
        If you believe this is a mistake, please contact our support team and we'll be happy to help.
      </p>
      ${ctaButton(`${FRONTEND_URL}/contact`, 'Contact Support', '#E87722')}
    `,
  });
  return { subject: isTimed ? `Your ${BRAND} account is temporarily suspended` : `Your ${BRAND} account has been suspended`, html };
};

// ── OTP email (password reset) ────────────────────────────────────
const sendOTPEmail = (otp, name) => {
  const html = emailShell({
    title: 'Reset Your Password',
    contentHtml: `
      <p style="color: #1C1C1E; font-size: 16px;">Hello ${name},</p>
      <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">Use the following OTP to reset your password. This OTP is valid for 10 minutes.</p>
      <div style="background: #FAF7F0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; color: #2D6A4F; letter-spacing: 8px;">${otp}</span>
      </div>
      <p style="color: #6B7280; font-size: 12px;">If you did not request this, please ignore this email.</p>
    `,
  });
  return { html };
};

// ── Order confirmation email ──────────────────────────────────────
const sendOrderConfirmation = (email, name, orderNumber, items, total) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #EDE0CC; color: #1C1C1E;">${item.product_name} x${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #EDE0CC; color: #6B7280;">₹${item.total_price}</td>
    </tr>
  `).join('');

  const html = emailShell({
    title: 'Order Confirmed!',
    contentHtml: `
      <p style="color: #1C1C1E;">Hello ${name},</p>
      <p style="color: #6B7280; font-size: 14px;">Your order has been confirmed. Here's a summary:</p>
      <p style="color: #6B7280; font-size: 13px; margin-top: 4px;">Order #${orderNumber}</p>
      <table width="100%" style="margin-top: 12px;">${itemsHtml}</table>
      <p style="text-align: right; font-size: 18px; font-weight: bold; color: #2D6A4F;">Total: ₹${total}</p>
      ${ctaButton(`${FRONTEND_URL}/account/orders/${orderNumber}`, 'Track Order')}
    `,
  });
  return { html };
};

// ── Shipment update email ─────────────────────────────────────────
const sendShipmentUpdate = (email, name, orderNumber, status, message) => {
  const html = emailShell({
    title: 'Order Update',
    contentHtml: `
      <p style="color: #1C1C1E;">Hello ${name},</p>
      <p style="color: #6B7280; font-size: 14px;">Your order <strong>#${orderNumber}</strong> status has been updated to: <strong>${status}</strong></p>
      <p style="color: #6B7280; font-size: 14px;">${message}</p>
      ${ctaButton(`${FRONTEND_URL}/account/orders/${orderNumber}`, 'View Order', '#40916C')}
    `,
  });
  return { html };
};

// ── Back-in-stock email ───────────────────────────────────────────
const sendBackInStockEmail = (email, name, productName, productUrl) => {
  const html = emailShell({
    title: 'Back in Stock!',
    contentHtml: `
      <p style="color: #1C1C1E;">Hello ${name},</p>
      <p style="color: #6B7280; font-size: 14px;">Good news! <strong>${productName}</strong> is back in stock. Grab it before it sells out again!</p>
      ${ctaButton(productUrl, 'Shop Now', '#E87722')}
    `,
  });
  return { html };
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendLoginEmail,
  sendOfferEmail,
  sendOrderConfirmation,
  sendShipmentUpdate,
  sendBackInStockEmail,
  sendSuspensionEmail
};
