const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { verifyToken } = require('../middleware/auth');
const { orderValidation } = require('../middleware/validate');

/**
 * @swagger
 * /orders/create:
 *   post:
 *     summary: Create a new order from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [address_id, payment_method]
 *             properties:
 *               address_id:
 *                 type: integer
 *               payment_method:
 *                 type: string
 *                 enum: [online, cod]
 *               notes:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       201:
 *         description: Order created successfully.
 *       400:
 *         description: Cart is empty or stock insufficient.
 *       404:
 *         description: Cart or address not found.
 */
router.get('/pending-count', verifyToken, orderController.getPendingCount);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get the current user's orders (paginated, optional status filter)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *     responses:
 *       200:
 *         description: Paginated list of the user's orders.
 */
router.get('/', verifyToken, orderController.getOrders);

router.post('/create', verifyToken, orderValidation, orderController.createOrder);

/**
 * @swagger
 * /orders/{orderNumber}:
 *   get:
 *     summary: Get order details by order number
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: e.g. KB1A2B3C4D
 *     responses:
 *       200:
 *         description: Order details with items, tracking, and address.
 *       404:
 *         description: Order not found.
 */
router.get('/:orderNumber', verifyToken, orderController.getOrderByNumber);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order (only pending or confirmed)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order cancelled successfully. Stock restored.
 *       400:
 *         description: Order cannot be cancelled.
 */
router.put('/:id/cancel', verifyToken, orderController.cancelOrder);

/**
 * @swagger
 * /orders/{id}/return-request:
 *   post:
 *     summary: Request a return for a delivered order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Return request submitted.
 *       400:
 *         description: Order cannot be returned or not found.
 */
router.post('/:id/return-request', verifyToken, orderController.requestReturn);

/**
 * @swagger
 * /orders/{id}/tracking:
 *   get:
 *     summary: Get order tracking history
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tracking history.
 *       404:
 *         description: Order not found.
 */
router.get('/:id/tracking', verifyToken, orderController.getOrderTracking);

module.exports = router;
