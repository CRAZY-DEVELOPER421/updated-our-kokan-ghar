const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

// Whitelist of updatable columns — blocks mass-assignment / SQL injection via keys
const ALLOWED_UPDATE_FIELDS = new Set(['media_type', 'image_url', 'video_url', 'blocks', 'sort_order', 'is_active']);
const MEDIA_TYPES = new Set(['image', 'video']);

const normalize = (row) => {
  let blocks = [];
  try {
    blocks = typeof row.blocks === 'string' ? JSON.parse(row.blocks) : row.blocks;
    if (!Array.isArray(blocks)) blocks = [];
  } catch {
    blocks = [];
  }
  return {
    id: row.id,
    media_type: row.media_type,
    image_url: row.image_url,
    video_url: row.video_url,
    blocks,
    sort_order: row.sort_order,
    is_active: !!row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

// ── Public: active slides (storefront hero) ──
const getActiveSlides = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order ASC'
  );
  return ApiResponse.success(res, { slides: rows.map(normalize) });
});

// ── Admin: all slides ──
const getSlides = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC'
  );
  return ApiResponse.success(res, { slides: rows.map(normalize) });
});

const createSlide = asyncHandler(async (req, res) => {
  const {
    media_type = 'image',
    image_url = null,
    video_url = null,
    blocks = [],
    sort_order = 0,
    is_active = 1,
  } = req.body;

  if (!Array.isArray(blocks)) {
    return ApiResponse.error(res, 'blocks must be an array.', 400);
  }
  if (!MEDIA_TYPES.has(media_type)) {
    return ApiResponse.error(res, 'media_type must be image or video.', 400);
  }

  const [result] = await pool.query(
    `INSERT INTO hero_slides (media_type, image_url, video_url, blocks, sort_order, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [media_type, image_url, video_url, JSON.stringify(blocks), sort_order, is_active]
  );

  return ApiResponse.created(res, { id: result.insertId }, 'Hero slide created.');
});

const updateSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || key === 'id' || !ALLOWED_UPDATE_FIELDS.has(key)) continue;
    if (key === 'blocks') {
      if (!Array.isArray(value)) return ApiResponse.error(res, 'blocks must be an array.', 400);
      fields.push('blocks = ?');
      values.push(JSON.stringify(value));
    } else {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) {
    return ApiResponse.error(res, 'No fields to update.', 400);
  }

  values.push(id);
  await pool.query(`UPDATE hero_slides SET ${fields.join(', ')} WHERE id = ?`, values);

  return ApiResponse.success(res, { id: Number(id) }, 'Hero slide updated.');
});

const deleteSlide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM hero_slides WHERE id = ?', [id]);
  return ApiResponse.success(res, null, 'Hero slide deleted.');
});

module.exports = {
  getActiveSlides,
  getSlides,
  createSlide,
  updateSlide,
  deleteSlide,
};
