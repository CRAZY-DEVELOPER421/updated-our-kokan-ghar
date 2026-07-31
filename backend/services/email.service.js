const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Konkan Bazaar" <noreply@konkanbazaar.in>',
      to,
      subject,
      html
    });
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendOTPEmail = (otp, name) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Inter', Arial, sans-serif; background: #FAF7F0; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <tr>
          <td style="background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%); padding: 30px; text-align: center;">
            <h1 style="color: #fff; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0;">Konkan Bazaar</h1>
            <p style="color: #EDE0CC; margin: 5px 0 0;">Authentic Konkan Products</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="color: #1C1C1E; font-size: 16px;">Hello ${name},</p>
            <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">Use the following OTP to reset your password. This OTP is valid for 10 minutes.</p>
            <div style="background: #FAF7F0; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; color: #2D6A4F; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #6B7280; font-size: 12px;">If you did not request this, please ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="background: #EDE0CC; padding: 20px; text-align: center;">
            <p style="color: #6B7280; font-size: 12px; margin: 0;">© 2024 Konkan Bazaar. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  return { html };
};

const sendWelcomeEmail = (email, name) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Inter', Arial, sans-serif; background: #FAF7F0; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <tr>
          <td style="background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%); padding: 30px; text-align: center;">
            <h1 style="color: #fff; font-family: 'Playfair Display', Georgia, serif; font-size: 28px; margin: 0;">Welcome to Konkan Bazaar!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 40px 30px;">
            <p style="color: #1C1C1E; font-size: 16px;">Hello ${name},</p>
            <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">Thank you for joining Konkan Bazaar! We're excited to bring you authentic products from the Konkan region - from Alphonso mangoes to premium cashews, traditional spices, and coastal delicacies.</p>
            <p style="color: #6B7280; font-size: 14px; line-height: 1.6;">Use code <strong style="color: #E87722;">WELCOME15</strong> for 15% off your first order!</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/products" style="display: inline-block; background: #2D6A4F; color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 15px;">Start Shopping</a>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  return { html };
};

const sendOrderConfirmation = (email, name, orderNumber, items, total) => {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #EDE0CC; color: #1C1C1E;">${item.product_name} x${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #EDE0CC; color: #6B7280;">₹${item.total_price}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Inter', Arial, sans-serif; background: #FAF7F0; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="background: #2D6A4F; padding: 30px; text-align: center;">
            <h1 style="color: #fff; font-family: 'Playfair Display', Georgia, serif; font-size: 24px; margin: 0;">Order Confirmed!</h1>
            <p style="color: #EDE0CC; font-size: 14px;">Order #${orderNumber}</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p>Hello ${name},</p>
            <p>Your order has been confirmed. Here's a summary:</p>
            <table width="100%" style="margin-top: 15px;">
              ${itemsHtml}
            </table>
            <p style="text-align: right; font-size: 18px; font-weight: bold; color: #2D6A4F;">Total: ₹${total}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/orders/${orderNumber}" style="display: inline-block; background: #2D6A4F; color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; margin-top: 15px;">Track Order</a>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  return { html };
};

const sendShipmentUpdate = (email, name, orderNumber, status, message) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Inter', Arial, sans-serif; background: #FAF7F0; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="background: #40916C; padding: 30px; text-align: center;">
            <h1 style="color: #fff; font-size: 24px; margin: 0;">Order Update</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p>Hello ${name},</p>
            <p>Your order <strong>#${orderNumber}</strong> status has been updated to: <strong>${status}</strong></p>
            <p>${message}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/account/orders/${orderNumber}">View Order</a>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  return { html };
};

const sendBackInStockEmail = (email, name, productName, productUrl) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'Inter', Arial, sans-serif; background: #FAF7F0; margin: 0; padding: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 20px auto; background: #fff; border-radius: 12px; overflow: hidden;">
        <tr>
          <td style="background: #E87722; padding: 30px; text-align: center;">
            <h1 style="color: #fff; font-size: 24px; margin: 0;">Back in Stock!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding: 30px;">
            <p>Hello ${name},</p>
            <p>Good news! <strong>${productName}</strong> is back in stock. Grab it before it sells out again!</p>
            <a href="${productUrl}" style="display: inline-block; background: #E87722; color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Shop Now</a>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
  return { html };
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendShipmentUpdate,
  sendBackInStockEmail
};
