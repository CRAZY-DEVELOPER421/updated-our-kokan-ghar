/**
 * Push Notification Service — Phase 4 Advanced
 * 
 * Features:
 *   - Rate limiting (max N pushes per user per day)
 *   - Campaign analytics (sent/delivered/clicked per campaign)
 *   - Region-based targeting
 *   - Rich notifications (action buttons + images)
 *   - Flash sale auto-push
 *   - Price-drop detection
 *   - Abandoned cart push
 *   - Dead subscription cleanup (410/404)
 */

const pool = require('../config/db');
const webpush = require('web-push');

// Configure VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@kokanghar.in',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

const MAX_PUSHES_PER_DAY = parseInt(process.env.MAX_PUSHES_PER_DAY, 10) || 5;
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();

// ─── Rate Limiting ─────────────────────────────────────────────

/**
 * Check if a user has exceeded their daily push limit.
 * @param {number} userId
 * @returns {Promise<boolean>} true if allowed, false if rate-limited
 */
async function isPushAllowed(userId) {
  const [rows] = await pool.query(
    'SELECT push_count FROM push_rate_limits WHERE user_id = ? AND push_date = CURDATE()',
    [userId]
  );
  if (rows.length === 0) return true;
  return rows[0].push_count < MAX_PUSHES_PER_DAY;
}

/**
 * Increment the push count for a user today.
 */
async function incrementPushCount(userId) {
  await pool.query(`
    INSERT INTO push_rate_limits (user_id, push_date, push_count)
    VALUES (?, CURDATE(), 1)
    ON DUPLICATE KEY UPDATE push_count = push_count + 1
  `, [userId]);
}

// ─── Analytics ─────────────────────────────────────────────────

/**
 * Create a campaign record and return its ID.
 */
