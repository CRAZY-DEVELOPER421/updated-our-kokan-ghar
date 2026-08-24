/**
 * Manual test: send a push notification to all subscribed users.
 * Run: node scripts/test-push.js
 *
 * Prerequisites:
 * 1. Backend server running (or just run this — it uses the DB directly)
 * 2. At least one user has enabled notifications via the frontend
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const pool = require('../config/db');
const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:support@kokanghar.in',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function testPush() {
  console.log('🔍 Checking for subscriptions...\n');

  const [subs] = await pool.query(
    'SELECT id, user_id, endpoint, created_at FROM push_subscriptions ORDER BY created_at DESC'
  );

  if (subs.length === 0) {
    console.log('❌ No subscriptions found in the database.');
    console.log('');
    console.log('👉 To subscribe:');
    console.log('   1. Open http://localhost:3000 in Chrome');
    console.log('   2. Scroll down and click "Enable Notifications"');
    console.log('   3. Allow the permission prompt');
    console.log('   4. Run this script again');
    await pool.end();
    return;
  }

  console.log(`📋 Found ${subs.length} subscription(s):\n`);
  subs.forEach((s, i) => {
    console.log(`   ${i + 1}. User ID: ${s.user_id || 'guest'} | Endpoint: ${s.endpoint.substring(0, 60)}...`);
  });

  console.log('\n🚀 Sending test push notification...\n');

  const payload = JSON.stringify({
    title: '🦐 Kokan Ghar — Test Notification!',
    body: 'Push notifications are working! You\'ll get alerts for flash sales & order updates.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    url: '/',
  });

  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const sub of subs) {
    try {
      // Get full subscription details
      const [fullSub] = await pool.query(
        'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE id = ?',
        [sub.id]
      );

      if (fullSub.length === 0) continue;

      const pushSubscription = {
        endpoint: fullSub[0].endpoint,
        keys: {
          p256dh: fullSub[0].p256dh_key,
          auth: fullSub[0].auth_key,
        },
      };

      await webpush.sendNotification(pushSubscription, payload);
      sent++;
      console.log(`   ✅ Sent to user ${sub.user_id || 'guest'}`);
    } catch (err) {
      failed++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = ?', [sub.id]);
        removed++;
        console.log(`   🗑️  Removed expired subscription (user ${sub.user_id || 'guest'})`);
      } else {
        console.log(`   ❌ Failed for user ${sub.user_id || 'guest'}: ${err.message}`);
      }
    }
  }

  console.log(`\n📊 Results: ${sent} sent, ${failed} failed, ${removed} expired subscriptions removed`);
  await pool.end();
}

testPush().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
