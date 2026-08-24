/**
 * Advanced Push Notification Routes — Phase 4
 * 
 * POST /api/push/campaign       — Admin: send push campaign (manual/region-targeted)
 * GET  /api/push/campaigns      — Admin: get campaign analytics
 * POST /api/push/click          — Track notification click
 * POST /api/push/watch          — User: toggle product watch (price drop)
 * GET  /api/push/watch/:productId — User: get watch status
 * GET  /api/push/badge          — User: get unread badge count
 * POST /api/push/region         — Admin: send region-specific push
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken, isAdmin } = require('../middleware/auth');
const pushService = require('../services/pushNotification.service');

// ─── Admin: Send manual campaign push ──────────────────────────

/**
 * @swagger
 * /push/campaign:
 *   post:
 *     summary: Send a push campaign to all users or region-specific
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
 *               image: { type: string }
 *               region: { type: string, description: "Target region (optional)" }
 */
router.post('/campaign', verifyToken, isAdmin, asyncHandler(async (req, res) => {
  const { title, body, url, image, region } = req.body;

  if (!title) {
    return ApiResponse.error(res, 'Title is required.', 400);
  }

  let result;

  if (region) {
    // Region-specific push
    result = await pushService.sendRegionPush(region, {
      title,
      body: body || '',
      image: image || null,
      url: url || '/',
      actions: [
        { action: 'open', title: '🛒 Shop Now' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    });
  } else {
    // Broadcast to all subscribed users
    const [users] = await pool.query(
      'SELECT DISTINCT user_id FROM push_subscriptions WHERE user_id IS NOT NULL'
    );
    const userIds = users.map(u => u.user_id);

    result = await pushService.sendBulkPush(userIds, {
      title,
      body: body || '',
      image: image || null,
      url: url || '/',
      actions: [
        { action: 'open', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    }, {
      rateLimit: true,
      campaignType: 'manual',
      campaignTitle: title,
    });
  }

  return ApiResponse.success(res, result, `Campaign sent: ${result.sent} delivered.`);
}));

// ─── Admin: Get campaign analytics ─────────────────────────────

router.get('/campaigns', verifyToken, isAdmin, asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0, type } = req.query;
  const campaigns = await pushService.getCampaignAnalytics({
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    campaignType: type,
  });
  return ApiResponse.success(res, { campaigns });
}));

// ─── Track notification click ──────────────────────────────────

router.post('/click', asyncHandler(async (req, res) => {
  const { campaignId } = req.body;
  if (campaignId) {
    await pushService.trackClick(campaignId);
  }
  return ApiResponse.success(res, {}, 'Click tracked.');
}));

// ─── User: Toggle product watch (price drop) ───────────────────

router.post('/watch', verifyToken, asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId) {
    return ApiResponse.error(res, 'Product ID is required.', 400);
  }

  const result = await pushService.toggleProductWatch(req.user.id, productId);
  if (result.error) {
    return ApiResponse.error(res, result.error, 404);
  }

  return ApiResponse.success(res, result, result.watching ? 'Watching for price drops.' : 'Stopped watching.');
}));

router.get('/watch/:productId', verifyToken, asyncHandler(async (req, res) => {
  const result = await pushService.getWatchStatus(req.user.id, req.params.productId);
  return ApiResponse.success(res, result);
}));

// ─── User: Get badge count ─────────────────────────────────────

router.get('/badge', verifyToken, asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.user.id]
  );
  return ApiResponse.success(res, { count: rows[0].count });
}));

module.exports = router;
