/**
 * Loyalty Points Redeem at Checkout — end-to-end test.
 *
 * Prereqs:
 *   1. Migration applied: mysql konkan_bazaar < database/loyalty_redeem_migration.sql
 *   2. Backend running with this code: PORT=5199 node backend/server.js
 *
 * Run:
 *   node backend/scripts/test-loyalty-redeem.js
 *
 * The script creates a throwaway user + order, verifies the full redeem flow
 * (insufficient-points rejection, discount math, deduction, cancellation
 * refund) and then cleans up all test data.
 */
'use strict';

const BASE = process.env.TEST_API_BASE || 'http://127.0.0.1:5199/api';
const pool = require('../config/db');
const { refundPoints, POINTS_PER_RUPEE } = require('../services/loyalty.service');

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
  const email = `loyalty-test-${Date.now()}@example.com`;
  const phone = `91${String(Date.now()).slice(-8)}`; // unique per run (phone is globally unique now)
  let userId = null;

  try {
    console.log('\n── 1. Register + login test user ──');
    const reg = await j('/auth/register', {
      method: 'POST',
      body: { name: 'Loyalty Test', email, password: 'Test@1234', phone },
    });
    assert(reg.status === 201, `register → ${reg.status}`);
    userId = reg.data?.data?.user?.id;
    const token = reg.data?.data?.accessToken;
    assert(!!userId && !!token, 'got user id + access token');

    console.log('\n── 2. Seed 1000 loyalty points ──');
    const seed = await refundPoints(userId, 1000, 'test seed');
    assert(seed.success, 'seeded 1000 points');
    const [l0] = await pool.query('SELECT total_points FROM user_loyalty WHERE user_id = ?', [userId]);
    assert(Number(l0[0].total_points) === 1000, `balance = 1000 (got ${l0[0].total_points})`);

    console.log('\n── 3. Add product to cart + address ──');
    const prods = await j('/products?limit=3');
    const product = prods.data?.data?.products?.[0];
    assert(!!product?.id && product.stock_quantity > 0, `found product #${product?.id}`);
    const add = await j('/cart/items', { method: 'POST', token, body: { product_id: product.id, quantity: 1 } });
    assert(add.status === 201 || (add.status === 200 && add.data?.success), `add to cart → ${add.status}`);

    const addr = await j('/users/addresses', {
      method: 'POST',
      token,
      body: { name: 'Loyalty Test', phone, house_no: '1', street: 'Test St', city: 'Mapusa', state: 'Goa', pincode: '403507', is_default: true, address_type: 'home' },
    });
    assert(addr.status === 201 || (addr.status === 200 && addr.data?.success), `create address → ${addr.status}`);
    const addressId = addr.data?.data?.address?.id || addr.data?.data?.id;

    const cart = await j('/cart', { token });
    const summary = cart.data?.data?.summary;
    const subtotal = summary?.subtotal || 0;
    const couponDiscount = summary?.coupon_discount || 0;
    const maxDiscount = Math.max(subtotal - couponDiscount, 0);
    assert(subtotal > 0, `cart subtotal = ₹${subtotal}`);

    console.log('\n── 4. Reject insufficient points (999999 requested) ──');
    const bad = await j('/orders/create', { method: 'POST', token, body: { address_id: addressId, payment_method: 'cod', points_to_redeem: 999999 } });
    assert(bad.status === 400, `insufficient points → ${bad.status} (${bad.data?.message || 'no msg'})`);

    console.log('\n── 5. Redeem 1000 points on COD order ──');
    const ptsToRedeem = Math.min(1000, Math.floor(maxDiscount / 10) * 100);
    const expectedDiscount = Math.floor(ptsToRedeem / 100) * 10;
    const order = await j('/orders/create', { method: 'POST', token, body: { address_id: addressId, payment_method: 'cod', points_to_redeem: ptsToRedeem } });
    assert(order.status === 201, `create order → ${order.status}`);
    const orderId = order.data?.data?.order_id;

    const [orow] = await pool.query(
      'SELECT points_used, points_discount, total_amount, discount_amount FROM orders WHERE id = ?',
      [orderId]
    );
    assert(Number(orow[0].points_used) === ptsToRedeem, `order.points_used = ${orow[0].points_used} (want ${ptsToRedeem})`);
    assert(Math.abs(Number(orow[0].points_discount) - expectedDiscount) < 0.01, `order.points_discount = ₹${orow[0].points_discount} (want ₹${expectedDiscount})`);
    const shipping = subtotal >= 499 ? 0 : 49;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const expectedTotal = Math.round(Math.max(subtotal - couponDiscount - expectedDiscount + shipping + tax, 0) * 100) / 100;
    assert(Math.abs(Number(orow[0].total_amount) - expectedTotal) < 0.01, `order.total_amount = ₹${orow[0].total_amount} (want ₹${expectedTotal})`);
    assert(Math.abs(Number(orow[0].discount_amount) - (couponDiscount + expectedDiscount)) < 0.01, 'discount_amount = coupon + points');

    const earned = Math.floor(Number(orow[0].total_amount) / POINTS_PER_RUPEE);
    const [l1] = await pool.query('SELECT total_points FROM user_loyalty WHERE user_id = ?', [userId]);
    const expectedBalance1 = 1000 - ptsToRedeem + earned;
    assert(Number(l1[0].total_points) === expectedBalance1, `balance after order = ${l1[0].total_points} (want ${expectedBalance1})`);

    console.log('\n── 6. Cancel → points refunded ──');
    const cancel = await j(`/orders/${orderId}/cancel`, { method: 'PUT', token });
    assert(cancel.status === 200, `cancel → ${cancel.status}`);
    const [l2] = await pool.query('SELECT total_points FROM user_loyalty WHERE user_id = ?', [userId]);
    const expectedBalance2 = expectedBalance1 + ptsToRedeem;
    assert(Number(l2[0].total_points) === expectedBalance2, `balance after cancel = ${l2[0].total_points} (want ${expectedBalance2})`);

    console.log('\n── 7. Cap scenario: redeem more points than item cost ──');
    await refundPoints(userId, 2000, 'test seed 2'); // balance → 1015 + 2000 = 3015
    const add2 = await j('/cart/items', { method: 'POST', token, body: { product_id: product.id, quantity: 1 } });
    assert(add2.status === 200 || add2.status === 201, `re-add to cart → ${add2.status}`);

    const order2 = await j('/orders/create', { method: 'POST', token, body: { address_id: addressId, payment_method: 'cod', points_to_redeem: 3000 } });
    assert(order2.status === 201, `create order (cap) → ${order2.status}`);
    const order2Id = order2.data?.data?.order_id;
    const [o2] = await pool.query('SELECT points_used, points_discount, total_amount FROM orders WHERE id = ?', [order2Id]);
    // 3000 pts → ₹300 discount, but capped at item cost ₹200 → only 2000 pts used, 1000 refunded.
    assert(Number(o2[0].points_used) === 2000, `capped points_used = ${o2[0].points_used} (want 2000)`);
    assert(Math.abs(Number(o2[0].points_discount) - 200) < 0.01, `capped points_discount = ₹${o2[0].points_discount} (want ₹200)`);
    const earned2 = Math.floor(Number(o2[0].total_amount) / POINTS_PER_RUPEE);
    const [l3] = await pool.query('SELECT total_points FROM user_loyalty WHERE user_id = ?', [userId]);
    // Redeem 3000 → balance 3015−3000=15, then excess 1000 refunded → 1015, then +earned2.
    // Net points used on the order = 2000 (as recorded), so: 3015 − 2000 + earned2.
    const expectedBalance3 = 3015 - 2000 + earned2;
    assert(Number(l3[0].total_points) === expectedBalance3, `balance after cap = ${l3[0].total_points} (want ${expectedBalance3})`);

    const cancel2 = await j(`/orders/${order2Id}/cancel`, { method: 'PUT', token });
    assert(cancel2.status === 200, `cancel capped order → ${cancel2.status}`);
    const [l4] = await pool.query('SELECT total_points FROM user_loyalty WHERE user_id = ?', [userId]);
    assert(Number(l4[0].total_points) === expectedBalance3 + 2000, `balance after cap-cancel = ${l4[0].total_points} (want ${expectedBalance3 + 2000})`);

    console.log('\n── 8. History has earned + redeemed + refund entries ──');
    const [hist] = await pool.query(
      "SELECT type, SUM(points) AS pts FROM loyalty_points WHERE user_id = ? GROUP BY type",
      [userId]
    );
    const map = Object.fromEntries(hist.map((r) => [r.type, Number(r.pts)]));
    assert(map.earned >= 1000 + earned, `earned entries ≥ ${1000 + earned} (got ${map.earned})`);
    // order1 redeemed -ptsToRedeem, order2 redeemed -3000 (before the cap refund)
    assert(map.redeemed === -(ptsToRedeem + 3000), `redeemed = -${ptsToRedeem + 3000} (got ${map.redeemed})`);

    console.log('\n── ✅ ALL CHECKS DONE ──');
  } catch (err) {
    failed++;
    console.error('  ❌ Unexpected error:', err.message);
  } finally {
    // Cleanup: remove test order first (orders FK RESTRICT on user delete), then the user.
    try {
      await pool.query('DELETE FROM orders WHERE user_id = ?', [userId]);
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);
      console.log('\n  🧹 Test data cleaned up.');
    } catch (cleanErr) {
      console.error('  ⚠️ Cleanup failed (manual):', cleanErr.message);
    }
    console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
    try { await pool.end(); } catch {} // close pool before exiting (avoids libuv noise on Windows)
    process.exit(failed > 0 ? 1 : 0);
  }
})();