async function createCampaign({ campaignType, title, body, url, imageUrl, targetRegion, targetUserId }) {
  const [result] = await pool.query(`
    INSERT INTO push_campaigns (campaign_type, title, body, url, image_url, target_region, target_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [campaignType || 'other', title, body || '', url || '/', imageUrl || null, targetRegion || null, targetUserId || null]);
  return result.insertId;
}

/**
 * Update campaign stats after a send batch.
 */
async function updateCampaignStats(campaignId, { sent, failed }) {
  await pool.query(`
    UPDATE push_campaigns
    SET total_sent = total_sent + ?, total_failed = total_failed + ?
    WHERE id = ?
  `, [sent, failed, campaignId]);
}

/**
 * Increment click count when a user clicks a notification.
 * Called from frontend when notification is clicked.
 */
async function trackClick(campaignId) {
  if (!campaignId) return;
  await pool.query('UPDATE push_campaigns SET total_clicked = total_clicked + 1 WHERE id = ?', [campaignId]);
}

/**
 * Get analytics summary for all campaigns.
 */
async function getCampaignAnalytics({ limit = 50, offset = 0, campaignType } = {}) {
  let where = '';
  const params = [];
  if (campaignType) {
    where = 'WHERE campaign_type = ?';
    params.push(campaignType);
  }
  params.push(limit, offset);

  const [rows] = await pool.query(`
    SELECT * FROM push_campaigns ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `, params);

  return rows;
}

// ─── Core Push Sending ─────────────────────────────────────────

/**
 * Send push to a single user with rate limiting + analytics.
 * @param {number} userId
 * @param {object} payload - { title, body, icon, image, url, actions, data, campaignId }
 * @param {object} options - { rateLimit: true, campaignId: null }
 * @returns {Promise<{ sent: number, failed: number, rateLimited: boolean }>}
 */
async function sendPushToUser(userId, payload, options = {}) {
  const { rateLimit = true, campaignId = null } = options;

  // Rate limit check
  if (rateLimit && userId) {
    const allowed = await isPushAllowed(userId);
    if (!allowed) {
      console.log(`[Push] Rate limited for user ${userId} — skipping`);
      return { sent: 0, failed: 0, rateLimited: true };
    }
  }

  // Get subscriptions for this user
  const [subscriptions] = await pool.query(
    'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = ?',
    [userId]
  );

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, rateLimited: false };
  }

  let sent = 0;
  let failed = 0;

  // Rich notification payload
  const pushPayload = JSON.stringify({
    title: payload.title || 'Kokan Ghar',
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-192x192.png',
    image: payload.image || null,       // Rich notification image
    url: payload.url || '/',
    actions: payload.actions || [       // Action buttons
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    data: {
      ...payload.data,
      campaignId: campaignId || payload.data?.campaignId || null,
      url: payload.url || '/',
      dateOfArrival: Date.now(),
    },
  });

  for (const sub of subscriptions) {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
    };

    try {
      await webpush.sendNotification(pushSubscription, pushPayload);
      sent++;
    } catch (err) {
      failed++;
      // Remove dead subscriptions
      if (err.statusCode === 410 || err.statusCode === 404) {
        await pool.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]).catch(() => {});
        console.log(`[Push] Removed expired subscription: ${sub.endpoint.substring(0, 50)}...`);
      } else {
        console.error(`[Push] Failed to send to user ${userId}:`, err.message);
      }
    }
  }

  // Increment rate limit
  if (rateLimit && userId && sent > 0) {
    await incrementPushCount(userId);
  }

  // Update campaign stats
  if (campaignId) {
    await updateCampaignStats(campaignId, { sent, failed });
  }

  return { sent, failed, rateLimited: false };
}

/**
 * Send push to multiple users (bulk).
 * @param {number[]} userIds
 * @param {object} payload
 * @param {object} options - { rateLimit: true, campaignType: 'other', campaignTitle: '' }
 */
async function sendBulkPush(userIds, payload, options = {}) {
  const { rateLimit = true, campaignType = 'other', campaignTitle = payload.title } = options;

  // Create campaign for tracking
  const campaignId = await createCampaign({
    campaignType,
    title: campaignTitle,
    body: payload.body,
    url: payload.url,
    imageUrl: payload.image,
  });

  let totalSent = 0;
  let totalFailed = 0;
  let totalRateLimited = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload, { rateLimit, campaignId });
    totalSent += result.sent;
    totalFailed += result.failed;
    if (result.rateLimited) totalRateLimited++;
  }

  console.log(`[Push] Bulk sent: ${totalSent} delivered, ${totalFailed} failed, ${totalRateLimited} rate-limited (campaign #${campaignId})`);
  return { sent: totalSent, failed: totalFailed, rateLimited: totalRateLimited, campaignId };
}

// ─── Flash Sale Push ───────────────────────────────────────────

/**
 * Send push to all subscribed users when a new flash sale goes live.
 * Rate-limited per user.
 */
async function sendFlashSalePush({ productId, productName, salePrice, originalPrice, endsAt, productImage }) {
  const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);

  // Get all subscribed users (with active subscriptions)
  const [users] = await pool.query(
    'SELECT DISTINCT user_id FROM push_subscriptions WHERE user_id IS NOT NULL'
  );

  if (users.length === 0) {
    console.log('[Push] No subscribed users for flash sale push');
    return { sent: 0, failed: 0 };
  }

  const userIds = users.map(u => u.user_id);
  const payload = {
    title: `⚡ Flash Sale — ${discount}% OFF!`,
    body: `${productName} now at ₹${salePrice} (was ₹${originalPrice})! Ends ${new Date(endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`,
    image: productImage || null,
    url: `/products/${productId}`,
    actions: [
      { action: 'open', title: '🛒 Shop Now' },
      { action: 'dismiss', title: 'Later' },
    ],
  };

  return sendBulkPush(userIds, payload, {
    rateLimit: true,
    campaignType: 'flash_sale',
    campaignTitle: `Flash Sale: ${productName}`,
  });
}

// ─── Price Drop Alert ──────────────────────────────────────────

/**
 * Check all watched products for price drops and send notifications.
 * Called after a product price is updated.
 */
async function checkPriceDrops(productId, newPrice) {
  const [watches] = await pool.query(
    'SELECT id, user_id, watched_price FROM product_watches WHERE product_id = ? AND notified = 0 AND watched_price > ?',
    [productId, newPrice]
  );

  if (watches.length === 0) return { notified: 0 };

  // Get product info
  const [products] = await pool.query(
    'SELECT name, slug FROM products WHERE id = ?',
    [productId]
  );
  const product = products[0];
  if (!product) return { notified: 0 };

  // Get product image
  const [images] = await pool.query(
    'SELECT image_url FROM product_images WHERE product_id = ? AND is_primary = 1 LIMIT 1',
    [productId]
  );
  const productImage = images[0]?.image_url || null;

  let notified = 0;
  for (const watch of watches) {
    const drop = Math.round(((watch.watched_price - newPrice) / watch.watched_price) * 100);
    const result = await sendPushToUser(watch.user_id, {
      title: `💰 Price Drop! ${drop}% OFF`,
      body: `${product.name} dropped from ₹${watch.watched_price} to ₹${newPrice}!`,
      image: productImage,
      url: `/products/${productId}`,
      actions: [
        { action: 'open', title: '🛒 Buy Now' },
        { action: 'dismiss', title: 'Later' },
      ],
    }, { rateLimit: true });

    if (result.sent > 0) {
      await pool.query('UPDATE product_watches SET notified = 1 WHERE id = ?', [watch.id]);
      notified++;
    }
  }

  if (notified > 0) {
    console.log(`[Push] Price drop: ${notified} users notified for product #${productId}`);
  }
  return { notified };
}

// ─── Region-Based Push ─────────────────────────────────────────

/**
 * Send push to users subscribed to a specific region.
 * @param {string} region - e.g. 'Goa', 'Devgad', 'Sindhudurg'
 * @param {object} payload
 */
async function sendRegionPush(region, payload) {
  const [users] = await pool.query(
    'SELECT DISTINCT user_id FROM push_subscriptions WHERE user_id IS NOT NULL AND region = ?',
    [region]
  );

  if (users.length === 0) {
    console.log(`[Push] No users subscribed to region: ${region}`);
    return { sent: 0, failed: 0 };
  }

  const userIds = users.map(u => u.user_id);
  return sendBulkPush(userIds, payload, {
    rateLimit: true,
    campaignType: 'region_offer',
    campaignTitle: `Region: ${region} — ${payload.title}`,
  });
}

// ─── Abandoned Cart Push ───────────────────────────────────────

/**
 * Send push reminders for abandoned carts.
 * Integrates with existing abandonedCart.service.js flow.
 */
async function sendAbandonedCartPush(userId, { cartItems, cartTotal, couponCode }) {
  const itemCount = cartItems?.length || 0;
  const itemNames = cartItems?.slice(0, 3).map(i => i.name).join(', ') || 'your items';

  const result = await sendPushToUser(userId, {
    title: '🛒 Your cart is waiting!',
    body: `${itemCount} item${itemCount !== 1 ? 's' : ''} (${itemNames}) — complete your order${couponCode ? ` with code ${couponCode}` : ''}!`,
    url: '/cart',
    actions: [
      { action: 'open', title: '🛒 Complete Order' },
      { action: 'dismiss', title: 'Not now' },
    ],
  }, { rateLimit: true });

  return result;
}

// ─── Product Watch (Price Drop) ────────────────────────────────

/**
 * Toggle product watch for a user.
 */
async function toggleProductWatch(userId, productId) {
  const [existing] = await pool.query(
    'SELECT id, watched_price FROM product_watches WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );

  if (existing.length > 0) {
    await pool.query('DELETE FROM product_watches WHERE id = ?', [existing[0].id]);
    return { watching: false, watchedPrice: existing[0].watched_price };
  }

  // Get current price
  const [products] = await pool.query('SELECT price FROM products WHERE id = ?', [productId]);
  if (products.length === 0) return { watching: false, error: 'Product not found' };

  const currentPrice = products[0].price;
  await pool.query(
    'INSERT INTO product_watches (user_id, product_id, watched_price) VALUES (?, ?, ?)',
    [userId, productId, currentPrice]
  );
  return { watching: true, watchedPrice: currentPrice };
}

/**
 * Get watch status for a product.
 */
async function getWatchStatus(userId, productId) {
  const [rows] = await pool.query(
    'SELECT id, watched_price FROM product_watches WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return rows.length > 0 ? { watching: true, watchedPrice: rows[0].watched_price } : { watching: false };
}

// ─── Broadcast (send to ALL subscribers) ───────────────────────

/**
 * Send a broadcast push notification to ALL subscribed users.
 * Sends in batches of 50 to avoid server overload.
 * Cleans up expired (410) and invalid (404) subscriptions.
 *
 * @param {object} payload - { title, body, imageUrl, clickUrl }
 * @returns {Promise<{ totalAttempted, successCount, expiredRemoved, failed }>>}
 */
async function sendPushToAll({ title, body, imageUrl, clickUrl }) {
  const BATCH_SIZE = 50;
  const BATCH_DELAY_MS = 200; // 200ms between batches

  // Fetch ALL subscriptions (no user_id filter)
  const [subscriptions] = await pool.query(
    'SELECT id, endpoint, p256dh_key, auth_key FROM push_subscriptions'
  );

  if (subscriptions.length === 0) {
    return { totalAttempted: 0, successCount: 0, expiredRemoved: 0, failed: 0 };
  }

  // Create campaign for analytics
  const campaignId = await createCampaign({
    campaignType: 'broadcast',
    title,
    body,
    url: clickUrl,
    imageUrl,
  });

  let successCount = 0;
  let expiredRemoved = 0;
  let failed = 0;
  const endpointsToRemove = [];

  // Process in batches
  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE);

    const promises = batch.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh_key, auth: sub.auth_key },
      };

      const pushPayload = JSON.stringify({
        title: title || 'Kokan Ghar',
        body: body || '',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        image: imageUrl || null,
        url: clickUrl || '/',
        actions: [
          { action: 'open', title: 'Open' },
          { action: 'dismiss', title: 'Dismiss' },
        ],
        data: {
          url: clickUrl || '/',
          campaignId,
          dateOfArrival: Date.now(),
        },
      });

      try {
        await webpush.sendNotification(pushSubscription, pushPayload);
        successCount++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          endpointsToRemove.push(sub.endpoint);
          expiredRemoved++;
        } else {
          failed++;
          console.error(`[Push] Broadcast failed for ${sub.endpoint.substring(0, 50)}...:`, err.message);
        }
      }
    });

    await Promise.all(promises);

    // Delay between batches (except after last batch)
    if (i + BATCH_SIZE < subscriptions.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  // Clean up expired/invalid subscriptions
  if (endpointsToRemove.length > 0) {
    await pool.query(
      'DELETE FROM push_subscriptions WHERE endpoint IN (?)',
      [endpointsToRemove]
    ).catch(() => {});
    console.log(`[Push] Broadcast: cleaned up ${expiredRemoved} expired subscriptions`);
  }

  // Update campaign stats
  await updateCampaignStats(campaignId, { sent: successCount, failed });

  console.log(`[Push] Broadcast #${campaignId}: ${successCount} delivered, ${expiredRemoved} expired removed, ${failed} failed (of ${subscriptions.length} total)`);

  return { totalAttempted: subscriptions.length, successCount, expiredRemoved, failed };
}

// ─── Exports ───────────────────────────────────────────────────

module.exports = {
  // Core
  sendPushToUser,
  sendBulkPush,
  // Rate limiting
  isPushAllowed,
  incrementPushCount,
  // Analytics
  createCampaign,
  updateCampaignStats,
  trackClick,
  getCampaignAnalytics,
  // Flash Sale
  sendFlashSalePush,
  // Price Drop
  checkPriceDrops,
  toggleProductWatch,
  getWatchStatus,
  // Region
  sendRegionPush,
  // Abandoned Cart
  sendAbandonedCartPush,
  // Broadcast
  sendPushToAll,
};
