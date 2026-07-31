const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * /payment/create-order:
 *   post:
 *     summary: Create a Razorpay payment order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, order_id]
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in INR (paise when sent to razorpay)
 *               order_id:
 *                 type: integer
 *                 description: Internal order ID
 *     responses:
 *       200:
 *         description: Payment order created with razorpay_order_id.
 *       400:
 *         description: Invalid amount or order already paid.
 *       404:
 *         description: Order not found.
 */
router.post('/create-order', verifyToken, paymentController.createPaymentOrder);

/**
 * @swagger
 * /payment/verify:
 *   post:
 *     summary: Verify Razorpay payment signature
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id]
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *               order_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Payment verified successfully.
 *       400:
 *         description: Payment verification failed.
 */
router.post('/verify', verifyToken, paymentController.verifyPayment);

/**
 * @swagger
 * /payment/cod-confirm:
 *   post:
 *     summary: Confirm a Cash on Delivery order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id]
 *             properties:
 *               order_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: COD order confirmed.
 *       404:
 *         description: Order not found or already paid.
 */
router.post('/cod-confirm', verifyToken, paymentController.codConfirm);

module.exports = router;
