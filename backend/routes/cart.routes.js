const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { verifyToken } = require('../middleware/auth');
const { couponValidation } = require('../middleware/validate');

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get current user's cart with items and summary (auto-creates cart if none exists)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart with items and pricing summary.
 */
router.get('/', verifyToken, cartController.getCart);

/**
 * @swagger
 * /cart/items:
 *   post:
 *     summary: Add product to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id]
 *             properties:
 *               product_id:
 *                 type: integer
 *               variant_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
 *     responses:
 *       200:
 *         description: Item added to cart.
 *       400:
 *         description: Insufficient stock.
 *       404:
 *         description: Product not found.
 */
router.post('/items', verifyToken, cartController.addToCart);

/**
 * @swagger
 * /cart/items/{id}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Cart updated. If quantity is 0, item is removed.
 *       400:
 *         description: Insufficient stock.
 *       404:
 *         description: Cart item not found.
 */
router.put('/items/:id', verifyToken, cartController.updateCartItem);

/**
 * @swagger
 * /cart/items/{id}:
 *   delete:
 *     summary: Remove an item from cart
 *     tags: [Cart]
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
 *         description: Item removed from cart.
 */
router.delete('/items/:id', verifyToken, cartController.removeCartItem);

/**
 * @swagger
 * /cart/clear:
 *   delete:
 *     summary: Clear all items and remove coupon from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared.
 */
router.delete('/clear', verifyToken, cartController.clearCart);

/**
 * @swagger
 * /cart/apply-coupon:
 *   post:
 *     summary: Apply a coupon code to cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Coupon applied.
 *       400:
 *         description: Cart is empty or invalid coupon.
 */
router.post('/apply-coupon', verifyToken, couponValidation, cartController.applyCoupon);

/**
 * @swagger
 * /cart/remove-coupon:
 *   delete:
 *     summary: Remove applied coupon from cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Coupon removed.
 */
router.delete('/remove-coupon', verifyToken, cartController.removeCoupon);

module.exports = router;
