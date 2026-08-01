const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Content is stored as JSON string — parse safely
const parseContent = (content) => {
  if (!content) return null;
  if (typeof content === 'object') return content;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
};

// ===== PUBLIC =====

const getPublicPages = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, service_key, title, page_type, content, sort_order, updated_at
     FROM customer_service_pages
     WHERE is_active = 1
     ORDER BY sort_order ASC, id ASC`
  );
  const pages = rows.map((r) => ({ ...r, content: parseContent(r.content) }));
  return ApiResponse.success(res, { pages });
});

const getPublicPageByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const [rows] = await pool.query(
    `SELECT id, service_key, title, page_type, content, sort_order, updated_at
     FROM customer_service_pages
     WHERE service_key = ? AND is_active = 1`,
    [key]
  );
  if (rows.length === 0) {
    return ApiResponse.error(res, 'Page not found.', 404);
  }
  const page = { ...rows[0], content: parseContent(rows[0].content) };
  return ApiResponse.success(res, { page });
});

// ===== ADMIN =====

const getAdminPages = asyncHandler(async (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM customer_service_pages';
  const params = [];
  if (search) {
    query += ' WHERE title LIKE ? OR service_key LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY sort_order ASC, id ASC';
  const [rows] = await pool.query(query, params);
  const pages = rows.map((r) => ({ ...r, content: parseContent(r.content) }));
  return ApiResponse.success(res, { pages });
});

const getAdminPageById = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM customer_service_pages WHERE id = ?', [req.params.id]);
  if (rows.length === 0) {
    return ApiResponse.error(res, 'Page not found.', 404);
  }
  const page = { ...rows[0], content: parseContent(rows[0].content) };
  return ApiResponse.success(res, { page });
});

const createPage = asyncHandler(async (req, res) => {
  const { service_key, title, page_type, content, is_active, sort_order } = req.body;

  if (!service_key || !String(service_key).trim()) {
    return ApiResponse.error(res, 'Service key is required.', 400);
  }
  if (!title || !String(title).trim()) {
    return ApiResponse.error(res, 'Title is required.', 400);
  }

  const key = String(service_key).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');

  // Re-validate after sanitization (e.g. "???" → "" would otherwise slip through)
  if (!key) {
    return ApiResponse.error(res, 'Service key must contain at least one letter or number.', 400);
  }

  // Unique key check
  const [existing] = await pool.query('SELECT id FROM customer_service_pages WHERE service_key = ?', [key]);
  if (existing.length > 0) {
    return ApiResponse.error(res, 'A page with this service key already exists.', 409);
  }

  const [result] = await pool.query(
    `INSERT INTO customer_service_pages (service_key, title, page_type, content, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      key,
      String(title).trim(),
      page_type === 'faq' ? 'faq' : 'text',
      content ? JSON.stringify(content) : null,
      is_active === undefined ? 1 : (is_active ? 1 : 0),
      sort_order || 0,
    ]
  );

  const [rows] = await pool.query('SELECT * FROM customer_service_pages WHERE id = ?', [result.insertId]);
  const page = { ...rows[0], content: parseContent(rows[0].content) };
  return ApiResponse.success(res, { page }, 'Page created successfully.', 201);
});

const updatePage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { service_key, title, page_type, content, is_active, sort_order } = req.body;

  const [existing] = await pool.query('SELECT id FROM customer_service_pages WHERE id = ?', [id]);
  if (existing.length === 0) {
    return ApiResponse.error(res, 'Page not found.', 404);
  }

  const fields = [];
  const params = [];

  if (service_key !== undefined) {
    const key = String(service_key).trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if (!key) {
      return ApiResponse.error(res, 'Service key must contain at least one letter or number.', 400);
    }
    const [dup] = await pool.query(
      'SELECT id FROM customer_service_pages WHERE service_key = ? AND id != ?',
      [key, id]
    );
    if (dup.length > 0) {
      return ApiResponse.error(res, 'A page with this service key already exists.', 409);
    }
    fields.push('service_key = ?');
    params.push(key);
  }
  if (title !== undefined) {
    if (!String(title).trim()) return ApiResponse.error(res, 'Title is required.', 400);
    fields.push('title = ?');
    params.push(String(title).trim());
  }
  if (page_type !== undefined) {
    fields.push('page_type = ?');
    params.push(page_type === 'faq' ? 'faq' : 'text');
  }
  if (content !== undefined) {
    fields.push('content = ?');
    params.push(JSON.stringify(content));
  }
  if (is_active !== undefined) {
    fields.push('is_active = ?');
    params.push(is_active ? 1 : 0);
  }
  if (sort_order !== undefined) {
    fields.push('sort_order = ?');
    params.push(sort_order || 0);
  }

  if (fields.length === 0) {
    return ApiResponse.error(res, 'No fields to update.', 400);
  }

  params.push(id);
  await pool.query(`UPDATE customer_service_pages SET ${fields.join(', ')} WHERE id = ?`, params);

  const [rows] = await pool.query('SELECT * FROM customer_service_pages WHERE id = ?', [id]);
  const page = { ...rows[0], content: parseContent(rows[0].content) };
  return ApiResponse.success(res, { page }, 'Page updated successfully.');
});

const deletePage = asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM customer_service_pages WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) {
    return ApiResponse.error(res, 'Page not found.', 404);
  }
  return ApiResponse.success(res, {}, 'Page deleted successfully.');
});

module.exports = {
  getPublicPages,
  getPublicPageByKey,
  getAdminPages,
  getAdminPageById,
  createPage,
  updatePage,
  deletePage,
};
