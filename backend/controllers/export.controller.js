const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

// ── Helpers ──────────────────────────────────────────────────────────────────
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCSV(headers, rows) {
  const lines = [headers.map(escapeCSV).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escapeCSV(row[h])).join(','));
  }
  return lines.join('\r\n');
}

function sendCSV(res, filename, csvContent) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\uFEFF' + csvContent); // BOM for Excel UTF-8
}

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT — Orders
// ══════════════════════════════════════════════════════════════════════════════
const exportOrders = asyncHandler(async (req, res) => {
  const { status, from, to, format } = req.query;

  let where = 'WHERE 1=1';
  const params = [];

  if (status) {
    where += ' AND o.status = ?';
    params.push(status);
  }
  if (from) {
    where += ' AND o.created_at >= ?';
    params.push(from);
  }
  if (to) {
    where += ' AND o.created_at <= ?';
    params.push(to + ' 23:59:59');
  }

  const [orders] = await pool.query(
    `SELECT o.id, o.order_number, o.created_at, o.status, o.payment_method, o.payment_status,
            o.subtotal, o.coupon_code, o.coupon_discount, o.shipping_charge,
            o.tax_amount, o.total_amount, o.notes,
            u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
            a.name AS address_name, a.phone AS address_phone,
            a.house_no, a.street, a.city, a.state, a.pincode
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN addresses a ON o.address_id = a.id
     ${where}
     ORDER BY o.created_at DESC`,
    params
  );

  // Fetch items per order
  const orderIds = orders.map(o => o.id || []);
  let itemsByOrder = {};
  if (orderIds.length > 0) {
    const [allItems] = await pool.query(
      `SELECT oi.order_id, oi.product_name, oi.quantity, oi.unit_price, oi.total_price
       FROM order_items oi
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );
    for (const item of allItems) {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    }
  }

  const headers = [
    'Order Number', 'Date', 'Customer', 'Email', 'Phone',
    'Address', 'City', 'State', 'Pincode',
    'Items', 'Subtotal', 'Coupon', 'Coupon Discount',
    'Shipping', 'GST', 'Total',
    'Payment Method', 'Payment Status', 'Order Status', 'Notes'
  ];

  const rows = orders.map(o => ({
    'Order Number': o.order_number,
    'Date': o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '',
    'Customer': o.customer_name || '',
    'Email': o.customer_email || '',
    'Phone': o.address_phone || o.customer_phone || '',
    'Address': [o.house_no, o.street].filter(Boolean).join(', '),
    'City': o.city || '',
    'State': o.state || '',
    'Pincode': o.pincode || '',
    'Items': (itemsByOrder[o.id] || []).map(i => `${i.product_name} x${i.quantity}`).join('; '),
    'Subtotal': o.subtotal,
    'Coupon': o.coupon_code || '',
    'Coupon Discount': o.coupon_discount || 0,
    'Shipping': o.shipping_charge || 0,
    'GST': o.tax_amount || 0,
    'Total': o.total_amount,
    'Payment Method': o.payment_method || '',
    'Payment Status': o.payment_status || '',
    'Order Status': o.status || '',
    'Notes': o.notes || '',
  }));

  const csv = toCSV(headers, rows);
  const ts = new Date().toISOString().slice(0, 10);
  sendCSV(res, `orders-export-${ts}.csv`, csv);
});

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT — Products
// ══════════════════════════════════════════════════════════════════════════════
const exportProducts = asyncHandler(async (req, res) => {
  const [products] = await pool.query(
    `SELECT p.id, p.name, p.sku, p.slug, p.price, p.mrp, p.stock_quantity,
            p.brand, p.weight_grams, p.unit, p.is_active, p.is_featured,
            p.is_bestseller, p.is_seasonal, p.is_organic, p.region_origin,
            p.shelf_life_days, p.average_rating, p.review_count, p.total_sold,
            p.created_at, c.name AS category_name,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS primary_image
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     ORDER BY p.id ASC`
  );

  const headers = [
    'ID', 'Name', 'SKU', 'Slug', 'Price', 'MRP', 'Stock',
    'Brand', 'Weight (g)', 'Unit', 'Category', 'Region',
    'Shelf Life (days)', 'Active', 'Featured', 'Bestseller',
    'Seasonal', 'Organic', 'Rating', 'Reviews', 'Sold',
    'Primary Image', 'Created'
  ];

  const rows = products.map(p => ({
    'ID': p.id,
    'Name': p.name,
    'SKU': p.sku,
    'Slug': p.slug,
    'Price': p.price,
    'MRP': p.mrp,
    'Stock': p.stock_quantity,
    'Brand': p.brand || '',
    'Weight (g)': p.weight_grams || '',
    'Unit': p.unit || '',
    'Category': p.category_name || '',
    'Region': p.region_origin || '',
    'Shelf Life (days)': p.shelf_life_days || '',
    'Active': p.is_active ? 'Yes' : 'No',
    'Featured': p.is_featured ? 'Yes' : 'No',
    'Bestseller': p.is_bestseller ? 'Yes' : 'No',
    'Seasonal': p.is_seasonal ? 'Yes' : 'No',
    'Organic': p.is_organic ? 'Yes' : 'No',
    'Rating': p.average_rating || 0,
    'Reviews': p.review_count || 0,
    'Sold': p.total_sold || 0,
    'Primary Image': p.primary_image || '',
    'Created': p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : '',
  }));

  const csv = toCSV(headers, rows);
  const ts = new Date().toISOString().slice(0, 10);
  sendCSV(res, `products-export-${ts}.csv`, csv);
});

// ══════════════════════════════════════════════════════════════════════════════
// EXPORT — Users
// ══════════════════════════════════════════════════════════════════════════════
const exportUsers = asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.is_active,
            u.created_at,
            (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS order_count,
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE user_id = u.id AND payment_status = 'paid') AS total_spent
     FROM users u
     ORDER BY u.created_at DESC`
  );

  const headers = [
    'ID', 'Name', 'Email', 'Phone', 'Role', 'Active',
    'Orders', 'Total Spent', 'Joined'
  ];

  const rows = users.map(u => ({
    'ID': u.id,
    'Name': u.name || '',
    'Email': u.email || '',
    'Phone': u.phone || '',
    'Role': u.role || 'customer',
    'Active': u.is_active ? 'Yes' : 'No',
    'Orders': u.order_count || 0,
    'Total Spent': u.total_spent || 0,
    'Joined': u.created_at ? new Date(u.created_at).toLocaleString('en-IN') : '',
  }));

  const csv = toCSV(headers, rows);
  const ts = new Date().toISOString().slice(0, 10);
  sendCSV(res, `users-export-${ts}.csv`, csv);
});

// ══════════════════════════════════════════════════════════════════════════════
// IMPORT — Products from CSV
// ══════════════════════════════════════════════════════════════════════════════
const importProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    return ApiResponse.error(res, 'No CSV file uploaded.', 400);
  }

  const csvContent = req.file.buffer.toString('utf-8');
  const lines = csvContent.split(/\r?\n/).filter(l => l.trim());

  if (lines.length < 2) {
    return ApiResponse.error(res, 'CSV file is empty or has no data rows.', 400);
  }

  // Parse header
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const nameIdx = headers.findIndex(h => /name/i.test(h));
  const skuIdx = headers.findIndex(h => /sku/i.test(h));
  const priceIdx = headers.findIndex(h => /^price$/i.test(h));
  const mrpIdx = headers.findIndex(h => /mrp/i.test(h));
  const stockIdx = headers.findIndex(h => /stock/i.test(h));
  const categoryIdx = headers.findIndex(h => /category/i.test(h));
  const brandIdx = headers.findIndex(h => /brand/i.test(h));
  const weightIdx = headers.findIndex(h => /weight/i.test(h));
  const unitIdx = headers.findIndex(h => /unit/i.test(h));
  const regionIdx = headers.findIndex(h => /region/i.test(h));
  const shelfIdx = headers.findIndex(h => /shelf/i.test(h));
  const descIdx = headers.findIndex(h => /description/i.test(h));
  const activeIdx = headers.findIndex(h => /active/i.test(h));
  const featuredIdx = headers.findIndex(h => /featured/i.test(h));
  const bestsellerIdx = headers.findIndex(h => /bestseller/i.test(h));
  const seasonalIdx = headers.findIndex(h => /seasonal/i.test(h));
  const organicIdx = headers.findIndex(h => /organic/i.test(h));

  if (nameIdx === -1) {
    return ApiResponse.error(res, 'CSV must have a "Name" column.', 400);
  }

  // Parse CSV rows (handles quoted values)
  function parseCSVRow(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          result.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  // Build category name → id lookup
  const [categories] = await pool.query('SELECT id, name FROM categories');
  const catMap = {};
  let defaultCatId = null;
  for (const c of categories) {
    catMap[c.name.toLowerCase()] = c.id;
    if (c.name.toLowerCase() === 'uncategorized') defaultCatId = c.id;
  }
  // Fallback: use first category if no 'Uncategorized' exists
  if (!defaultCatId && categories.length > 0) defaultCatId = categories[0].id;

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVRow(lines[i]);
    if (cols.length === 0 || !cols[nameIdx]) { skipped++; continue; }

    const name = cols[nameIdx];
    const sku = skuIdx >= 0 ? cols[skuIdx] : '';
    const price = priceIdx >= 0 ? parseFloat(cols[priceIdx]) : 0;
    const mrp = mrpIdx >= 0 ? parseFloat(cols[mrpIdx]) : price;
    const stock = stockIdx >= 0 ? parseInt(cols[stockIdx], 10) : 0;
    const brand = brandIdx >= 0 ? cols[brandIdx] : null;
    const weight = weightIdx >= 0 ? parseInt(cols[weightIdx], 10) : null;
    const unit = unitIdx >= 0 ? cols[unitIdx] : 'piece';
    const region = regionIdx >= 0 ? cols[regionIdx] : null;
    const shelfLife = shelfIdx >= 0 ? parseInt(cols[shelfIdx], 10) : null;
    const description = descIdx >= 0 ? cols[descIdx] : null;
    const isActive = activeIdx >= 0 ? /^(yes|true|1)$/i.test(cols[activeIdx]) : true;
    const isFeatured = featuredIdx >= 0 ? /^(yes|true|1)$/i.test(cols[featuredIdx]) : false;
    const isBestseller = bestsellerIdx >= 0 ? /^(yes|true|1)$/i.test(cols[bestsellerIdx]) : false;
    const isSeasonal = seasonalIdx >= 0 ? /^(yes|true|1)$/i.test(cols[seasonalIdx]) : false;
    const isOrganic = organicIdx >= 0 ? /^(yes|true|1)$/i.test(cols[organicIdx]) : false;

    // Resolve category — default to 'Uncategorized' if not found
    let categoryId = defaultCatId;
    if (categoryIdx >= 0 && cols[categoryIdx]) {
      const catName = cols[categoryIdx].toLowerCase();
      if (catMap[catName]) categoryId = catMap[catName];
    }

    if (!name || !name.trim()) {
      skipped++;
      continue;
    }
    if (!price || price <= 0) {
      errors.push(`Row ${i + 1}: "${name}" — invalid price`);
      skipped++;
      continue;
    }

    try {
      // Check if product with same SKU or name already exists
      const [existing] = await pool.query(
        'SELECT id FROM products WHERE sku = ? OR name = ?',
        [sku || `__no_sku_${i}`, name]
      );

      if (existing.length > 0) {
        // UPDATE existing product
        await pool.query(
          `UPDATE products SET
            price = ?, mrp = ?, stock_quantity = ?, brand = ?,
            weight_grams = ?, unit = ?, region_origin = ?, shelf_life_days = ?,
            description = COALESCE(?, description),
            is_active = ?, is_featured = ?, is_bestseller = ?,
            is_seasonal = ?, is_organic = ?
           WHERE id = ?`,
          [price, mrp || price, stock, brand, weight, unit, region, shelfLife,
           description, isActive ? 1 : 0, isFeatured ? 1 : 0,
           isBestseller ? 1 : 0, isSeasonal ? 1 : 0, isOrganic ? 1 : 0,
           existing[0].id]
        );
        updated++;
      } else {
        // INSERT new product
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const genSku = sku || `KB-${Date.now().toString(36).toUpperCase()}-${i}`;
        await pool.query(
          `INSERT INTO products
            (name, sku, slug, price, mrp, stock_quantity, category_id,
             brand, weight_grams, unit, region_origin, shelf_life_days,
             description, is_active, is_featured, is_bestseller,
             is_seasonal, is_organic)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [name, genSku, slug, price, mrp || price, stock, categoryId,
           brand, weight, unit, region, shelfLife,
           description, isActive ? 1 : 0, isFeatured ? 1 : 0,
           isBestseller ? 1 : 0, isSeasonal ? 1 : 0, isOrganic ? 1 : 0]
        );
        created++;
      }
    } catch (err) {
      errors.push(`Row ${i + 1}: "${name}" — ${err.message}`);
      skipped++;
    }
  }

  return ApiResponse.success(res, {
    created,
    updated,
    skipped,
    errors: errors.slice(0, 20), // max 20 errors in response
    total_rows: lines.length - 1,
  }, `Import complete: ${created} created, ${updated} updated, ${skipped} skipped.`);
});

module.exports = {
  exportOrders,
  exportProducts,
  exportUsers,
  importProducts,
};
