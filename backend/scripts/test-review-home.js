/**
 * Review → Home slider — end-to-end test.
 *
 * Covers: public /reviews/home returns recent approved reviews as fallback,
 * admin product-cards data shows per-product review counts, the "Add to Home"
 * toggle moves the review into the FEATURED set (source=featured), removing
 * it drops back to recent, and auth guards hold.
 *
 * Prereqs:
 *   1. Migration applied: mysql konkan_bazaar < database/review_home_migration.sql
 *   2. Backend running with this code: PORT=5199 node backend/server.js
 *
 * Run: node backend/scripts/test-review-home.js
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

const j = async (path, opts = {}) => {
  const res = await fetch(BASE + path, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, data };
};

(async () => {
  const stamp = Date.now();
  let userId = null;
  let reviewId = null;
  let productId = null;

  try {
    console.log('\n── 1. Register reviewer + submit review (auto-approved) ──');
    const reg = await j('/auth/register', {
      method: 'POST',
      body: { name: 'Home Slider Tester', email: `home-slider-${stamp}@example.com`, password: 'Test@1234', phone: `91${String(stamp).slice(-8)}` },
    });
    assert(reg.status === 201, `register → ${reg.status}`);
    userId = reg.data?.data?.user?.id;
    const token = reg.data?.data?.accessToken;

    const prods = await j('/products?limit=10');
    const product = prods.data?.data?.products?.find((p) => p.stock_quantity > 0) || prods.data?.data?.products?.[0];
    productId = product.id;
    const create = await j(`/products/${productId}/reviews`, {
      method: 'POST',
      token,
      body: { rating: 5, title: 'Love it!', body: 'Homepage slider test review — should appear in the fallback.' },
    });
    assert(create.status === 201, `create review → ${create.status}`);
    reviewId = create.data?.data?.review?.id;

    console.log('\n── 2. Public /reviews/home → fallback shows the review ──');
    const home1 = await j('/reviews/home?limit=10');
    assert(home1.status === 200, `home endpoint → ${home1.status}`);
    assert(home1.data?.data?.source === 'recent', `source=recent (no featured yet), got ${home1.data?.data?.source}`);
    assert((home1.data?.data?.reviews || []).some((r) => r.id === reviewId), 'review in recent fallback');
    const r1 = (home1.data?.data?.reviews || []).find((r) => r.id === reviewId);
    assert(r1?.user_name && r1?.product_name, 'review includes user + product name');

    console.log('\n── 3. Admin list → product cards + show_on_home flag ──');
    const adminLogin = await j('/admin/login', { method: 'POST', body: { password: process.env.ADMIN_PANEL_PASSWORD || '' } });
    const adminToken = adminLogin.data?.data?.accessToken;
    assert(!!adminToken, 'admin login ok');

    const list = await j('/admin/reviews?status=all&limit=50', { token: adminToken });
    assert(list.status === 200, `admin list → ${list.status}`);
    const cards = list.data?.data?.productCards || [];
    assert(Array.isArray(cards) && cards.length > 0, `product cards returned (${cards.length})`);
    const card = cards.find((c) => String(c.id) === String(productId));
    assert(!!card, 'our product has a card');
    assert(Number(card.total_reviews) >= 1, `card total_reviews = ${card.total_reviews}`);
    assert(Number(card.on_home) === 0, 'card on_home = 0 initially');
    const inList = (list.data?.data?.reviews || []).find((r) => r.id === reviewId);
    assert(Number(inList.show_on_home) === 0, 'review show_on_home = 0 initially');

    // product_id filter works
    const filtered = await j(`/admin/reviews?product_id=${productId}&limit=50`, { token: adminToken });
    assert((filtered.data?.data?.reviews || []).some((r) => r.id === reviewId), 'product_id filter returns the review');

    console.log('\n── 4. ADD TO HOME → featured on homepage ──');
    const add = await j(`/admin/reviews/${reviewId}/home`, { method: 'PUT', token: adminToken, body: { show_on_home: true } });
    assert(add.status === 200, `add to home → ${add.status}`);

    const home2 = await j('/reviews/home?limit=10');
    assert(home2.data?.data?.source === 'featured', `source=featured after adding, got ${home2.data?.data?.source}`);
    assert((home2.data?.data?.reviews || []).some((r) => r.id === reviewId), 'review now in featured set');

    const list2 = await j('/admin/reviews?status=all&limit=50', { token: adminToken });
    const card2 = (list2.data?.data?.productCards || []).find((c) => String(c.id) === String(productId));
    assert(Number(card2?.on_home) === 1, `card on_home = 1 (got ${card2?.on_home})`);
    assert(Number((list2.data?.data?.reviews || []).find((r) => r.id === reviewId)?.show_on_home) === 1, 'review show_on_home = 1');
    assert(list2.data?.data?.stats?.on_home === 1, `stats.on_home = 1 (got ${list2.data?.data?.stats?.on_home})`);

    console.log('\n── 5. REMOVE FROM HOME → back to recent fallback ──');
    const remove = await j(`/admin/reviews/${reviewId}/home`, { method: 'PUT', token: adminToken, body: { show_on_home: false } });
    assert(remove.status === 200, `remove from home → ${remove.status}`);
    const home3 = await j('/reviews/home?limit=10');
    assert(home3.data?.data?.source === 'recent', 'source=recent again after removing');

    console.log('\n── 6. Auth guards ──');
    const noAuth = await j(`/admin/reviews/${reviewId}/home`, { method: 'PUT', body: { show_on_home: true } });
    assert(noAuth.status === 401, `no token → ${noAuth.status} (expect 401)`);
    const asCustomer = await j(`/admin/reviews/${reviewId}/home`, { method: 'PUT', token, body: { show_on_home: true } });
    assert(asCustomer.status === 403, `customer → ${asCustomer.status} (expect 403)`);

    console.log('\n── ✅ ALL CHECKS DONE ──');
  } catch (err) {
    failed++;
    console.error('  ❌ Unexpected error:', err.message);
  } finally {
    try {
      if (reviewId) await pool.query('DELETE FROM reviews WHERE id = ?', [reviewId]);
      if (userId) await pool.query('DELETE FROM users WHERE id = ?', [userId]);
      console.log('\n  🧹 Test data cleaned up.');
    } catch (cleanErr) {
      console.error('  ⚠️ Cleanup failed:', cleanErr.message);
    }
    console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
    try { await pool.end(); } catch {}
    process.exit(failed > 0 ? 1 : 0);
  }
})();
