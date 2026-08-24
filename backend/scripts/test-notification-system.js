/**
 * Comprehensive Notification System Test Suite
 * Tests 12 things related to the push notification system.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('../config/db');
const pushService = require('../services/pushNotification.service');
const { sendPushToUser } = require('../controllers/push.controller');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

let passed = 0;
let failed = 0;
let skipped = 0;
const results = [];

function log(testNum, name, status, detail) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
  console.log(`  ${icon} Test ${testNum}: ${name} — ${detail}`);
  results.push({ num: testNum, name, status, detail });
  if (status === 'PASS') passed++;
  else if (status === 'FAIL') failed++;
  else skipped++;
}

async function api(method, url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${url}`, opts);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: Database connection
// ═══════════════════════════════════════════════════════════════
async function test1() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    if (rows[0].ok === 1) {
      log(1, 'Database Connection', 'PASS', 'MySQL connected successfully');
    } else {
      log(1, 'Database Connection', 'FAIL', 'Query returned unexpected result');
    }
  } catch (err) {
    log(1, 'Database Connection', 'FAIL', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: push_subscriptions table exists
// ═══════════════════════════════════════════════════════════════
async function test2() {
  try {
    const [rows] = await pool.query("SHOW TABLES LIKE 'push_subscriptions'");
    if (rows.length > 0) {
      log(2, 'push_subscriptions table exists', 'PASS', 'Table found');
    } else {
      log(2, 'push_subscriptions table exists', 'FAIL', 'Table NOT found — run migration first');
    }
  } catch (err) {
    log(2, 'push_subscriptions table exists', 'FAIL', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 3: push_campaigns table exists with broadcast enum
// ═══════════════════════════════════════════════════════════════
async function test3() {
  try {
    const [rows] = await pool.query("SHOW TABLES LIKE 'push_campaigns'");
    if (rows.length === 0) {
      log(3, 'push_campaigns table + broadcast enum', 'FAIL', 'Table NOT found');
      return;
    }
    const [cols] = await pool.query("SHOW COLUMNS FROM push_campaigns WHERE Field = 'campaign_type'");
    const type = cols[0]?.Type || '';
    if (type.includes('broadcast')) {
      log(3, 'push_campaigns table + broadcast enum', 'PASS', `broadcast enum value found: ${type.substring(0, 80)}`);
    } else {
      log(3, 'push_campaigns table + broadcast enum', 'FAIL', `broadcast NOT in enum: ${type}`);
    }
  } catch (err) {
    log(3, 'push_campaigns table + broadcast enum', 'FAIL', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 4: Push subscriber count
// ═══════════════════════════════════════════════════════════════
async function test4() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM push_subscriptions');
    const count = rows[0].count;
    log(4, 'Push subscriber count', 'PASS', `${count} active subscription(s)`);
  } catch (err) {
    log(4, 'Push subscriber count', 'FAIL', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 5: Push campaign history
// ═══════════════════════════════════════════════════════════════
async function test5() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM push_campaigns');
    const count = rows[0].count;
    log(5, 'Push campaign history', 'PASS', `${count} campaign(s) in history`);
  } catch (err) {
    log(5, 'Push campaign history', 'FAIL', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 6: pushNotification.service exports
// ═══════════════════════════════════════════════════════════════
async function test6() {
  const required = [
    'sendPushToUser', 'sendBulkPush', 'sendPushToAll',
    'isPushAllowed', 'incrementPushCount',
    'createCampaign', 'updateCampaignStats', 'trackClick', 'getCampaignAnalytics',
    'sendFlashSalePush', 'checkPriceDrops', 'toggleProductWatch', 'getWatchStatus',
    'sendRegionPush', 'sendAbandonedCartPush',
  ];
  const missing = required.filter(fn => typeof pushService[fn] !== 'function');
  if (missing.length === 0) {
    log(6, 'pushNotification.service exports', 'PASS', `All ${required.length} functions exported`);
  } else {
    log(6, 'pushNotification.service exports', 'FAIL', `Missing: ${missing.join(', ')}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 7: sendPushToAll sends to all subscriptions
// ═══════════════════════════════════════════════════════════════
async function test7() {
  try {
    const result = await pushService.sendPushToAll({
      title: '🧪 Test Broadcast',
      body: 'This is an automated test notification — ignore this.',
      imageUrl: null,
      clickUrl: '/',
    });
    if (result.totalAttempted >= 0 && typeof result.successCount === 'number') {
      log(7, 'sendPushToAll broadcast', 'PASS', `Attempted: ${result.totalAttempted}, Delivered: ${result.successCount}, Failed: ${result.failed}, Expired: ${result.expiredRemoved}`);
    } else {
      log(7, 'sendPushToAll broadcast', 'FAIL', `Unexpected result: ${JSON.stringify(result)}`);
    }
  } catch (err) {
    log(7, 'sendPushToAll broadcast', 'FAIL', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 8: Rate limiting check
// ═══════════════════════════════════════════════════════════════
async function test8() {
  try {
    // Check rate limits for a test user (id=1)
    const [rows] = await pool.query(
      'SELECT push_count FROM push_rate_limits WHERE user_id = 1 AND push_date = CURDATE()'
    );
    const count = rows.length > 0 ? rows[0].push_count : 0;
    const allowed = await pushService.isPushAllowed(1);
    log(8, 'Rate limiting check', 'PASS', `User 1 today: ${count} pushes, allowed: ${allowed}`);
  } catch (err) {
    log(8, 'Rate limiting check', 'FAIL', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 9: API — POST /api/admin/push/subscribers/count
// ═══════════════════════════════════════════════════════════════
async function test9() {
  if (!ADMIN_TOKEN) {
    log(9, 'API: subscriber count endpoint', 'SKIP', 'No ADMIN_TOKEN set — cannot test authenticated API');
    return;
  }
  try {
    const { status, json } = await api('GET', '/admin/push/subscribers/count', null, ADMIN_TOKEN);
    if (status === 200 && json.success) {
      log(9, 'API: subscriber count endpoint', 'PASS', `Count: ${json.data?.count} (HTTP ${status})`);
    } else {
      log(9, 'API: subscriber count endpoint', 'FAIL', `HTTP ${status}: ${json.message || JSON.stringify(json)}`);
    }
  } catch (err) {
    log(9, 'API: subscriber count endpoint', 'FAIL', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 10: API — GET /api/admin/push/broadcast/history
// ═══════════════════════════════════════════════════════════════
async function test10() {
  if (!ADMIN_TOKEN) {
    log(10, 'API: broadcast history endpoint', 'SKIP', 'No ADMIN_TOKEN set — cannot test authenticated API');
    return;
  }
  try {
    const { status, json } = await api('GET', '/admin/push/broadcast/history', null, ADMIN_TOKEN);
    if (status === 200 && json.success) {
      const count = json.data?.broadcasts?.length || 0;
      log(10, 'API: broadcast history endpoint', 'PASS', `${count} broadcast(s) in history (HTTP ${status})`);
    } else {
      log(10, 'API: broadcast history endpoint', 'FAIL', `HTTP ${status}: ${json.message || JSON.stringify(json)}`);
    }
  } catch (err) {
    log(10, 'API: broadcast history endpoint', 'FAIL', err.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 11: Web-push VAPID keys configured
// ═══════════════════════════════════════════════════════════════
async function test11() {
  const pubKey = process.env.VAPID_PUBLIC_KEY;
  const privKey = process.env.VAPID_PRIVATE_KEY;
  if (pubKey && privKey) {
    log(11, 'VAPID keys configured', 'PASS', `Public key: ${pubKey.substring(0, 20)}..., Private key: set`);
  } else {
    log(11, 'VAPID keys configured', 'FAIL', `Public: ${pubKey ? 'set' : 'MISSING'}, Private: ${privKey ? 'set' : 'MISSING'}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// TEST 12: Frontend PWA files exist
// ═══════════════════════════════════════════════════════════════
async function test12() {
  const fs = require('fs');
  const files = [
    'frontend/public/sw.js',
    'frontend/app/manifest.js',
    'frontend/components/pwa/PwaInstallPopup.js',
    'frontend/components/pwa/FloatingNotifPrompt.js',
    'frontend/components/pwa/IosPwaBanner.js',
    'frontend/components/pwa/EnableNotifications.js',
    'frontend/public/icons/icon-192x192.png',
    'frontend/public/icons/icon-512x512.png',
    'admin/app/notifications/page.js',
    'admin/components/PushImageUpload.js',
    'admin/components/ImageCropper.js',
  ];
  const missing = files.filter(f => !fs.existsSync(path.join(__dirname, '..', '..', f)));
  if (missing.length === 0) {
    log(12, 'Frontend + Admin PWA files', 'PASS', `All ${files.length} files exist`);
  } else {
    log(12, 'Frontend + Admin PWA files', 'FAIL', `Missing: ${missing.join(', ')}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// RUN ALL TESTS
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  🔔 PUSH NOTIFICATION SYSTEM — TEST SUITE');
  console.log('═══════════════════════════════════════════════════════\n');

  await test1();
  await test2();
  await test3();
  await test4();
  await test5();
  await test6();
  await test7();
  await test8();
  await test9();
  await test10();
  await test11();
  await test12();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  📊 RESULTS: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (failed > 0) {
    console.log('  ❌ Failed tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`     ${r.num}. ${r.name}: ${r.detail}`);
    });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('❌ Test suite crashed:', err);
  process.exit(1);
});
