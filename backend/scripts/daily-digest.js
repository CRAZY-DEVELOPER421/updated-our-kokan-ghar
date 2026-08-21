#!/usr/bin/env node
/**
 * Daily Business Digest — Standalone Script
 *
 * Usage:
 *   node scripts/daily-digest.js
 *
 * Connects to the existing database, fetches today's business metrics,
 * generates an HTML digest, and sends it to the configured admin email.
 *
 * Can be run manually for testing or scheduled via system cron:
 *   0 8 * * * cd /path/to/backend && node scripts/daily-digest.js >> /var/log/daily-digest.log 2>&1
 *
 * Timezone: Asia/Kolkata (IST) — the 08:00 schedule is in IST.
 */

const path = require('path');

// Load .env from project root (same as backend/server.js)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { sendDailyDigest } = require('../services/dailyDigest.service');

async function main() {
  console.log('========================================');
  console.log(' Daily Business Digest');
  console.log(' Started:', new Date().toISOString());
  console.log('========================================\n');

  try {
    const result = await sendDailyDigest();

    if (result.success) {
      console.log('\n========================================');
      console.log(' ✅ Digest sent successfully!');
      console.log(' To:', result.email);
      console.log(' Metrics:');
      console.log('   Orders:', result.metrics?.todayOrders ?? 'N/A');
      console.log('   Revenue:', `₹${result.metrics?.todayRevenue ?? 0}`);
      console.log('   Low Stock:', result.metrics?.lowStock?.length ?? 0);
      console.log('   Out of Stock:', result.metrics?.outOfStock?.length ?? 0);
      console.log('   Pending Orders:', result.metrics?.pendingOrders ?? 0);
      console.log('========================================');
      process.exit(0);
    } else {
      console.error('\n========================================');
      console.error(' ❌ Digest failed:', result.error);
      console.error('========================================');
      process.exit(1);
    }
  } catch (err) {
    console.error('\n========================================');
    console.error(' ❌ Unexpected error:', err.message);
    console.error('========================================');
    process.exit(1);
  }
}

main();
