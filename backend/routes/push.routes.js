const express = require('express');
const router = express.Router();
const pushController = require('../controllers/push.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * /push/subscribe:
 *   post:
 *     summary: Save a push subscription
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint, p256dh, auth]
 *             properties:
 *               endpoint: { type: string }
 *               p256dh: { type: string }
 *               auth: { type: string }
 *               device_info: { type: string }
 *     responses:
 *       201:
 *         description: Subscription saved.
 */
router.post('/subscribe', optionalAuth, pushController.subscribe);

/**
 * @swagger
 * /push/unsubscribe:
 *   post:
 *     summary: Remove a push subscription
 *     tags: [Push Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [endpoint]
 *             properties:
 *               endpoint: { type: string }
 *     responses:
 *       200:
 *         description: Subscription removed.
 */
router.post('/unsubscribe', pushController.unsubscribe);

/**
 * @swagger
 * /push/test:
 *   post:
 *     summary: Send a test push notification to the current user
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               body: { type: string }
 *               url: { type: string }
 *     responses:
 *       200:
 *         description: Test push sent.
 */
router.post('/test', verifyToken, pushController.testPush);

module.exports = router;
