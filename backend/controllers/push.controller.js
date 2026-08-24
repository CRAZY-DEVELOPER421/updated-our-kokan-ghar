const pool = require('../config/db');
const webpush = require('web-push');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:support@kokanghar.in',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

/**
 * POST /api/push/subscribe
 * Save or update a push subscription.
 * Supports both logged-in users (user_id from token) and guests (user_id = null).
 */
const subscribe = asyncHandler(async (req, res) => {
  const { endpoint, p256dh, auth, device_info } = req.body;

  if (!endpoint || !p256dh || !auth) {
    return ApiResponse.error(res, 'Missing required fields: endpoint, p256dh, auth.', 400);
  }

  const userId = req.user ? req.user.id : null;

  // Upsert: if endpoint already exists, update user_id and device_info
  const sql = `
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, device_info, created_at)
    VALUES (?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      device_info = VALUES(device_info),
      created_at = NOW()
  `;

  await pool.query(sql, [userId, endpoint, p256dh, auth, device_info || null]);

  return ApiResponse.created(res, {}, 'Push subscription saved successfully.');
});

/**
 * POST /api/push/unsubscribe
 * Remove a push subscription by endpoint.
 */
const unsubscribe = asyncHandler(async (req, res) => {
  const { endpoint } = req.body;

  if (!endpoint) {
    return ApiResponse.error(res, 'Missing required field: endpoint.', 400);
  }

  await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint]);

  return ApiResponse.success(res, {}, 'Push subscription removed.');
});

/**
 * Helper: Send push notification to a specific user.
 * Reads all subscriptions for that user and sends to each.
 * Silently removes expired (410) or invalid (404) subscriptions.
 *
 * @param {number} userId
 * @param {object} payload - { title, body, icon, url, ... }
 * @returns {Promise<{ sent: number, failed: number }>}
 */
async function sendPushToUser(userId, payload) {
  const [subscriptions] = await pool.query(
    'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = ?',
    [userId]
  );

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  const pushPayload = JSON.stringify({
    title: payload.title || 'Kokan Ghar',
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-192x192.png',
    url: payload.url || '/',
    data: payload.data || {},
  });

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh_key,
        auth: sub.auth_key,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, pushPayload);
      sent++;
    } catch (err) {
      failed++;
      // 410 = Gone (unsubscribed), 404 = Not Found (expired)
      // Remove dead subscriptions silently
      if (err.statusCode === 410 || err.statusCode === 404) {
        await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint])
          .catch(() => {}); // ignore delete errors
        console.log(`[Push] Removed expired subscription for user ${userId}: ${sub.endpoint.substring(0, 50)}...`);
      } else {
        console.error(`[Push] Failed to send to user ${userId}:`, err.message);
      }
    }
  }

  return { sent, failed };
}

/**
 * POST /api/push/test
 * Admin-only: send a test push notification to the current user.
 */
const testPush = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { title, body, url } = req.body;

  const result = await sendPushToUser(userId, {
    title: title || '🔔 Test Notification',
    body: body || 'This is a test push from Kokan Ghar!',
    url: url || '/',
  });

  if (result.sent === 0) {
    return ApiResponse.error(res, 'No active subscriptions found. Please enable notifications first.', 404);
  }

  return ApiResponse.success(res, result, `Test push sent: ${result.sent} delivered, ${result.failed} failed.`);
});

module.exports = {
  subscribe,
  unsubscribe,
  sendPushToUser,
  testPush,
};
