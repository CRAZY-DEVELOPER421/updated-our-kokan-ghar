/**
 * Guest Cart / Express Checkout — end-to-end test.
 *
 * Flow verified: guest adds to cart WITHOUT an account (device id),
 * guest cart persists across requests, checkout endpoints require login,
 * login/signup merges the guest cart into the user's cart (qty adds up),
 * order creation still requires auth.
 *
 * Prereqs: backend running with this code: PORT=5199 node backend/server.js
 * Run: node backend/scripts/test-guest-cart.js
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
  if (opts.guestId) headers['X-Guest-Id'] = opts.guestId;
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
  const stamp = Date.now();
  const guestId = `guest-${stamp}-ab12cd34`;
  let userId = null;
  let token = null;

  try {
    console.log('\n── 1. Fetch 2 in-stock products ──');
    const [products] = await pool.query(
      'SELECT id, price, stock_quantity FROM products WHERE is_active = 1 AND stock_quantity >= 3 AND price > 0 ORDER BY id LIMIT 2'
    );
    assert(products.length === 2, `found 2 products (got ${products.length})`);
    const [p1, p2] = products;

    console.log('\n── 2. GUEST adds items to cart WITHOUT login ──');
    const add1 = await j('/cart/items', {
      method: 'POST', guestId,
      body: JSON.stringify({ product_id: p1.id, quantity: 2 }),
    });
    assert(add1.status === 200, `guest add product 1 → ${add1.status}`);

    const add2 = await j('/cart/items', {
      method: 'POST', guestId,
      body: JSON.stringify({ product_id: p2.id, quantity: 1 }),
    });
    assert(add2.status === 200, `guest add product 2 → ${add2.status}`);

    console.log('\n── 3. GUEST views cart — items persisted by device id ──');
    const guestCart = await j('/cart', { guestId });
    assert(guestCart.status === 200, `guest get cart → ${guestCart.status}`);
    const guestItems = guestCart.data?.data?.items || [];
    assert(guestItems.length === 2, `guest cart has 2 items (got ${guestItems.length})`);
    assert(guestCart.data?.data?.summary?.item_count === 3, `item_count 3 (got ${guestCart.data?.data?.summary?.item_count})`);
    const guestProductIds = guestItems.map(i => i.product_id);
    assert(guestProductIds.includes(p1.id) && guestProductIds.includes(p2.id), 'both products present');

    console.log('\n── 4. GUEST adds same product again → quantity stacks (2+1=3) ──');
    await j('/cart/items', {
      method: 'POST', guestId,
      body: JSON.stringify({ product_id: p1.id, quantity: 1 }),
    });
    const guestCart2 = await j('/cart', { guestId });
    const p1item = (guestCart2.data?.data?.items || []).find(i => i.product_id === p1.id);
    assert(p1item?.quantity === 3, `p1 quantity = 3 (got ${p1item?.quantity})`);

    console.log('\n── 5. Guest CANNOT hit order creation (mandatory login) ──');
    const orderAttempt = await j('/orders/create', {
      method: 'POST', guestId,
      body: JSON.stringify({ address_id: 1, payment_method: 'cod' }),
    });
    assert(orderAttempt.status === 401, `guest order attempt blocked → ${orderAttempt.status} (expect 401)`);

    console.log('\n── 6. Guest cart id is NOT usable for a DIFFERENT device ──');
    const otherGuest = await j('/cart', { guestId: 'some-other-device-111' });
    assert(otherGuest.status === 200, `other guest cart endpoint works → ${otherGuest.status}`);
    assert((otherGuest.data?.data?.items || []).length === 0, 'other device has empty cart');

    console.log('\n── 7. USER registers (new account) ──');
    const reg = await j('/auth/register', {
      method: 'POST',
      ip: '203.0.113.250',
      body: JSON.stringify({
        name: 'Guest Merge Tester',
        email: `guest-merge-${stamp}@example.com`,
        phone: '9000000061',
        password: 'Test@1234',
      }),
    });
    assert(reg.status === 201, `register → ${reg.status}`);
    userId = reg.data?.data?.user?.id;
    token = reg.data?.data?.accessToken;
    assert(!!token, 'got access token');

    console.log('\n── 8. User cart is empty BEFORE merge ──');
    const userCartBefore = await j('/cart', { token });
    assert((userCartBefore.data?.data?.items || []).length === 0, 'user cart empty before merge');

    console.log('\n── 9. MERGE guest cart (device id header) into user cart ──');
    const merge = await j('/cart/merge', { method: 'POST', token, guestId });
    assert(merge.status === 200, `merge → ${merge.status}`);
    assert(merge.data?.data?.merged === 2, `merged 2 unique items (got ${merge.data?.data?.merged})`);

    const userCartAfter = await j('/cart', { token });
    const userItems = userCartAfter.data?.data?.items || [];
    assert(userItems.length === 2, `user cart now has 2 items (got ${userItems.length})`);
    const up1 = userItems.find(i => i.product_id === p1.id);
    const up2 = userItems.find(i => i.product_id === p2.id);
    assert(up1?.quantity === 3, `p1 qty merged to 3 (got ${up1?.quantity})`);
    assert(up2?.quantity === 1, `p2 qty merged to 1 (got ${up2?.quantity})`);

    console.log('\n── 10. After merge, the guest cart row is GONE ──');
    const [guestRows] = await pool.query('SELECT id FROM cart WHERE guest_id = ?', [guestId]);
    assert(guestRows.length === 0, 'guest cart deleted after merge');

    console.log('\n── 11. Old guest id can no longer see the items ──');
    const staleGuest = await j('/cart', { guestId });
    assert((staleGuest.data?.data?.items || []).length === 0, 'stale guest id → empty cart');

    console.log('\n── 12. Merge with NO guest id → no-op success ──');
    const noMerge = await j('/cart/merge', { method: 'POST', token });
    assert(noMerge.status === 200, `merge without guest id → ${noMerge.status}`);
    assert(noMerge.data?.data?.merged === 0, 'merged 0 (nothing to merge)');

    console.log('\n── 13. Merge endpoint requires AUTH (guest cannot merge) ──');
    const unauthMerge = await j('/cart/merge', { method: 'POST', guestId });
    assert(unauthMerge.status === 401, `unauth merge blocked → ${unauthMerge.status} (expect 401)`);

    console.log('\n── 14. User can now place an order (payment flow authorized) ──');
    // Add an address so order creation can succeed end-to-end
    const addr = await j('/users/addresses', {
      method: 'POST', token,
      body: JSON.stringify({ name: 'Test', phone: '9000000061', house_no: '1', street: 'Test St', city: 'Mumbai', state: 'MH', pincode: '400001' }),
    });
    assert(addr.status === 201 || addr.status === 200, `address created → ${addr.status}`);
    const addrId = addr.data?.data?.address?.id || addr.data?.data?.id;
    const order = await j('/orders/create', {
      method: 'POST', token,
      body: JSON.stringify({ address_id: addrId, payment_method: 'cod' }),
    });
    assert(order.status === 201 || order.status === 200, `order created → ${order.status} (user CAN order after login)`);

    console.log('\n── ✅ ALL CHECKS DONE ──');
  } catch (err) {
    failed++;
    console.error('  ❌ Unexpected error:', err.message);
  } finally {
    try {
      if (userId) {
        // Delete dependent rows that block the user delete (orders → address)
        await pool.query(
          'DELETE FROM order_tracking WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)',
          [userId]
        ).catch(() => {});
        await pool.query(
          'DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)',
          [userId]
        ).catch(() => {});
        await pool.query('DELETE FROM orders WHERE user_id = ?', [userId]).catch(() => {});
        await pool.query('DELETE FROM addresses WHERE user_id = ?', [userId]).catch(() => {});
        await pool.query('DELETE FROM users WHERE id = ?', [userId]);
      }
      await pool.query('DELETE FROM cart WHERE guest_id = ?', [guestId]);
      console.log('\n  🧹 Test data cleaned up.');
    } catch (cleanErr) {
      console.error('  ⚠️ Cleanup failed:', cleanErr.message);
    }
    try { await pool.end(); } catch {}
    console.log(`\nRESULT: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }
})();
