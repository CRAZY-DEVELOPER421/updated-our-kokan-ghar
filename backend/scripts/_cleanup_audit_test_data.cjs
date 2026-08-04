// Clean up test data created during the end-to-end audit (test user, orders, review, etc.)
const pool = require('../config/db');

(async () => {
  // Test user id=7 (testaudit@konkan.in), orders 11 & 12, review id=9
  const steps = [
    ['DELETE FROM reviews WHERE id = 9', 'review 9'],
    ['DELETE FROM order_tracking WHERE order_id IN (11, 12)', 'tracking 11,12'],
    ['DELETE FROM order_items WHERE order_id IN (11, 12)', 'items 11,12'],
    ['DELETE FROM orders WHERE id IN (11, 12)', 'orders 11,12'],
    ['DELETE FROM addresses WHERE id = 5', 'address 5'],
    ['DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE user_id = 7)', 'cart items (user7)'],
    ['DELETE FROM carts WHERE user_id = 7', 'carts (user7)'],
    ['DELETE FROM wishlist_items WHERE user_id = 7', 'wishlist (user7)'],
    ['DELETE FROM notifications WHERE user_id = 7', 'notifications (user7)'],
    ['DELETE FROM users WHERE id = 7', 'user 7'],
  ];
  for (const [q, label] of steps) {
    try {
      const [r] = await pool.query(q);
      console.log(`✓ ${label}: ${r.affectedRows}`);
    } catch (e) {
      console.log(`✗ ${label}: ${e.message}`);
    }
  }
  console.log('\nCleanup done.');
  process.exit(0);
})().catch(e => { console.error('Cleanup error:', e.message); process.exit(1); });
