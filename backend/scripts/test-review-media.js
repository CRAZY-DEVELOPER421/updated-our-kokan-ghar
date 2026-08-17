/**
 * Review Photos/Videos — end-to-end test.
 *
 * Prereqs: backend running with this code: PORT=5199 node backend/server.js
 *
 * Run: node backend/scripts/test-review-media.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
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
  // JSON bodies need an explicit content-type; multipart (FormData/Blob) must NOT set one.
  if (typeof opts.body === 'string') headers['Content-Type'] = 'application/json';
  const res = await fetch(BASE + pathname, {
    method: opts.method || 'GET',
    headers,
    body: opts.body,
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, data };
};

(async () => {
  const email = `review-media-${Date.now()}@example.com`;
  const phone = `92${String(Date.now()).slice(-8)}`; // unique per run (phone is globally unique now)
  let userId = null;
  const pngPath = path.join(__dirname, '..', 'uploads', `.tmp-review-${Date.now()}.png`);

  try {
    console.log('\n── 1. Create tiny PNG + register user ──');
    // 1x1 red PNG
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(pngPath, png);

    const reg = await j('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Review Media Test', email, password: 'Test@1234', phone }),
    });
    assert(reg.status === 201, `register → ${reg.status}`);
    userId = reg.data?.data?.user?.id;
    const token = reg.data?.data?.accessToken;
    assert(!!token, 'got access token');

    console.log('\n── 2. Upload image as CUSTOMER (no admin) ──');
    const fd = new FormData();
    fd.append('image', new Blob([fs.readFileSync(pngPath)], { type: 'image/png' }), 'review.png');
    const up = await j('/upload/review-image', { method: 'POST', token, body: fd });
    assert(up.status === 200 && !!up.data?.data?.url, `customer upload → ${up.status} (${up.data?.data?.url || up.data?.message})`);
    const url = up.data?.data?.url;

    console.log('\n── 3. Verify ADMIN-only endpoint still blocks customers ──');
    const fd2 = new FormData();
    fd2.append('image', new Blob([fs.readFileSync(pngPath)], { type: 'image/png' }), 'x.png');
    const blocked = await j('/upload/image', { method: 'POST', token, body: fd2 });
    assert(blocked.status === 403, `admin-only /upload/image → ${blocked.status} (expect 403)`);

    console.log('\n── 4. Create review WITH image ──');
    const [prod] = await pool.query('SELECT id FROM products WHERE is_active = 1 LIMIT 1');
    const productId = prod[0].id;
    const rev = await j(`/products/${productId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      token,
      body: JSON.stringify({ rating: 5, title: 'Great with photo!', body: 'Fresh and tasty.', images: [{ type: 'image', url }] }),
    });
    assert(rev.status === 201, `create review → ${rev.status}`);
    const reviewId = rev.data?.data?.review?.id;

    console.log('\n── 5. Review is auto-approved + images stored ──');
    const [rows] = await pool.query('SELECT is_approved, images FROM reviews WHERE id = ?', [reviewId]);
    assert(Number(rows[0].is_approved) === 1, `is_approved = 1 (auto-approved, got ${rows[0].is_approved})`);
    // mysql2 auto-parses JSON columns into JS objects; handle string form defensively too.
    let stored = rows[0].images;
    if (typeof stored === 'string') stored = JSON.parse(stored);
    assert(Array.isArray(stored) && stored.length === 1 && stored[0].type === 'image' && stored[0].url === url, 'images JSON stored correctly');

    console.log('\n── 6. Public reviews endpoint returns it (visibility fix) ──');
    const list = await j(`/products/${productId}/reviews?page=1&limit=8`);
    const found = (list.data?.data?.reviews || []).find((r) => r.id === reviewId);
    assert(!!found, 'new review appears in public list');
    assert(!!found.images && found.images.length === 1, 'public list includes images field');

    console.log('\n── 7. Legacy plain-string images still render-safe (JSON parse) ──');
    await pool.query("UPDATE reviews SET images = ? WHERE id = ?", [JSON.stringify(['/uploads/legacy.png']), reviewId]);
    const list2 = await j(`/products/${productId}/reviews?page=1&limit=8`);
    const found2 = (list2.data?.data?.reviews || []).find((r) => r.id === reviewId);
    assert(!!found2?.images && found2.images[0] === '/uploads/legacy.png', 'legacy string image returned as-is');

    console.log('\n── ✅ ALL CHECKS DONE ──');
  } catch (err) {
    failed++;
    console.error('  ❌ Unexpected error:', err.message);
  } finally {
    try {
      if (userId) {
        await pool.query('DELETE FROM reviews WHERE user_id = ?', [userId]);
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
      }
      if (fs.existsSync(pngPath)) fs.unlinkSync(pngPath);
      const uploaded = path.join(__dirname, '..', 'uploads');
      fs.readdirSync(uploaded).filter((f) => f.startsWith('.tmp-review-')).forEach((f) => fs.unlinkSync(path.join(uploaded, f)));
      console.log('\n  🧹 Test data cleaned up.');
    } catch (cleanErr) {
      console.error('  ⚠️ Cleanup failed:', cleanErr.message);
    }
    try { await pool.end(); } catch {}
    console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
})();
