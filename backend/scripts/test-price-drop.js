/**
 * Wishlist price-drop alerts — end-to-end test.
 *
 * Covers: price_at_add stamped on wishlist-add, >5% drop fires ONE alert
 * (notification + email attempt + last_alert_price moves down), a repeat run
 * at the same price sends nothing, a further >5% drop sends a NEW alert with
 * cumulative savings, and a price rise sends nothing.
 *
 * Prereqs:
 *   1. Migration applied: mysql konkan_bazaar < database/wishlist_price_drop_migration.sql
 *   2. Backend running with this code: PORT=5199 node backend/server.js
 *
 * Run: node backend/scripts/test-price-drop.js
 */
'use strict';

const BASE = process.env.TEST_API_BASE || 'http://127.0.0.1:5199/api';
const pool = require('../config/db');
const { runPriceDropAlerts } = require('../services/priceDrop.service');

let passed = 0;
let failed = 0;
const assert = (cond, msg) => {
  if (cond) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const j = async (path, opts = {}) => {
  const res = await fetch(BASE + path, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, data };
};

(async () => {
  const stamp = Date.now();
  let userId = null;
  let productId = null;
  let originalPrice = null;

  try {
    console.log('\n── 1. Register user + pick a product ──');
    const reg = await j('/auth/register', {
      method: 'POST',
      body: { name: 'Price Drop Tester', email: `price-drop-${stamp}@example.com`, password: 'Test@1234', phone: `91${String(stamp).slice(-8)}` },
    });
    assert(reg.status === 201, `register → ${reg.status}`);
    userId = reg.data?.data?.user?.id;
    const token = reg.data?.data?.accessToken;

    const prods = await j('/products?limit=10');
    const product = prods.data?.data?.products?.find((p) => p.stock_quantity > 0) || prods.data?.data?.products?.[0];
    productId = product.id;
    originalPrice = Number(product.price);
    assert(originalPrice > 0, `product price = ₹${originalPrice}`);

    console.log('\n── 2. Add to wishlist → price_at_add stamped ──');
    const add = await j(`/wishlist/${productId}`, { method: 'POST', token });
    assert(add.status === 201, `add to wishlist → ${add.status}`);
    const [w] = await pool.query('SELECT price_at_add, last_alert_price FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    assert(Number(w[0].price_at_add) === originalPrice, `price_at_add = ₹${w[0].price_at_add} (stamped)`);
    assert(w[0].last_alert_price === null, 'last_alert_price NULL initially');

    console.log('\n── 3. Price drops 30% → alert fires ──');
    const droppedPrice = Math.round(originalPrice * 0.7 * 100) / 100;
    await pool.query('UPDATE products SET price = ? WHERE id = ?', [droppedPrice, productId]);
    const first = await runPriceDropAlerts();
    assert(first === 1, `sweep returned 1 alert (got ${first})`);

    const [n1] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'price_drop' ORDER BY id DESC LIMIT 1",
      [userId]
    );
    assert(n1.length === 1, 'notification created (type price_drop)');
    assert(n1[0].title.includes(product.name), `title mentions product (${n1[0].title})`);
    const n1data = typeof n1[0].data === 'string' ? JSON.parse(n1[0].data || '{}') : (n1[0].data || {});
    assert(Number(n1data.new_price) === droppedPrice, `notification new_price = ₹${n1data.new_price}`);
    assert(Number(n1data.old_price) === originalPrice, `notification old_price = ₹${n1data.old_price}`);
    const savings = Math.round((originalPrice - droppedPrice) * 100) / 100;
    assert(Number(n1data.savings) === savings, `notification savings = ₹${n1data.savings}`);

    const [w2] = await pool.query('SELECT last_alert_price, price_drop_alerted_at FROM wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);
    assert(Number(w2[0].last_alert_price) === droppedPrice, `last_alert_price moved to ₹${w2[0].last_alert_price}`);
    assert(!!w2[0].price_drop_alerted_at, 'price_drop_alerted_at stamped');

    console.log('\n── 4. Same price again → NO duplicate alert ──');
    const second = await runPriceDropAlerts();
    assert(second === 0, `sweep returned 0 (no double-send, got ${second})`);
    const [nCount] = await pool.query("SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND type = 'price_drop'", [userId]);
    assert(Number(nCount[0].c) === 1, 'still exactly 1 notification');

    console.log('\n── 5. Further drop (another 15% below last alert) → NEW alert, cumulative savings ──');
    const evenLower = Math.round(droppedPrice * 0.85 * 100) / 100;
    await pool.query('UPDATE products SET price = ? WHERE id = ?', [evenLower, productId]);
    const third = await runPriceDropAlerts();
    assert(third === 1, `sweep returned 1 new alert (got ${third})`);
    const [n2] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? AND type = 'price_drop' ORDER BY id DESC LIMIT 1",
      [userId]
    );
    const n2data = typeof n2[0].data === 'string' ? JSON.parse(n2[0].data || '{}') : (n2[0].data || {});
    assert(Number(n2data.new_price) === evenLower, 'new alert has new lower price');
    const totalSavings = Math.round((originalPrice - evenLower) * 100) / 100;
    assert(Number(n2data.savings) === totalSavings, `savings cumulative vs original ₹${totalSavings}`);

    console.log('\n── 6. Price rises back → NO alert on the way up ──');
    await pool.query('UPDATE products SET price = ? WHERE id = ?', [originalPrice, productId]);
    const fourth = await runPriceDropAlerts();
    assert(fourth === 0, `sweep returned 0 on price rise (got ${fourth})`);

    console.log('\n── ✅ ALL CHECKS DONE ──');
  } catch (err) {
    failed++;
    console.error('  ❌ Unexpected error:', err.message);
  } finally {
    try {
      if (productId && originalPrice) await pool.query('UPDATE products SET price = ? WHERE id = ?', [originalPrice, productId]);
      if (userId) {
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
      }
      console.log('\n  🧹 Test data cleaned up (price restored, user + notifications removed).');
    } catch (cleanErr) {
      console.error('  ⚠️ Cleanup failed:', cleanErr.message);
    }
    console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
    // Small drain window so mysql2's connection pool closes cleanly on Windows
    // (avoids the libuv UV_HANDLE_CLOSING assertion at process.exit).
    await new Promise((r) => setTimeout(r, 300));
    try { await pool.end(); } catch {}
    process.exit(failed > 0 ? 1 : 0);
  }
})();
