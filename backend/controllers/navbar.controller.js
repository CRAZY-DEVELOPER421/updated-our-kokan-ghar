const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Whitelist of updatable columns — blocks mass-assignment / SQL injection via keys
const ALLOWED_UPDATE_FIELDS = new Set(['label_key', 'label', 'href', 'sort_order', 'is_active']);

const normalize = (row) => ({
  id: row.id,
  label_key: row.label_key,
  label: row.label,
  href: row.href,
  sort_order: row.sort_order,
  is_active: !!row.is_active,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

// ── Public: active nav links in order (storefront navbar) ──
const getActiveItems = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM navbar_items WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
  );
  return ApiResponse.success(res, { items: rows.map(normalize) });
});

// ── Admin: all items ──
const getItems = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM navbar_items ORDER BY sort_order ASC, id ASC'
  );
  return ApiResponse.success(res, { items: rows.map(normalize) });
});

const createItem = asyncHandler(async (req, res) => {
  const { label_key = null, label, href, is_active = 1 } = req.body;

  if (!label || !String(label).trim()) {
    return ApiResponse.error(res, 'Label is required.', 400);
  }
  if (!href || !String(href).trim() || !String(href).startsWith('/')) {
    return ApiResponse.error(res, 'Href must be a valid path starting with "/".', 400);
  }

  // Append to the end of the active order
  const [maxRow] = await pool.query('SELECT MAX(sort_order) as m FROM navbar_items');
  const sortOrder = (maxRow[0]?.m || 0) + 1;

  const [result] = await pool.query(
    'INSERT INTO navbar_items (label_key, label, href, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
    [label_key || null, String(label).trim(), String(href).trim(), sortOrder, is_active ? 1 : 0]
  );

  return ApiResponse.created(res, { id: result.insertId }, 'Navbar item created.');
});

const updateItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || key === 'id' || !ALLOWED_UPDATE_FIELDS.has(key)) continue;
    if (key === 'href' && value && !String(value).startsWith('/')) {
      return ApiResponse.error(res, 'Href must be a valid path starting with "/".', 400);
    }
    if (key === 'label' && value !== undefined && !String(value).trim()) {
      return ApiResponse.error(res, 'Label cannot be empty.', 400);
    }
    fields.push(`${key} = ?`);
    values.push(key === 'is_active' ? (value ? 1 : 0) : value);
  }

  if (fields.length === 0) {
    return ApiResponse.error(res, 'Nothing to update.', 400);
  }

  values.push(id);
  await pool.query(`UPDATE navbar_items SET ${fields.join(', ')} WHERE id = ?`, values);

  return ApiResponse.success(res, {}, 'Navbar item updated.');
});

const deleteItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM navbar_items WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Navbar item deleted.');
});

// ── Reorder: accepts { orderedIds: [id, id, ...] } and rewrites sort_order 1..n ──
const reorderItems = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return ApiResponse.error(res, 'orderedIds array is required.', 400);
  }

  for (let i = 0; i < orderedIds.length; i++) {
    const id = parseInt(orderedIds[i], 10);
    if (!id) return ApiResponse.error(res, 'Invalid id in orderedIds.', 400);
    await pool.query('UPDATE navbar_items SET sort_order = ? WHERE id = ?', [i + 1, id]);
  }

  return ApiResponse.success(res, {}, 'Navbar order updated.');
});

module.exports = {
  getActiveItems,
  getItems,
  createItem,
  updateItem,
  deleteItem,
  reorderItems,
};
