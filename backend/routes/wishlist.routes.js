const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get current user's wishlist items
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wishlist items with product details.
 */
router.get('/', verifyToken, wishlistController.getWishlist);

/**
 * @swagger
 * /wishlist/{productId}:
 *   post:
 *     summary: Add a product to wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Added to wishlist.
 *       400:
 *         description: Product already in wishlist.
 *       404:
 *         description: Product not found.
 */
router.post('/:productId', verifyToken, wishlistController.addToWishlist);

/**
 * @swagger
 * /wishlist/{productId}:
 *   delete:
 *     summary: Remove a product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Removed from wishlist.
 */
router.delete('/:productId', verifyToken, wishlistController.removeFromWishlist);

/**
 * @swagger
 * /wishlist/move-to-cart/{productId}:
 *   post:
 *     summary: Move wishlist item to cart
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Moved to cart.
 *       400:
 *         description: Product out of stock.
 *       404:
 *         description: Product not in wishlist or not found.
 */
router.post('/move-to-cart/:productId', verifyToken, wishlistController.moveToCart);

module.exports = router;
