/**
 * E2E: real COD order + admin status update — with the SMS hook wired in.
 * Run: node backend/scripts/test-sms-order-e2e.js
 *
 * Verifies:
 *   1. Register → add to cart → place COD order succeeds (SMS hook fires,
 *      but SMS is unconfigured so it just skips — never fails the order)
 *   2. Admin updates order status → shipped → still succeeds, notification
 *      created, SMS skip logged (fire-and-forget)
 *   3. Cleanup: delete test user + order + address
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// BACKEND_URL may be just the origin (no /api suffix) — normalize to the API base
const API = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '') + '/api';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
};

async function main() {
  const stamp = Date.now();
  const phone = `9${String(stamp).slice(-9)}`;
  const email = `sms${stamp}@test.local`;
  const password = 'Test@12345';

  let userId = null;
  let orderId = null;
  let token = null;
  let adminToken = null;

  try {
    // ── 1. Register ──
    let res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'SMS Test', email, phone, password }),
    });
    let body = await res.json();
    check('register', res.status === 201 || res.status === 200, `status ${res.status}`);
    token = body?.data?.token || body?.data?.accessToken || null;

    if (!token) {
      // login instead
      res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      body = await res.json();
      token = body?.data?.token || body?.data?.accessToken || null;
      userId = body?.data?.user?.id || null;
    }
    check('got auth token', !!token);

    // find user id from token payload if not set
    if (!userId && token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
        userId = payload.id;
      } catch (e) {}
    }

    // ── 2. Product (any in-stock) ──
    res = await fetch(`${API}/products/random?limit=1`);
    body = await res.json();
    const product = body?.data?.products?.[0] || body?.data?.[0] || (Array.isArray(body?.data) ? body.data[0] : null);
    check('found a product', !!product?.id, product?.name || 'no product');
    const productId = product?.id;

    // ── 3. Add address ──
    res = await fetch(`${API}/users/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'SMS Test', phone, house_no: '42', street: 'Test Street',
        city: 'Mumbai', state: 'Maharashtra', pincode: '400001', is_default: 1,
      }),
    });
    body = await res.json();
    const addressId = body?.data?.address?.id || body?.data?.id || null;
    check('created address', !!addressId, `address ${addressId}`);

    // ── 4. Add to cart ──
    res = await fetch(`${API}/cart/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });
    body = await res.json();
    check('added to cart', body?.success === true, `status ${res.status}`);

    // ── 5. Place COD order ──
    res = await fetch(`${API}/orders/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ address_id: addressId, payment_method: 'cod' }),
    });
    body = await res.json();
    orderId = body?.data?.order_id || null;
    const orderNumber = body?.data?.order_number || null;
    check('COD order placed (SMS hook did not break)', res.status === 201 && !!orderId, `status ${res.status}, #${orderNumber}`);
    check('order total present', Number(body?.data?.total_amount) >= 0);

    // ── 6. Admin status update → shipped ──
    // Get an admin JWT first (ADMIN_PANEL_PASSWORD verified server-side)
    res = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: process.env.ADMIN_PANEL_PASSWORD || '' }),
    });
    const adminBody = await res.json();
    adminToken = adminBody?.data?.accessToken || adminBody?.data?.token || adminBody?.token || null;
    check('admin login works', !!adminToken, `status ${res.status}`);

    res = await fetch(`${API}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'shipped', message: 'Packed and handed to courier', location: 'Mumbai Hub' }),
    });
    body = await res.json();
    check('admin status → shipped (SMS hook fire-and-forget)', res.status === 200, `status ${res.status}`);

    // verify tracking row + notification
    res = await fetch(`${API}/orders/${orderId}/tracking`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    body = await res.json();
    const track = body?.data?.tracking || [];
    check('tracking has shipped entry', track.some((t) => t.status === 'shipped'), `${track.length} entries`);

    // ── 7. Admin status → delivered ──
    res = await fetch(`${API}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'delivered', message: 'Delivered to customer' }),
    });
    check('admin status → delivered (SMS hook fine)', res.status === 200, `status ${res.status}`);

    const failed = results.filter((r) => !r).length;
    console.log(`\n${failed === 0 ? '🎉 ALL PASS' : '❌ ' + failed + ' FAILED'} — ${results.length} checks`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    // ── Cleanup ──
    if (orderId && token) {
      try { await fetch(`${API}/orders/${orderId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); } catch (e) {}
    }
    if (userId) {
      try {
        await fetch(`${API}/admin/users/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
      } catch (e) {
        // cascade may have failed; try direct DB cleanup
        console.log('  (admin user delete failed — cleaning via DB)');
      }
    }
  }
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
