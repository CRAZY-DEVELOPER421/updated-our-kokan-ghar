/**
 * E2E: post-delivery lifecycle emails (review request + reorder nudge).
 * Run: node backend/scripts/test-lifecycle-emails.js
 *
 * Uses the LIVE backend (port 5000) for register/order/address, then runs the
 * lifecycle sweeps IN-PROCESS with SMTP stubbed (no real emails). Verifies:
 *   1. Order delivered 2 days ago → review-request email "sent" + stamp set
 *   2. Second sweep → NOT re-sent (no double email)
 *   3. Order delivered 15 days ago → reorder nudge + stamp set
 *   4. Order delivered 1 hour ago → NOT picked up
 *   5. Template sanity (subject + #reviews link + product link)
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const API = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '') + '/api';
const mysql = require('mysql2/promise');
const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
};

async function main() {
  const stamp = Date.now();
  const phone = `9${String(stamp).slice(-9)}`;
  const email = `life${stamp}@test.local`;
  const password = 'Test@12345';

  let userId = null;
  let token = null;
  const orderIds = [];
  let conn = null;

  try {
    // ── 1. Register + address + cart + 3 orders on the live backend ──
    let res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Lifecycle Test', email, phone, password }),
    });
    let body = await res.json();
    check('register', res.status === 201, `status ${res.status}`);
    token = body?.data?.accessToken || null;
    userId = body?.data?.user?.id || null;
    check('got token', !!token);

    res = await fetch(`${API}/products/random?limit=1`);
    body = await res.json();
    const product = body?.data?.products?.[0] || (Array.isArray(body?.data) ? body.data[0] : null);
    check('found product', !!product?.id, product?.name || '');

    res = await fetch(`${API}/users/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'Lifecycle Test', phone, house_no: '1', street: 'Main Street', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', is_default: 1 }),
    });
    body = await res.json();
    const addressId = body?.data?.address?.id || body?.data?.id || null;
    check('address created', !!addressId);

    const makeOrder = async () => {
      // fresh cart each time
      await fetch(`${API}/cart/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      }).catch(() => {});
      const r = await fetch(`${API}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ address_id: addressId, payment_method: 'cod' }),
      });
      const b = await r.json();
      return b?.data?.order_id || null;
    };

    // ── 2. DB access for stamps ──
    conn = await mysql.createConnection({
      host: process.env.DB_HOST, user: process.env.DB_USER,
      password: process.env.DB_PASS, database: process.env.DB_NAME,
    });

    // Order A — delivered 2 days ago (review due)
    const orderA = await makeOrder();
    orderIds.push(orderA);
    check('order A placed', !!orderA);
    await conn.query("UPDATE orders SET status='delivered', delivered_at = NOW() - INTERVAL 2 DAY WHERE id = ?", [orderA]);

    // Order B — delivered 15 days ago (reorder due)
    const orderB = await makeOrder();
    orderIds.push(orderB);
    await conn.query("UPDATE orders SET status='delivered', delivered_at = NOW() - INTERVAL 15 DAY WHERE id = ?", [orderB]);

    // Order C — delivered 1 hour ago (not due)
    const orderC = await makeOrder();
    orderIds.push(orderC);
    await conn.query("UPDATE orders SET status='delivered', delivered_at = NOW() - INTERVAL 1 HOUR WHERE id = ?", [orderC]);

    // ── 3. Stub SMTP + run sweeps in-process ──
    const emailSvc = require('../services/email.service');
    const lifecycle = require('../services/lifecycle.service');
    const sent = [];
    emailSvc.sendEmail = async ({ to, subject }) => {
      sent.push({ to, subject });
      return { success: true, messageId: 'stub' };
    };

    // Sweep 1 — review requests
    const r1 = await lifecycle.sendReviewRequests();
    check('sweep 1 ran (review)', typeof r1 === 'number', `${r1} sent`);
    check('review email sent to test user', sent.some((s) => /Rate your recent/.test(s.subject) && s.to === email), JSON.stringify(sent.map((s) => s.subject)));

    // Stamps — order A stamped, B and C untouched
    const [stamps1] = await conn.query(
      "SELECT id, review_email_sent_at, reorder_email_sent_at FROM orders WHERE id IN (?, ?, ?)",
      [orderA, orderB, orderC]
    );
    const stamp = (id) => stamps1.find((s) => s.id === id);
    check('order A review stamp set', !!stamp(orderA)?.review_email_sent_at);
    check('order B review stamp NOT set (not due yet)', !stamp(orderB)?.review_email_sent_at);
    check('order C review stamp NOT set (too fresh)', !stamp(orderC)?.review_email_sent_at);

    // Sweep 2 — must NOT double-send A
    sent.length = 0;
    await lifecycle.sendReviewRequests();
    check('no double review email for A', !sent.some((s) => s.to === email), `${sent.length} sent`);

    // Sweep 3 — reorder reminders (15-day order due)
    sent.length = 0;
    const r3 = await lifecycle.sendReorderReminders();
    check('reorder sweep ran', typeof r3 === 'number', `${r3} sent`);
    check('reorder email sent to test user', sent.some((s) => /Restock your favourites/.test(s.subject) && s.to === email));
    const [stamps3] = await conn.query(
      "SELECT id, reorder_email_sent_at FROM orders WHERE id IN (?, ?, ?)",
      [orderA, orderB, orderC]
    );
    const stampR = (id) => stamps3.find((s) => s.id === id);
    check('order B reorder stamp set', !!stampR(orderB)?.reorder_email_sent_at);
    check('order A reorder stamp NOT set (only 2 days old)', !stampR(orderA)?.reorder_email_sent_at);

    // ── 4. Template sanity ──
    const { sendReviewRequestEmail, sendReorderEmail } = emailSvc;
    const rev = sendReviewRequestEmail('x@y.z', 'Test', 'KB123', [{ product_name: 'Mango', slug: 'mango', quantity: 1, total_price: 100 }]);
    check('review template has #reviews link + Rate it', rev.html.includes('#reviews') && rev.html.includes('Rate it'));
    check('review template has order number', rev.html.includes('KB123'));
    const reo = sendReorderEmail('x@y.z', 'Test', [{ product_name: 'Mango', slug: 'mango', total_price: 100 }]);
    check('reorder template has product link + Buy again', reo.html.includes('/products/mango') && reo.html.includes('Buy again'));

    const failed = results.filter((r) => !r).length;
    console.log(`\n${failed === 0 ? '🎉 ALL PASS' : '❌ ' + failed + ' FAILED'} — ${results.length} checks`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    // ── Cleanup ──
    try {
      if (conn) {
        if (orderIds.length) {
          const ph = orderIds.map(() => '?').join(',');
          await conn.query(`DELETE FROM order_items WHERE order_id IN (${ph})`, orderIds);
          await conn.query(`DELETE FROM order_tracking WHERE order_id IN (${ph})`, orderIds);
          await conn.query(`DELETE FROM coupon_usage WHERE order_id IN (${ph})`, orderIds);
          await conn.query(`DELETE FROM notifications WHERE user_id = ?`, [userId]);
          await conn.query(`DELETE FROM orders WHERE id IN (${ph})`, orderIds);
        }
        await conn.query('DELETE FROM addresses WHERE user_id = ?', [userId]);
        await conn.query('DELETE FROM cart WHERE user_id = ?', [userId]);
        await conn.query('DELETE FROM loyalty_points WHERE user_id = ?', [userId]);
        await conn.query('DELETE FROM users WHERE id = ?', [userId]);
        await conn.end();
      }
    } catch (e) {
      console.error('Cleanup error:', e.message);
    }
  }
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
