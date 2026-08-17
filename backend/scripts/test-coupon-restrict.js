/**
 * Live check: category-restricted coupons are only suggested when the cart
 * contains an applicable product — not otherwise.
 * Run: node backend/scripts/test-coupon-restrict.js   (backend on :5199)
 */
'use strict';

const BASE = process.env.TEST_API_BASE || 'http://127.0.0.1:5199/api';
const pool = require('../config/db');

let passed = 0, failed = 0;
const assert = (cond, msg) => {
  if (cond) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
};

const j = async (pathname, opts = {}) => {
  const headers = { ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}) };
  if (typeof opts.body === 'string') headers['Content-Type'] = 'application/json';
  if (opts.ip) headers['X-Forwarded-For'] = opts.ip;
  const res = await fetch(BASE + pathname, {
    method: opts.method || 'GET', headers, body: opts.body,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
};

(async () => {
  const stamp = Date.now();
  let userId = null, couponId = null;
  try {
    // Two products from DIFFERENT categories
    const [rows] = await pool.query(
      'SELECT id, category_id FROM products WHERE is_active = 1 AND price > 0 AND category_id IS NOT NULL ORDER BY id LIMIT 2'
    );
    const [pA, pB] = rows;
    assert(pA && pB && pA.category_id !== pB.category_id, `two products from different categories (${pA?.id} cat ${pA?.category_id}, ${pB?.id} cat ${pB?.category_id})`);

    // Temporary coupon: only valid for pA's category, min order ₹100, value 50%
    couponId = (await pool.query(
      `INSERT INTO coupons (code, type, value, min_order_amount, max_discount, is_active, valid_from, valid_until, applicable_categories, usage_limit, used_count)
       VALUES (?, 'percentage', 50, 100, 500, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), ?, 100, 0)`,
      [`RESTR${stamp}`.slice(-10), JSON.stringify([pA.category_id])]
    ))[0].insertId;

    const reg = await j('/auth/register', {
      method: 'POST', ip: '203.0.113.241',
      body: JSON.stringify({ name: 'Restrict Tester', email: `restrict-${stamp}@example.com`, phone: '9000000031', password: 'Test@1234' }),
    });
    assert(reg.status === 201, `register → ${reg.status}`);
    const token = reg.data?.data?.accessToken;
    userId = reg.data?.data?.user?.id;

    // Cart with ONLY pB (wrong category)
    await j('/cart/items', { method: 'POST', token, body: JSON.stringify({ product_id: pB.id, quantity: 1 }) });
    let sug = await j('/cart/suggest-coupons', { token });
    let codes = (sug.data?.data?.coupons || []).map(c => c.code);
    assert(!codes.includes(`RESTR${stamp}`.slice(-10)), `restricted coupon NOT suggested for wrong category (got: ${codes.join(', ') || 'none'})`);

    // Add pA (right category) → coupon becomes applicable
    await j('/cart/items', { method: 'POST', token, body: JSON.stringify({ product_id: pA.id, quantity: 1 }) });
    sug = await j('/cart/suggest-coupons', { token });
    codes = (sug.data?.data?.coupons || []).map(c => c.code);
    const restricted = codes.find(c => c === `RESTR${stamp}`.slice(-10));
    assert(!!restricted, `restricted coupon NOW suggested for matching category (got: ${codes.join(', ') || 'none'})`);

    // And applying it works end-to-end
    const apply = await j('/cart/apply-coupon', { method: 'POST', token, body: JSON.stringify({ code: `RESTR${stamp}`.slice(-10) }) });
    assert(apply.status === 200, `apply restricted coupon → ${apply.status}`);

    console.log('\n── ✅ ALL CHECKS DONE ──');
  } catch (err) {
    failed++;
    console.error('  ❌ Unexpected error:', err.message);
  } finally {
    try {
      if (userId) await pool.query('DELETE FROM users WHERE id = ?', [userId]);
      if (couponId) await pool.query('DELETE FROM coupons WHERE id = ?', [couponId]);
      console.log('\n  🧹 Test data cleaned up.');
    } catch (cleanErr) { console.error('  ⚠️ Cleanup failed:', cleanErr.message); }
    try { await pool.end(); } catch {}
    console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
})();
