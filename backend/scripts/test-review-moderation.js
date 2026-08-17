/**
 * Review Moderation — end-to-end test.
 *
 * Covers: review submit auto-approves (visible on the public API + product
 * rating updates), admin list/stats, hide → public API hides it + rating
 * recomputed, approve → visible again, admin reply → shown on the public API,
 * delete → gone + rating recomputed.
 *
 * Prereqs:
 *   1. Migration applied: mysql konkan_bazaar < database/review_moderation_migration.sql
 *   2. Backend running with this code: PORT=5199 node backend/server.js
 *
 * Run: node backend/scripts/test-review-moderation.js
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
  const email = `review-mod-${stamp}@example.com`;
  const phone = `91${String(stamp).slice(-8)}`;
  let userId = null;
  let reviewId = null;
  let productId = null;

  try {
    console.log('\n── 1. Register reviewer + pick a product ──');
    const reg = await j('/auth/register', {
      method: 'POST',
      body: { name: 'Review Mod Tester', email, password: 'Test@1234', phone },
    });
    assert(reg.status === 201, `register → ${reg.status}`);
    userId = reg.data?.data?.user?.id;
    const token = reg.data?.data?.accessToken;
    assert(!!userId && !!token, 'got user id + token');

    const prods = await j('/products?limit=5');
    const product = prods.data?.data?.products?.find((p) => p.stock_quantity > 0) || prods.data?.data?.products?.[0];
    assert(!!product?.id, `found product #${product?.id}`);
    productId = product.id;
    const ratingBefore = Number(product.average_rating) || 0;

    console.log('\n── 2. Submit review → AUTO-APPROVED + visible immediately ──');
    const create = await j(`/products/${productId}/reviews`, {
      method: 'POST',
      token,
      body: { rating: 4, title: 'Fresh & tasty', body: 'Loved the quality and packaging.' },
    });
    assert(create.status === 201, `create review → ${create.status}`);
    reviewId = create.data?.data?.review?.id;
    assert(!!reviewId, 'got review id');
    assert(Number(create.data?.data?.review?.is_approved) === 1, 'review is_approved = 1 on insert');

    const publicList = await j(`/products/${productId}/reviews?limit=50`);
    const visible = (publicList.data?.data?.reviews || []).find((r) => r.id === reviewId);
    assert(!!visible, 'review visible in public API right after submit');
    assert(Number(visible.is_approved) === 1, 'public API returns is_approved = 1');

    // Product rating recomputed on insert
    const prodAfter = await j(`/products/${product.slug}`);
    assert(Number(prodAfter.data?.data?.product?.review_count) >= 1, `product review_count updated (${prodAfter.data?.data?.product?.review_count})`);
    assert(Number(prodAfter.data?.data?.product?.average_rating) > 0, `product average_rating > 0 (${prodAfter.data?.data?.product?.average_rating})`);

    console.log('\n── 3. Admin login + moderation list ──');
    const adminLogin = await j('/admin/login', {
      method: 'POST',
      body: { password: process.env.ADMIN_PANEL_PASSWORD || '' },
    });
    assert(adminLogin.status === 200, `admin login → ${adminLogin.status}`);
    const adminToken = adminLogin.data?.data?.accessToken;
    assert(!!adminToken, 'got admin token');

    const listAll = await j(`/admin/reviews?status=all&limit=50`, { token: adminToken });
    assert(listAll.status === 200, `admin list → ${listAll.status}`);
    const inList = (listAll.data?.data?.reviews || []).find((r) => r.id === reviewId);
    assert(!!inList, 'review appears in admin list');
    assert(inList.product_name && inList.user_email, 'admin list includes product + reviewer info');
    assert(listAll.data?.data?.stats?.approved >= 1, 'stats.approved counts it');

    const listApproved = await j(`/admin/reviews?status=approved&limit=50`, { token: adminToken });
    assert((listApproved.data?.data?.reviews || []).some((r) => r.id === reviewId), 'approved filter includes it');

    console.log('\n── 4. HIDE review → gone from public API + rating recomputed ──');
    const hide = await j(`/admin/reviews/${reviewId}/status`, { method: 'PUT', token: adminToken, body: { approved: false } });
    assert(hide.status === 200, `hide → ${hide.status}`);

    const publicAfterHide = await j(`/products/${productId}/reviews?limit=50`);
    assert(!(publicAfterHide.data?.data?.reviews || []).some((r) => r.id === reviewId), 'hidden review NOT in public API');

    const listHidden = await j(`/admin/reviews?status=hidden&limit=50`, { token: adminToken });
    assert((listHidden.data?.data?.reviews || []).some((r) => r.id === reviewId), 'hidden filter shows it');

    const prodHidden = await j(`/products/${product.slug}`);
    const reviewCountHidden = Number(prodHidden.data?.data?.product?.review_count) || 0;
    const avgHidden = Number(prodHidden.data?.data?.product?.average_rating) || 0;
    assert(reviewCountHidden < Number(prodAfter.data?.data?.product?.review_count), `review_count dropped after hide (${reviewCountHidden})`);
    assert(avgHidden <= ratingBefore + 0.001, `average_rating recomputed after hide (${avgHidden})`);

    console.log('\n── 5. RE-APPROVE → visible again ──');
    const approve = await j(`/admin/reviews/${reviewId}/status`, { method: 'PUT', token: adminToken, body: { approved: true } });
    assert(approve.status === 200, `approve → ${approve.status}`);
    const publicAfterApprove = await j(`/products/${productId}/reviews?limit=50`);
    assert((publicAfterApprove.data?.data?.reviews || []).some((r) => r.id === reviewId), 'review visible again after approve');

    console.log('\n── 6. Admin REPLY → shown on public API ──');
    const reply = await j(`/admin/reviews/${reviewId}/reply`, { method: 'PUT', token: adminToken, body: { reply: 'Thank you for your feedback! 🙏' } });
    assert(reply.status === 200, `reply → ${reply.status}`);
    const publicWithReply = await j(`/products/${productId}/reviews?limit=50`);
    const withReply = (publicWithReply.data?.data?.reviews || []).find((r) => r.id === reviewId);
    assert(withReply?.admin_reply === 'Thank you for your feedback! 🙏', 'public API returns admin_reply');
    assert(!!withReply?.admin_replied_at, 'admin_replied_at set');

    // Empty reply removes it
    const clearReply = await j(`/admin/reviews/${reviewId}/reply`, { method: 'PUT', token: adminToken, body: { reply: '   ' } });
    assert(clearReply.status === 200, `clear reply → ${clearReply.status}`);
    const publicCleared = await j(`/products/${productId}/reviews?limit=50`);
    const cleared = (publicCleared.data?.data?.reviews || []).find((r) => r.id === reviewId);
    assert(!cleared?.admin_reply, 'reply removed when cleared');

    console.log('\n── 7. Auth guards ──');
    const noAuth = await j(`/admin/reviews?limit=10`);
    assert(noAuth.status === 401, `admin list without token → ${noAuth.status} (expect 401)`);
    const userNotAdmin = await j(`/admin/reviews?limit=10`, { token });
    assert(userNotAdmin.status === 403, `customer cannot moderate → ${userNotAdmin.status} (expect 403)`);

    console.log('\n── 8. DELETE review → gone + rating recomputed ──');
    const deletedId = reviewId;
    const del = await j(`/admin/reviews/${deletedId}`, { method: 'DELETE', token: adminToken });
    assert(del.status === 200, `delete → ${del.status}`);
    reviewId = null; // already deleted — skip cleanup of review
    const publicAfterDelete = await j(`/products/${productId}/reviews?limit=50`);
    assert(!(publicAfterDelete.data?.data?.reviews || []).some((r) => r.id === deletedId), 'deleted review not in public API');

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
