#!/usr/bin/env node
/**
 * Abandoned Cart Recovery — Standalone Script
 *
 * Usage:
 *   node scripts/abandoned-cart-recovery.js
 *
 * Finds carts idle for 24+ hours, generates recovery coupons,
 * and sends reminder emails with discount codes.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { runAbandonedCartRecovery } = require('../services/abandonedCart.service');

async function main() {
  console.log('========================================');
  console.log(' Abandoned Cart Recovery');
  console.log(' Started:', new Date().toISOString());
  console.log('========================================\n');

  try {
    const result = await runAbandonedCartRecovery();

    if (result.success) {
      console.log('\n========================================');
      console.log(' ✅ Recovery sweep complete!');
      console.log(` Emails sent: ${result.sent}/${result.total || 0}`);
      console.log('========================================');
      process.exit(0);
    } else {
      console.error('\n========================================');
      console.error(' ❌ Recovery failed:', result.error);
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
