const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats including users, products, orders, revenue, and recent orders.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Admin only.
 */
router.get('/dashboard', verifyToken, isAdmin, analyticsController.getDashboard);

/**
 * @swagger
 * /analytics/top-products:
 *   get:
 *     summary: Get top selling products (top 20)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top products sorted by total_sold.
 */
router.get('/top-products', verifyToken, isAdmin, analyticsController.getTopProducts);

/**
 * @swagger
 * /analytics/category-performance:
 *   get:
 *     summary: Get category performance by revenue and units sold
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category performance data.
 */
router.get('/category-performance', verifyToken, isAdmin, analyticsController.getCategoryPerformance);

/**
 * @swagger
 * /analytics/search-terms:
 *   get:
 *     summary: Get top search terms (last 30 days, top 50)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trending search terms with counts.
 */
router.get('/search-terms', verifyToken, isAdmin, analyticsController.getSearchTerms);

module.exports = router;
