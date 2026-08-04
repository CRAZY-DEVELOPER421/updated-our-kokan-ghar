const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

let razorpay = null;
try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
} catch (e) {
  console.warn('⚠️ Razorpay not configured. Payment features will be unavailable.');
}

const createOrder = async (amount, currency = 'INR', receipt = null) => {
  try {
    if (!razorpay) {
      return { success: false, error: 'Razorpay not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env' };
    }
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    return {
      success: true,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status
    };
  } catch (error) {
    console.error('❌ Razorpay create order error:', error.message);
    return { success: false, error: error.message };
  }
};

const verifyPayment = (orderId, paymentId, signature) => {
  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === signature;
    return { success: isValid };
  } catch (error) {
    console.error('❌ Payment verification error:', error.message);
    return { success: false, error: error.message };
  }
};

const fetchPayment = async (paymentId) => {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return { success: true, payment };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const refundPayment = async (paymentId, amount = null) => {
  try {
    const options = {};
    if (amount) {
      options.amount = Math.round(amount * 100);
    }
    const refund = await razorpay.payments.refund(paymentId, options);
    return { success: true, refund };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifyPayment,
  fetchPayment,
  refundPayment
};
