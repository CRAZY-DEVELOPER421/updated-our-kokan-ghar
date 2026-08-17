/**
 * SMS service — transactional order notifications (MSG91 / Fast2SMS).
 *
 * Why: COD customers often have no email — SMS is the reliable channel for
 * order confirmation, out-for-delivery and delivery updates.
 *
 * Providers supported (SMS_PROVIDER env):
 *   - msg91     — MSG91 v5 Flow API (https://control.msg91.com/api/v5/flow/)
 *   - fast2sms  — Fast2SMS Bulk v2 API (https://www.fast2sms.com/dev/bulkV2)
 *   - none      — (default) SMS disabled; sendSMS() returns { success: false }
 *                 without making any network call. Set real credentials in
 *                 .env to activate.
 *
 * Every send is fire-and-forget: callers await sendSMS() but failures are
 * logged and never thrown — an SMS hiccup must never fail an order.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const PROVIDER = (process.env.SMS_PROVIDER || 'none').toLowerCase();
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'KOKNGR';
const MSG91_FLOW_ID = process.env.MSG91_FLOW_ID || ''; // DLT-approved template flow id
const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || '';
const FAST2SMS_SENDER_ID = process.env.FAST2SMS_SENDER_ID || 'KOKNGR';

const BRAND = 'Kokan Ghar';

/**
 * Normalize an Indian phone number to international format (91XXXXXXXXXX).
 * Accepts: 9876543210, +919876543210, 09876543210, 91 98765 43210 ...
 * Returns null if the number can't be made into a valid 10-digit mobile.
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d]/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) return null;
  return `91${digits}`;
};

// ── MSG91 (v5 Flow API) ──────────────────────────────────────────────
const sendMsg91 = async (phone, message) => {
  if (!MSG91_AUTH_KEY) return { success: false, error: 'MSG91_AUTH_KEY not configured' };
  const mobiles = normalizePhone(phone);
  if (!mobiles) return { success: false, error: `Invalid phone: ${phone}` };

  // MSG91 v5 Flow API sends a DLT-approved template (flow) and only accepts
  // variables defined in that flow (VAR1, VAR2, ...). If a flow id is set we
  // pass the message as VAR1; otherwise fall back to the legacy sendhttp API.
  if (MSG91_FLOW_ID) {
    const body = {
      sender: MSG91_SENDER_ID,
      route: 4, // transactional
      flow_id: MSG91_FLOW_ID,
      mobiles,
      VAR1: message,
    };
    const res = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: { authkey: MSG91_AUTH_KEY, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return { success: false, error: `MSG91 flow ${res.status}: ${JSON.stringify(data)?.slice(0, 200)}` };
    }
    return { success: true, data };
  }

  // Legacy fallback (no flow configured) — sendhttp.php
  const params = new URLSearchParams({
    authkey: MSG91_AUTH_KEY,
    mobiles,
    message,
    sender: MSG91_SENDER_ID,
    route: 4,
    country: 91,
  });
  const res = await fetch(`https://api.msg91.com/api/sendhttp.php?${params.toString()}`);
  const text = await res.text();
  if (!res.ok || /error/i.test(text)) {
    return { success: false, error: `MSG91 sendhttp ${res.status}: ${text.slice(0, 200)}` };
  }
  return { success: true, data: text };
};

// ── Fast2SMS (Bulk v2 API) ───────────────────────────────────────────
const sendFast2Sms = async (phone, message) => {
  if (!FAST2SMS_API_KEY) return { success: false, error: 'FAST2SMS_API_KEY not configured' };
  const mobiles = normalizePhone(phone);
  if (!mobiles) return { success: false, error: `Invalid phone: ${phone}` };

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: FAST2SMS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'transactional',
      sender_id: FAST2SMS_SENDER_ID,
      message,
      language: 'english',
      flash: 0,
      numbers: mobiles.slice(2), // Fast2SMS wants 10-digit numbers
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.return === false) {
    return { success: false, error: `Fast2SMS ${res.status}: ${JSON.stringify(data)?.slice(0, 200)}` };
  }
  return { success: true, data };
};

/**
 * Send a transactional SMS. Fire-and-forget wrapper — never throws.
 * @param {string} phone - Indian mobile (any common format accepted)
 * @param {string} message - Plain-text message content
 */
const sendSMS = async (phone, message) => {
  try {
    if (PROVIDER === 'none' || (!MSG91_AUTH_KEY && !FAST2SMS_API_KEY)) {
      console.log(`[sms] skipped (SMS_PROVIDER=${PROVIDER} or no credentials) → ${phone}: ${message.slice(0, 60)}`);
      return { success: false, error: 'SMS not configured (set SMS_PROVIDER + provider key in .env)' };
    }

    const result = PROVIDER === 'fast2sms'
      ? await sendFast2Sms(phone, message)
      : await sendMsg91(phone, message);

    if (result.success) {
      console.log(`[sms] sent to ${phone}`);
    } else {
      console.error('[sms] send failed:', result.error);
    }
    return result;
  } catch (error) {
    console.error('[sms] unexpected error:', error.message);
    return { success: false, error: error.message };
  }
};

// ── Order templates ──────────────────────────────────────────────────
// Each returns the plain-text message. Variables come from the order row.
const orderSmsTemplates = {
  order_placed: (orderNumber, amount) =>
    `Dear customer, your ${BRAND} order ${orderNumber} of Rs.${Number(amount || 0).toLocaleString('en-IN')} has been placed successfully. We will notify you on every update. - ${BRAND}`,
  confirmed: (orderNumber) =>
    `Great news! Your ${BRAND} order ${orderNumber} is confirmed and being prepared. We'll keep you posted. - ${BRAND}`,
  shipped: (orderNumber, location) =>
    `Your ${BRAND} order ${orderNumber} has been shipped!${location ? ` Current location: ${location}.` : ''} It is on its way. - ${BRAND}`,
  out_for_delivery: (orderNumber) =>
    `Your ${BRAND} order ${orderNumber} is OUT FOR DELIVERY! Please keep your phone handy. - ${BRAND}`,
  delivered: (orderNumber) =>
    `Your ${BRAND} order ${orderNumber} has been DELIVERED. Thank you for shopping with us! Please share your feedback. - ${BRAND}`,
  cancelled: (orderNumber) =>
    `Your ${BRAND} order ${orderNumber} has been cancelled. For any questions, contact our support. - ${BRAND}`,
};

/**
 * Send an order-status SMS. Picks the template by status key.
 * @param {string} phone - customer phone
 * @param {string} statusKey - one of orderSmsTemplates keys
 * @param {object} vars - { orderNumber, amount, location }
 */
const sendOrderSMS = async (phone, statusKey, vars = {}) => {
  const tmpl = orderSmsTemplates[statusKey];
  if (!tmpl) return { success: false, error: `Unknown SMS template: ${statusKey}` };
  const message = tmpl(vars.orderNumber, vars.amount, vars.location);
  return sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendOrderSMS,
  normalizePhone,
  orderSmsTemplates,
};
