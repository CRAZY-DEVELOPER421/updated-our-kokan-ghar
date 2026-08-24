/**
 * One-off script: Send a maintenance broadcast push notification to all subscribers.
 * Usage: node scripts/broadcast-maintenance.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pushService = require('../services/pushNotification.service');

async function main() {
  console.log('🔔 Sending maintenance broadcast push to all subscribers...\n');

  const result = await pushService.sendPushToAll({
    title: '🔧 Website Maintenance Notice',
    body: 'Kokan Ghar website is currently under maintenance. We will be back in 2 days. Thank you for your patience! 🙏',
    imageUrl: null,
    clickUrl: '/',
  });

  console.log('\n✅ Broadcast complete!');
  console.log(`   Total subscriptions: ${result.totalAttempted}`);
  console.log(`   Delivered:           ${result.successCount}`);
  console.log(`   Expired removed:     ${result.expiredRemoved}`);
  console.log(`   Failed:              ${result.failed}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Broadcast failed:', err.message);
  process.exit(1);
});
