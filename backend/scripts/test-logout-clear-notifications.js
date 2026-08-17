/**
 * E2E — logout clears the user's notifications (DB rows + API).
 *
 * Run against a live backend:
 *   PORT=5199 node server.js
 *   node scripts/test-logout-clear-notifications.js
 *
 * Flow:
 *   1. Register a fresh user
 *   2. Insert a few notification rows for them (price_drop, order_confirmed)
 *   3. Login → GET /notifications shows them
 *   4. POST /auth/logout (with the access token)
 *   5. GET /notifications → empty (old token rejected)
 *   6. Re-login → still empty; DB has 0 rows for that user
 *   7. Cleanup: delete the test user
 */
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const BASE = process.env.TEST_BASE || 'http://127.0.0.1:5199/api';
const stamp = Date.now();
const email = `logout-clear-${stamp}@test.local`;
const phone = '98' + String(stamp).slice(-8);
const password = 'Test@1234';

let passed = 0;
let failed = 0;
const checks = [];

const check = (name, ok, extra = '') => {
  if (ok) { passed++; console.log(`  ✅ ${name} ${extra}`); }
  else { failed++; console.log(`  ❌ ${name} ${extra}`); }
  checks.push({ name, ok });
};

const api = async (method, url, { token, body } = {}) => {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data };
};

(async () => {
  let userId = null;
  try {
    // 1. Register
    console.log('\nStep 1 — register fresh user');
    const reg = await api('POST', '/auth/register', {
      body: { name: 'Logout Clear Tester', email, phone, password },
    });
    check('register succeeds', reg.status === 201, `(${reg.status})`);
    if (reg.status !== 201) return;
    userId = reg.data.data.user.id;

    // 2. Insert notifications directly (same payload shapes the backend uses)
    console.log('\nStep 2 — plant notifications in DB');
    const [ins] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data) VALUES
       (?, 'price_drop', 'Kokan Eco Collection price dropped!', 'It is now ₹60 cheaper (was ₹200, now ₹140).', ?),
       (?, 'order_confirmed', 'Order confirmed', 'Your order KBMS1234 has been confirmed.', ?)`,
      [
        userId, JSON.stringify({ slug: 'kokan-eco-collection', product_id: 1 }),
        userId, JSON.stringify({ order_id: 999999, order_number: 'KBMS1234', total_amount: 348.25 }),
      ]
    );
    check('2 notifications inserted', ins.affectedRows === 2);

    // 3. Login + see them
    console.log('\nStep 3 — login → notifications visible');
    const login = await api('POST', '/auth/login', { body: { email, password } });
    const token = login.data?.data?.accessToken;
    check('login succeeds', login.status === 200 && !!token);
    if (!token) return;

    const before = await api('GET', '/notifications', { token });
    const beforeList = before.data?.data?.notifications || [];
    check('notifications visible before logout', beforeList.length === 2,
      `(${beforeList.length} shown)`);

    // 4. Logout (access token attached, like the frontend interceptor does)
    console.log('\nStep 4 — logout');
    const logout = await api('POST', '/auth/logout', { token });
    check('logout succeeds', logout.status === 200, `(${logout.status})`);

    // 5. Even with the still-valid (stateless) token the notifications are
    //    gone — deletion happened server-side, not just in the UI.
    const afterOld = await api('GET', '/notifications', { token });
    const afterOldList = afterOld.data?.data?.notifications || [];
    check('notifications gone even with stale token', afterOldList.length === 0,
      `(${afterOldList.length} shown, expect 0)`);

    // 6. Re-login → notifications empty (DB deleted, not just hidden)
    console.log('\nStep 5 — re-login → empty notifications');
    const login2 = await api('POST', '/auth/login', { body: { email, password } });
    const token2 = login2.data?.data?.accessToken;
    check('re-login succeeds', login2.status === 200 && !!token2);

    const after = await api('GET', '/notifications', { token: token2 });
    const afterList = after.data?.data?.notifications || [];
    check('notifications gone after logout', afterList.length === 0,
      `(${afterList.length} shown, expect 0)`);
    check('unread count is 0', (after.data?.data?.unread_count || 0) === 0);

    // 7. DB check — zero rows for this user
    console.log('\nStep 6 — DB check');
    const [rows] = await pool.query('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ?', [userId]);
    check('DB has 0 notification rows for user', Number(rows[0].c) === 0, `(${rows[0].c})`);
  } catch (err) {
    failed++;
    console.log('  ❌ unexpected error:', err.message);
  } finally {
    // Cleanup: remove test user (cascade deletes their notifications/orders/etc.)
    if (userId) {
      try {
        await pool.query('DELETE FROM notifications WHERE user_id = ?', [userId]);
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        console.log('\nCleanup: test user removed ✓');
      } catch (e) { console.log('Cleanup warning:', e.message); }
    }
    console.log(`\n==== ${passed} passed, ${failed} failed ====`);
    try { await pool.end(); } catch { /* ignore */ }
    if (failed > 0) process.exit(1);
  }
})();
