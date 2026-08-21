#!/usr/bin/env node
/**
 * Quick test: manually trigger low-stock alerts for specific products
 * Usage: node scripts/test-stock-alert.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = require('../config/db');
const { checkAndAlertStock, ensureStockAlertSchema } = require('../services/stockAlert.service');

async function main() {
  console.log('=== Stock Alert Test ===\n');

  // 1. Ensure schema
  await ensureStockAlertSchema();
  console.log('✅ Schema ensured\n');

  // 2. Check current state of the 2 products
  const [products] = await pool.query(
    'SELECT id, name, stock_quantity, low_stock_threshold, critical_stock_threshold FROM products WHERE id IN (1550, 1555)'
  );
  console.log('Current product state:');
  products.forEach(p => {
    console.log(`  #${p.id} ${p.name} — stock: ${p.stock_quantity}, low: ${p.low_stock_threshold}, critical: ${p.critical_stock_threshold}`);
  });

  // 3. Check existing alerts
  const [alerts] = await pool.query(
    'SELECT * FROM stock_alerts WHERE product_id IN (1550, 1555) ORDER BY created_at DESC'
  );
  console.log(`\nExisting alerts: ${alerts.length}`);
  alerts.forEach(a => {
    console.log(`  product_id=${a.product_id} type=${a.alert_type} status=${a.status} stock_at_alert=${a.stock_at_alert}`);
  });

  // 4. Trigger check for both products
  console.log('\n--- Triggering checkAndAlertStock for product #1550 ---');
  const result1 = await checkAndAlertStock(pool, 1550);
  console.log('Result:', JSON.stringify(result1, null, 2));

  console.log('\n--- Triggering checkAndAlertStock for product #1555 ---');
  const result2 = await checkAndAlertStock(pool, 1555);
  console.log('Result:', JSON.stringify(result2, null, 2));

  // 5. Check alerts after
  const [alertsAfter] = await pool.query(
    'SELECT * FROM stock_alerts WHERE product_id IN (1550, 1555) ORDER BY created_at DESC'
  );
  console.log(`\nAlerts after trigger: ${alertsAfter.length}`);
  alertsAfter.forEach(a => {
    console.log(`  product_id=${a.product_id} type=${a.alert_type} status=${a.status} stock_at_alert=${a.stock_at_alert} sent=${a.first_alert_sent_at}`);
  });

  console.log('\n✅ Done! Check horrorramya2@gmail.com for emails.');
  await pool.end();
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
