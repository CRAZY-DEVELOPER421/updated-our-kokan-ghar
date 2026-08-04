// ============================================================
// SEED ORDER USAGE — sample orders that used coupons
// Idempotent: safe to re-run (skips order_numbers that exist).
//
// Purpose:
//   • Populates the "N people used today" counter on coupon cards
//     (GET /api/coupons counts coupon_usage where used_at >= CURDATE()).
//   • Populates the "Recently Used Offers" section (GET /api/orders
//     returns orders with coupon_code for the logged-in user).
//
// Mirrors the real createOrder flow: order → items → tracking →
// coupon_usage row → coupons.used_count increment.
//
// Run:  node scripts/seed-order-usage.js
// ============================================================
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mysql = require('mysql2/promise');

// Sample orders across real customer users. createdDaysAgo: 0 = today
// (so the "used today" counter shows data), >0 = older orders.
// coupon_discount is the actual amount applied at checkout.
const ORDERS = [
  {
    order_number: 'KB-2026-0101',
    user_id: 2, // Ramesh Gaonkar
    address_name: 'Ramesh Gaonkar', phone: '9820012345',
    coupon_code: 'KONKAN100',
    coupon_discount: 100.00,
    status: 'delivered', payment_method: 'cod', payment_status: 'paid',
    createdDaysAgo: 0,
    items: [
      { product_id: 1, quantity: 1 }, // Devgad Alphonso Mango box
    ],
    itemsSubtotal: 1899,
  },
  {
    order_number: 'KB-2026-0102',
    user_id: 3, // Priya Tendulkar
    address_name: 'Priya Tendulkar', phone: '9890012345',
    coupon_code: 'FIRST20',
    coupon_discount: 199.80,
    status: 'delivered', payment_method: 'online', payment_status: 'paid',
    createdDaysAgo: 0,
    items: [
      { product_id: 2, quantity: 1 }, // Ratnagiri Alphonso family pack
    ],
    itemsSubtotal: 999,
  },
  {
    order_number: 'KB-2026-0103',
    user_id: 5, // Anita Desai
    address_name: 'Anita Desai', phone: '9765012345',
    coupon_code: 'FREESHIP',
    coupon_discount: 0.00,
    status: 'shipped', payment_method: 'online', payment_status: 'paid',
    createdDaysAgo: 0,
    items: [
      { product_id: 24, quantity: 1 }, // Sundried Bombil
      { product_id: 25, quantity: 1 }, // Sundried Prawns
    ],
    itemsSubtotal: 1048,
  },
  {
    order_number: 'KB-2026-0104',
    user_id: 6, // Nikhil Gupta
    address_name: 'Nikhil Gupta', phone: '9637012345',
    coupon_code: 'WELCOME15',
    coupon_discount: 89.85,
    status: 'confirmed', payment_method: 'online', payment_status: 'paid',
    createdDaysAgo: 0,
    items: [
      { product_id: 3, quantity: 1 }, // Mango pulp
    ],
    itemsSubtotal: 599,
  },
  {
    order_number: 'KB-2026-0105',
    user_id: 2,
    address_name: 'Ramesh Gaonkar', phone: '9820012345',
    coupon_code: 'CASHEW50',
    coupon_discount: 50.00,
    status: 'delivered', payment_method: 'cod', payment_status: 'paid',
    createdDaysAgo: 2,
    items: [
      { product_id: 13, quantity: 1 }, // Mango jam
      { product_id: 14, quantity: 1 }, // Amchur
    ],
    itemsSubtotal: 328,
  },
  {
    order_number: 'KB-2026-0106',
    user_id: 3,
    address_name: 'Priya Tendulkar', phone: '9890012345',
    coupon_code: 'SEAFOOD10',
    coupon_discount: 79.80,
    status: 'processing', payment_method: 'online', payment_status: 'paid',
    createdDaysAgo: 1,
    items: [
      { product_id: 24, quantity: 1 }, // Bombil
      { product_id: 26, quantity: 1 }, // Bangda mackerel
    ],
    itemsSubtotal: 798,
  },
  {
    order_number: 'KB-2026-0107',
    user_id: 5,
    address_name: 'Anita Desai', phone: '9765012345',
    coupon_code: 'FESTIVE25',
    coupon_discount: 749.75,
    status: 'delivered', payment_method: 'online', payment_status: 'paid',
    createdDaysAgo: 3,
    items: [
      { product_id: 4, quantity: 1 }, // Alphonso Mango Gift Hamper
    ],
    itemsSubtotal: 2999,
  },
  {
    order_number: 'KB-2026-0108',
    user_id: 6,
    address_name: 'Nikhil Gupta', phone: '9637012345',
    coupon_code: 'KONKAN100',
    coupon_discount: 100.00,
    status: 'pending', payment_method: 'cod', payment_status: 'pending',
    createdDaysAgo: 0,
    items: [
      { product_id: 8, quantity: 1 }, // Dried mango slices
      { product_id: 11, quantity: 1 }, // Mango squash
    ],
    itemsSubtotal: 598,
  },
  {
    order_number: 'KB-2026-0109',
    user_id: 2,
    address_name: 'Ramesh Gaonkar', phone: '9820012345',
    coupon_code: 'BOGOSNACKS',
    coupon_discount: 0.00,
    status: 'delivered', payment_method: 'cod', payment_status: 'paid',
    createdDaysAgo: 5,
    items: [
      { product_id: 13, quantity: 3 }, // Mango jam ×3 (BOGO snack deal)
    ],
    itemsSubtotal: 597,
  },
  {
    order_number: 'KB-2026-0110',
    user_id: 3,
    address_name: 'Priya Tendulkar', phone: '9890012345',
    coupon_code: 'FIRST20',
    coupon_discount: 200.00, // capped at max_discount 200
    status: 'shipped', payment_method: 'online', payment_status: 'paid',
    createdDaysAgo: 0,
    items: [
      { product_id: 7, quantity: 1 }, // Kesar mango
      { product_id: 10, quantity: 1 }, // Totapuri mango
    ],
    itemsSubtotal: 1048,
  },
];

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'konkan_bazaar',
    connectTimeout: 8000,
  });

  // Resolve product name/image/price for order_items (product_name is NOT NULL)
  const productInfo = {};
  const [allProducts] = await c.query(
    'SELECT id, name, price, (SELECT image_url FROM product_images WHERE product_id = id AND is_primary = 1 LIMIT 1) AS image FROM products'
  );
  for (const p of allProducts) productInfo[p.id] = p;

  let orderCount = 0;
  let usageCount = 0;
  const skipped = [];

  for (const o of ORDERS) {
    // Idempotency: skip order numbers that already exist
    const [existing] = await c.query('SELECT id FROM orders WHERE order_number = ?', [o.order_number]);
    if (existing.length > 0) {
      skipped.push(o.order_number);
      continue;
    }

    // Ensure an address exists for this user (address_id is NOT NULL)
    const [addrRows] = await c.query(
      'SELECT id FROM addresses WHERE user_id = ? AND is_default = 1 LIMIT 1',
      [o.user_id]
    );
    let addressId;
    if (addrRows.length > 0) {
      addressId = addrRows[0].id;
    } else {
      const [addr] = await c.query(
        `INSERT INTO addresses (user_id, name, phone, house_no, street, city, state, pincode, is_default, address_type)
         VALUES (?, ?, ?, 'H-12', 'Konkan Nagar, Market Road', 'Ratnagiri', 'Maharashtra', '415612', 1, 'home')`,
        [o.user_id, o.address_name, o.phone]
      );
      addressId = addr.insertId;
    }

    const createdDaysAgo = o.createdDaysAgo || 0;
    const createdSql = createdDaysAgo === 0
      ? 'NOW()'
      : `DATE_SUB(NOW(), INTERVAL ${createdDaysAgo} DAY)`;

    const subtotal = o.itemsSubtotal;
    const shipping = 0;
    const tax = 0;
    const total = subtotal - o.coupon_discount + shipping + tax;

    const [orderResult] = await c.query(
      `INSERT INTO orders (order_number, user_id, address_id, status, subtotal, discount_amount, coupon_code, coupon_discount, shipping_charge, tax_amount, total_amount, payment_method, payment_status, notes, estimated_delivery, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(${createdSql}, INTERVAL 5 DAY), ${createdSql})`,
      [o.order_number, o.user_id, addressId, o.status, subtotal, o.coupon_discount, o.coupon_code, o.coupon_discount, shipping, tax, total, o.payment_method, o.payment_status, `Sample order using ${o.coupon_code}`]
    );
    const orderId = orderResult.insertId;

    // Order items — use each product's real price for unit_price
    for (const item of o.items) {
      const p = productInfo[item.product_id] || { name: `Product #${item.product_id}`, image: null, price: 0 };
      const unitPrice = Number(p.price) || 0;
      await c.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, variant_info, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, NULL, ?, ?, ?)`,
        [orderId, item.product_id, p.name, p.image || null, item.quantity, unitPrice, unitPrice * item.quantity]
      );
      await c.query(
        'UPDATE products SET stock_quantity = stock_quantity - ?, total_sold = total_sold + ? WHERE id = ?',
        [item.quantity, item.quantity, item.product_id]
      );
    }

    // Tracking row (mirrors createOrder) — created_at must be interpolated SQL
    await c.query(
      `INSERT INTO order_tracking (order_id, status, message, created_at) VALUES (?, ?, ?, ${createdSql})`,
      [orderId, o.status, `Order ${o.status === 'pending' ? 'placed' : o.status}.`]
    );

    // Coupon usage row + used_count increment (mirrors createOrder)
    const [couponRows] = await c.query('SELECT id FROM coupons WHERE code = ?', [o.coupon_code]);
    if (couponRows.length > 0) {
      await c.query(
        `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied, used_at) VALUES (?, ?, ?, ?, ${createdSql})`,
        [couponRows[0].id, o.user_id, orderId, o.coupon_discount]
      );
      await c.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [couponRows[0].id]);
      usageCount++;
    }

    orderCount++;
  }

  console.log(`✅ Orders seeded: ${orderCount} (coupon_usage rows: ${usageCount})`);
  if (skipped.length > 0) {
    console.log(`   Skipped (already exist): ${skipped.join(', ')}`);
  }

  // Summary: used_today per coupon + total coupon orders
  const [todayCounts] = await c.query(
    `SELECT cu.coupon_id, cp.code, COUNT(*) AS used_today
     FROM coupon_usage cu
     JOIN coupons cp ON cp.id = cu.coupon_id
     WHERE cu.used_at >= CURDATE()
     GROUP BY cu.coupon_id, cp.code
     ORDER BY used_today DESC`
  );
  const [[counts]] = await c.query(
    `SELECT
       (SELECT COUNT(*) FROM orders) AS total_orders,
       (SELECT COUNT(*) FROM orders WHERE coupon_code IS NOT NULL AND coupon_code != '') AS coupon_orders,
       (SELECT COUNT(*) FROM coupon_usage) AS total_usage`
  );

  console.log('\n📊 Used-today counter per coupon:');
  for (const row of todayCounts) {
    console.log(`   ${row.code}: ${row.used_today} ${row.used_today === 1 ? 'person' : 'people'} used today`);
  }
  console.log('\n📊 Totals:');
  console.log(`   Orders: ${counts.total_orders} (${counts.coupon_orders} with coupons)`);
  console.log(`   coupon_usage rows: ${counts.total_usage}`);

  await c.end();
  console.log('Done.');
})().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
