const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getDashboard = asyncHandler(async (req, res) => {
  const [totalUsers] = await pool.query('SELECT COUNT(*) as total FROM users');
  const [newUsers] = await pool.query('SELECT COUNT(*) as total FROM users WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)');
  const [totalProducts] = await pool.query('SELECT COUNT(*) as total FROM products WHERE is_active = 1');
  const [totalOrders] = await pool.query('SELECT COUNT(*) as total FROM orders');
  const [pendingOrders] = await pool.query("SELECT COUNT(*) as total FROM orders WHERE status IN ('pending','confirmed','processing')");
  const [revenue] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'");
  const [todayRevenue] = await pool.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid' AND DATE(created_at) = CURDATE()");

  const [ordersByStatus] = await pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status');
  const [monthlyRevenue] = await pool.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COALESCE(SUM(total_amount), 0) as revenue
     FROM orders WHERE payment_status = 'paid' AND created_at > DATE_SUB(NOW(), INTERVAL 12 MONTH)
     GROUP BY month ORDER BY month ASC`
  );

  const [recentOrders] = await pool.query(
    'SELECT o.*, u.name as user_name FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 10'
  );

  const [lowStockProducts] = await pool.query(
    `SELECT id, name, slug, stock_quantity, sku,
            low_stock_threshold, critical_stock_threshold
     FROM products
     WHERE is_active = 1
       AND stock_quantity <= COALESCE(low_stock_threshold, 10)
     ORDER BY stock_quantity ASC LIMIT 10`
  );

  return ApiResponse.success(res, {
    stats: {
      total_users: totalUsers[0].total,
      new_users: newUsers[0].total,
      total_products: totalProducts[0].total,
      total_orders: totalOrders[0].total,
      pending_orders: pendingOrders[0].total,
      total_revenue: revenue[0].total,
      today_revenue: todayRevenue[0].total
    },
    orders_by_status: ordersByStatus,
    monthly_revenue: monthlyRevenue,
    recent_orders: recentOrders,
    low_stock_products: lowStockProducts
  });
});

const getTopProducts = asyncHandler(async (req, res) => {
  const [products] = await pool.query(
    `SELECT p.id, p.name, p.slug, p.price, p.mrp, p.total_sold, p.average_rating, p.review_count, p.stock_quantity,
      (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as image
     FROM products p WHERE p.is_active = 1
     ORDER BY p.total_sold DESC LIMIT 20`
  );

  return ApiResponse.success(res, { products });
});

const getCategoryPerformance = asyncHandler(async (req, res) => {
  const [categories] = await pool.query(
    `SELECT c.id, c.name, c.slug,
      COUNT(DISTINCT p.id) as product_count,
      COALESCE(SUM(oi.quantity), 0) as units_sold,
      COALESCE(SUM(oi.total_price), 0) as revenue
     FROM categories c
     LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
     LEFT JOIN order_items oi ON p.id = oi.product_id
     LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
     GROUP BY c.id
     ORDER BY revenue DESC`
  );

  return ApiResponse.success(res, { categories });
});

const getSearchTerms = asyncHandler(async (req, res) => {
  const [terms] = await pool.query(
    `SELECT query, COUNT(*) as search_count, AVG(results_count) as avg_results
     FROM search_logs WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY query ORDER BY search_count DESC LIMIT 50`
  );

  return ApiResponse.success(res, { terms });
});

// Cancellation reasons breakdown — free market research for the admin.
// Groups cancelled orders by orders.cancel_reason (e.g. delivery_time_too_long).
const getCancellationReasons = asyncHandler(async (req, res) => {
  const [reasons] = await pool.query(
    `SELECT
       COALESCE(NULLIF(cancel_reason, ''), 'unknown') as reason,
       COUNT(*) as count
     FROM orders
     WHERE status = 'cancelled'
     GROUP BY reason
     ORDER BY count DESC`
  );

  const [totalCancelled] = await pool.query(
    "SELECT COUNT(*) as total FROM orders WHERE status = 'cancelled'"
  );

  // Readable labels for the chart legend
  const LABELS = {
    delivery_time_too_long: 'Delivery time too long',
    found_cheaper_elsewhere: 'Found cheaper elsewhere',
    ordered_by_mistake: 'Ordered by mistake',
    changed_my_mind: 'Changed my mind',
    price_too_high: 'Price too high',
    payment_issue: 'Payment issue',
    other: 'Other',
    unknown: 'Not specified',
  };

  return ApiResponse.success(res, {
    reasons: reasons.map((r) => ({
      reason: r.reason,
      label: LABELS[r.reason] || r.reason,
      count: Number(r.count),
    })),
    total_cancelled: Number(totalCancelled[0].total),
  });
});

module.exports = {
  getDashboard,
  getTopProducts,
  getCategoryPerformance,
  getSearchTerms,
  getCancellationReasons
};
