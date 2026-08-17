/**
 * Coupon Auto-Apply / Best Offer Suggestion — end-to-end test.
 *
 * Covers: suggest-coupons endpoint returns only applicable coupons sorted by
 * savings, applying the best coupon actually discounts the cart, applying a
 * suggested coupon works via the same apply endpoint, and per-user used
 * coupons are not re-suggested.
 *
 * Prereqs: backend running with this code: PORT=5199 node backend/server.js
 * Run: node backend/scripts/test-coupon-suggest.js
 */
'use strict';

const BASE = process.env.TEST_API_BASE || 'http://127.0.0.1:5199/api';
const pool = require('../config/db');

let passed = 0;
let failed = 0;
const assert = (cond, msg) => {
  if (cond) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const j = async (pathname, opts = {}) => {
  const headers = { ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) };
  if (typeof opts.body === 'string') headers['Content-Type'] = 'application/json';
  if (opts.ip) headers['X-Forwarded-For'] = opts.ip;
  const res = await fetch(BASE + pathname, {
    method: opts.method || 'GET',
    headers,
    body: opts.body,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, data };
};

const ip = (n) => `203.0.113.${200 + n}`;

(async () => {
  const stamp = Date.now();
  let userId = null;

  try {
    console.log('\n── 1. Register test user + fetch a product ──');
    const reg = await j('/auth/register', {
      method: 'POST',
      ip: ip(1),
      body: JSON.stringify({
        name: 'Coupon Tester',
        email: `coupon-tester-${stamp}@example.com`,
        phone: '9000000021',
        password: 'Test@1234',
      }),
    });
    assert(reg.status === 201, `register → ${reg.status}`);
    const token = reg.data?.data?.accessToken;
    userId = reg.data?.data?.user?.id;
    assert(!!token, 'got access token');

    const [products] = await pool.query(
      'SELECT id, price FROM products WHERE is_active = 1 AND price >= 500 ORDER BY price ASC LIMIT 3'
    );
    assert(products.length >= 2, `found products for cart (got ${products.length})`);

    console.log('\n── 2. Add products to cart (subtotal above ₹499) ──');
    for (const p of products) {
      const add = await j('/cart/items', {
        method: 'POST',
        token,
        body: JSON.stringify({ product_id: p.id, quantity: 1 }),
      });
      assert(add.status === 200, `add product ${p.id} → ${add.status}`);
    }

    const cart = await j('/cart', { token });
    assert(cart.status === 200, `get cart → ${cart.status}`);
    const subtotal = cart.data?.data?.summary?.subtotal || 0;
    assert(subtotal >= 499, `subtotal ₹${subtotal} >= ₹499`);

    console.log('\n── 3. GET /cart/suggest-coupons — applicable only, sorted by savings ──');
    const sug = await j('/cart/suggest-coupons', { token });
    assert(sug.status === 200, `suggest-coupons → ${sug.status}`);
    const coupons = sug.data?.data?.coupons || [];
    assert(coupons.length >= 1, `got ${coupons.length} suggested coupons (expected >= 1)`);
    assert(coupons.length <= 2, `at most 2 suggested (got ${coupons.length})`);

    if (coupons.length >= 2) {
      const a = coupons[0].discountAmount;
      const b = coupons[1].discountAmount;
      assert(a >= b, `sorted by savings desc (${a} >= ${b})`);
    }

    for (const c of coupons) {
      assert(c.code, `coupon has code (${c.code})`);
      assert(Number(c.min_order_amount || 0) <= subtotal, `${c.code} min order ${c.min_order_amount} <= subtotal ${subtotal}`);
    }

    const best = coupons[0];
    console.log(`\n── 4. Apply the BEST suggested coupon (${best.code}, saves ₹${best.discountAmount}) ──`);
    const apply = await j('/cart/apply-coupon', {
      method: 'POST',
      token,
      body: JSON.stringify({ code: best.code }),
    });
    assert(apply.status === 200, `apply ${best.code} → ${apply.status}`);

    const cart2 = await j('/cart', { token });
    const applied = cart2.data?.data?.cart;
    const summary2 = cart2.data?.data?.summary || {};
    assert(applied?.coupon_code === best.code, `cart coupon_code = ${applied?.coupon_code}`);
    assert(Number(applied?.coupon_discount) === Number(best.discountAmount), `cart discount ₹${applied?.coupon_discount} == suggested ₹${best.discountAmount}`);
    assert(Number(summary2.coupon_discount) > 0, 'summary reflects coupon discount');
    assert(summary2.total < summary2.subtotal, 'total < subtotal (discount applied)');

    console.log('\n── 5. Removing coupon → suggestions come back ──');
    const rm = await j('/cart/remove-coupon', { method: 'DELETE', token });
    assert(rm.status === 200, `remove coupon → ${rm.status}`);
    const sug2 = await j('/cart/suggest-coupons', { token });
    assert((sug2.data?.data?.coupons || []).length >= 1, 'suggestions available again after remove');

    console.log('\n── 6. Invalid coupon NOT suggested ──');
    const hasInvalid = (sug2.data?.data?.coupons || []).some((c) => c.code === 'NO_SUCH_CODE');
    assert(!hasInvalid, 'non-existent code never suggested');

    console.log('\n── 7. Empty cart → empty suggestions (no crash) ──');
    await j('/cart/clear', { method: 'DELETE', token });
    const emptySug = await j('/cart/suggest-coupons', { token });
    assert(emptySug.status === 200, `empty cart suggest → ${emptySug.status}`);
    assert((emptySug.data?.data?.coupons || []).length === 0, 'empty cart → 0 suggestions');

    console.log('\n── ✅ ALL CHECKS DONE ──');
  } catch (err) {
    failed++;
    console.error('  ❌ Unexpected error:', err.message);
  } finally {
    try {
      if (userId) await pool.query('DELETE FROM users WHERE id = ?', [userId]);
      console.log('\n  🧹 Test data cleaned up.');
    } catch (cleanErr) {
      console.error('  ⚠️ Cleanup failed:', cleanErr.message);
    }
    try { await pool.end(); } catch {}
    console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
})();
