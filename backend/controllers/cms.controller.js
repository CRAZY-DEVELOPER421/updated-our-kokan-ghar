const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { generateUniqueSlug } = require('../utils/generateSlug');

// ======================================================================
// TEAM MEMBERS
// ======================================================================
const getTeamMembers = asyncHandler(async (req, res) => {
  const { featured, active } = req.query;
  let where = [];
  let params = [];

  if (active !== 'false') { where.push('is_active = 1'); }

  if (featured === 'true') { where.push('is_featured = 1'); }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const [members] = await pool.query(
    `SELECT * FROM team_members ${whereClause} ORDER BY display_order ASC, joining_date DESC`,
    params
  );

  return ApiResponse.success(res, { members });
});

const getTeamMemberById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [members] = await pool.query('SELECT * FROM team_members WHERE id = ?', [id]);
  if (members.length === 0) return ApiResponse.error(res, 'Member not found.', 404);
  return ApiResponse.success(res, { member: members[0] });
});

const createTeamMember = asyncHandler(async (req, res) => {
  const {
    name, designation, short_bio, biography, email, phone, image_url,
    instagram, facebook, linkedin, youtube, twitter,
    experience_years, skills, specialization, achievements, certifications,
    joining_date, is_active, is_featured, display_order
  } = req.body;

  if (!name) return ApiResponse.error(res, 'Name is required.', 400);

  const [result] = await pool.query(
    `INSERT INTO team_members (name, designation, short_bio, biography, email, phone, image_url,
      instagram, facebook, linkedin, youtube, twitter, experience_years, skills, specialization,
      achievements, certifications, joining_date, is_active, is_featured, display_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, designation, short_bio, biography, email, phone, image_url,
      instagram, facebook, linkedin, youtube, twitter,
      experience_years || 0, skills, specialization, achievements, certifications,
      joining_date || null, is_active !== undefined ? is_active : 1,
      is_featured || 0, display_order || 0]
  );

  return ApiResponse.created(res, { id: result.insertId }, 'Team member created.');
});

const updateTeamMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return ApiResponse.error(res, 'No fields to update.', 400);

  values.push(id);
  await pool.query(`UPDATE team_members SET ${fields.join(', ')} WHERE id = ?`, values);
  return ApiResponse.success(res, {}, 'Team member updated.');
});

const deleteTeamMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM team_members WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Team member deleted.');
});

const reorderTeamMembers = asyncHandler(async (req, res) => {
  const { order } = req.body; // [{id: 1, display_order: 0}, ...]
  if (!Array.isArray(order)) return ApiResponse.error(res, 'Order array is required.', 400);

  for (const item of order) {
    await pool.query('UPDATE team_members SET display_order = ? WHERE id = ?', [item.display_order, item.id]);
  }

  return ApiResponse.success(res, {}, 'Order updated.');
});

// ======================================================================
// BLOG CATEGORIES
// ======================================================================
const getBlogCategories = asyncHandler(async (req, res) => {
  const [categories] = await pool.query(
    'SELECT *, (SELECT COUNT(*) FROM blogs WHERE category_id = bc.id) as blog_count FROM blog_categories bc ORDER BY name ASC'
  );
  return ApiResponse.success(res, { categories });
});

const createBlogCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) return ApiResponse.error(res, 'Name is required.', 400);
  const slug = await generateUniqueSlug(name, 'blog_categories', pool);
  const [result] = await pool.query('INSERT INTO blog_categories (name, slug, description) VALUES (?, ?, ?)', [name, slug, description]);
  return ApiResponse.created(res, { id: result.insertId, slug }, 'Category created.');
});

const updateBlogCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const fields = []; const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (fields.length === 0) return ApiResponse.error(res, 'No fields.', 400);
  values.push(id);
  await pool.query(`UPDATE blog_categories SET ${fields.join(', ')} WHERE id = ?`, values);
  return ApiResponse.success(res, {}, 'Category updated.');
});

const deleteBlogCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM blog_categories WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Category deleted.');
});

// ======================================================================
// BLOGS
// ======================================================================
const getBlogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { category, featured, search } = req.query;

  let where = [];
  let params = [];

  if (category) { where.push('b.category_id = ?'); params.push(category); }
  if (featured === 'true') { where.push('b.is_featured = 1'); }
  if (search) { where.push('(b.title LIKE ? OR b.excerpt LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  if (!req.query.all) { where.push('b.is_published = 1'); }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const [count] = await pool.query(`SELECT COUNT(*) as total FROM blogs b ${whereClause}`, params);

  const [blogs] = await pool.query(
    `SELECT b.*, bc.name as category_name, bc.slug as category_slug
     FROM blogs b
     LEFT JOIN blog_categories bc ON b.category_id = bc.id
     ${whereClause}
     ORDER BY b.is_featured DESC, b.published_at DESC, b.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return ApiResponse.paginated(res, { blogs }, {
    page, limit, total: count[0].total, pages: Math.ceil(count[0].total / limit)
  });
});

const getBlogBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const [blogs] = await pool.query(
    `SELECT b.*, bc.name as category_name, bc.slug as category_slug
     FROM blogs b LEFT JOIN blog_categories bc ON b.category_id = bc.id WHERE b.slug = ?`,
    [slug]
  );
  if (blogs.length === 0) return ApiResponse.error(res, 'Blog not found.', 404);

  await pool.query('UPDATE blogs SET view_count = view_count + 1 WHERE id = ?', [blogs[0].id]);

  // Get related blogs
  const [related] = await pool.query(
    `SELECT id, title, slug, excerpt, hero_image, published_at FROM blogs
     WHERE is_published = 1 AND id != ? AND (category_id = ? OR FIND_IN_SET(?, COALESCE(tags,'')) > 0)
     ORDER BY RAND() LIMIT 3`,
    [blogs[0].id, blogs[0].category_id, blogs[0].tags ? blogs[0].tags.split(',')[0] : '']
  );

  blogs[0].related = related;
  return ApiResponse.success(res, { blog: blogs[0] });
});

const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [blogs] = await pool.query(
    `SELECT b.*, bc.name as category_name FROM blogs b LEFT JOIN blog_categories bc ON b.category_id = bc.id WHERE b.id = ?`,
    [id]
  );
  if (blogs.length === 0) return ApiResponse.error(res, 'Blog not found.', 404);
  return ApiResponse.success(res, { blog: blogs[0] });
});

const createBlog = asyncHandler(async (req, res) => {
  const { title, excerpt, content, category_id, author_name, author_avatar, hero_image, tags, is_published, is_featured, meta_title, meta_description, og_image, canonical_url } = req.body;
  if (!title) return ApiResponse.error(res, 'Title is required.', 400);

  const slug = await generateUniqueSlug(title, 'blogs', pool);
  const contentStr = content ? (typeof content === 'string' ? content : JSON.stringify(content)) : null;

  const [result] = await pool.query(
    `INSERT INTO blogs (title, slug, excerpt, content, category_id, author_name, author_avatar, hero_image, tags,
      is_published, is_featured, meta_title, meta_description, og_image, canonical_url, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, excerpt, contentStr, category_id || null, author_name, author_avatar, hero_image, tags,
      is_published ? 1 : 0, is_featured ? 1 : 0, meta_title, meta_description, og_image, canonical_url,
      is_published ? new Date() : null]
  );

  return ApiResponse.created(res, { id: result.insertId, slug }, 'Blog created.');
});

const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id' && key !== 'slug') {
      const val = key === 'content' ? (typeof value === 'string' ? value : JSON.stringify(value)) : value;
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (updates.is_published && !updates.published_at) {
    fields.push('published_at = ?');
    values.push(new Date());
  }

  if (fields.length === 0) return ApiResponse.error(res, 'No fields to update.', 400);

  values.push(id);
  await pool.query(`UPDATE blogs SET ${fields.join(', ')} WHERE id = ?`, values);
  return ApiResponse.success(res, {}, 'Blog updated.');
});

const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM blogs WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Blog deleted.');
});

// ======================================================================
// VIDEO CATEGORIES
// ======================================================================
const getVideoCategories = asyncHandler(async (req, res) => {
  const [categories] = await pool.query(
    'SELECT *, (SELECT COUNT(*) FROM videos WHERE category_id = vc.id) as video_count FROM video_categories vc ORDER BY name ASC'
  );
  return ApiResponse.success(res, { categories });
});

const createVideoCategory = asyncHandler(async (req, res) => {
  const { name, type, description } = req.body;
  if (!name) return ApiResponse.error(res, 'Name is required.', 400);
  const slug = await generateUniqueSlug(name, 'video_categories', pool);
  const [result] = await pool.query(
    'INSERT INTO video_categories (name, slug, type, description) VALUES (?, ?, ?, ?)',
    [name, slug, type || 'long', description]
  );
  return ApiResponse.created(res, { id: result.insertId, slug }, 'Category created.');
});

const updateVideoCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, type, description } = req.body;
  const fields = []; const values = [];
  if (name !== undefined) { fields.push('name = ?'); values.push(name); }
  if (type !== undefined) { fields.push('type = ?'); values.push(type); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (fields.length === 0) return ApiResponse.error(res, 'No fields.', 400);
  values.push(id);
  await pool.query(`UPDATE video_categories SET ${fields.join(', ')} WHERE id = ?`, values);
  return ApiResponse.success(res, {}, 'Category updated.');
});

const deleteVideoCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM video_categories WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Category deleted.');
});

// ======================================================================
// VIDEOS
// ======================================================================
const getVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const { category, type, featured, search } = req.query;

  let where = [];
  let params = [];

  if (category) { where.push('v.category_id = ?'); params.push(category); }
  if (type) { where.push('vc.type = ?'); params.push(type); }
  if (featured === 'true') { where.push('v.is_featured = 1'); }
  if (search) { where.push('v.title LIKE ?'); params.push(`%${search}%`); }

  if (!req.query.all) { where.push('v.is_published = 1'); }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const [count] = await pool.query(`SELECT COUNT(*) as total FROM videos v LEFT JOIN video_categories vc ON v.category_id = vc.id ${whereClause}`, params);

  const [videos] = await pool.query(
    `SELECT v.*, vc.name as category_name, vc.type as category_type
     FROM videos v
     LEFT JOIN video_categories vc ON v.category_id = vc.id
     ${whereClause}
     ORDER BY v.is_featured DESC, v.published_at DESC, v.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return ApiResponse.paginated(res, { videos }, {
    page, limit, total: count[0].total, pages: Math.ceil(count[0].total / limit)
  });
});

const getVideoBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const [videos] = await pool.query(
    `SELECT v.*, vc.name as category_name, vc.type as category_type
     FROM videos v LEFT JOIN video_categories vc ON v.category_id = vc.id WHERE v.slug = ?`,
    [slug]
  );
  if (videos.length === 0) return ApiResponse.error(res, 'Video not found.', 404);

  await pool.query('UPDATE videos SET view_count = view_count + 1 WHERE id = ?', [videos[0].id]);

  const [related] = await pool.query(
    `SELECT id, title, slug, thumbnail_url, duration_seconds, view_count FROM videos
     WHERE is_published = 1 AND id != ? AND category_id = ?
     ORDER BY RAND() LIMIT 6`,
    [videos[0].id, videos[0].category_id]
  );

  videos[0].related = related;
  return ApiResponse.success(res, { video: videos[0] });
});

const getVideoById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [videos] = await pool.query(
    `SELECT v.*, vc.name as category_name FROM videos v LEFT JOIN video_categories vc ON v.category_id = vc.id WHERE v.id = ?`,
    [id]
  );
  if (videos.length === 0) return ApiResponse.error(res, 'Video not found.', 404);
  return ApiResponse.success(res, { video: videos[0] });
});

const createVideo = asyncHandler(async (req, res) => {
  const { title, description, video_url, thumbnail_url, category_id, tags, duration_seconds, is_published, is_featured, meta_title, meta_description, og_image, scheduled_at } = req.body;
  if (!title || !video_url) return ApiResponse.error(res, 'Title and video_url are required.', 400);

  const slug = await generateUniqueSlug(title, 'videos', pool);

  const [result] = await pool.query(
    `INSERT INTO videos (title, slug, description, video_url, thumbnail_url, category_id, tags, duration_seconds,
      is_published, is_featured, meta_title, meta_description, og_image, scheduled_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, slug, description, video_url, thumbnail_url, category_id || null, tags, duration_seconds || 0,
      is_published ? 1 : 0, is_featured ? 1 : 0, meta_title, meta_description, og_image,
      scheduled_at || null, is_published ? new Date() : null]
  );

  return ApiResponse.created(res, { id: result.insertId, slug }, 'Video created.');
});

const updateVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const fields = []; const values = [];

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && key !== 'id' && key !== 'slug') {
      fields.push(`${key} = ?`); values.push(value);
    }
  }

  if (updates.is_published && !updates.published_at) {
    fields.push('published_at = ?'); values.push(new Date());
  }

  if (fields.length === 0) return ApiResponse.error(res, 'No fields.', 400);
  values.push(id);
  await pool.query(`UPDATE videos SET ${fields.join(', ')} WHERE id = ?`, values);
  return ApiResponse.success(res, {}, 'Video updated.');
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM videos WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Video deleted.');
});

const incrementVideoLike = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE videos SET like_count = like_count + 1 WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Liked.');
});

const incrementVideoShare = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE videos SET share_count = share_count + 1 WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Share counted.');
});

// ======================================================================
// MEDIA LIBRARY
// ======================================================================
const getMediaItems = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const { type, search } = req.query;

  let where = []; let params = [];
  if (type) { where.push('type = ?'); params.push(type); }
  if (search) { where.push('(original_name LIKE ? OR alt_text LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

  const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

  const [count] = await pool.query(`SELECT COUNT(*) as total FROM media_library ${whereClause}`, params);

  const [items] = await pool.query(
    `SELECT * FROM media_library ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return ApiResponse.paginated(res, { items }, {
    page, limit, total: count[0].total, pages: Math.ceil(count[0].total / limit)
  });
});

const createMediaItem = asyncHandler(async (req, res) => {
  const { filename, original_name, url, type, mime_type, file_size, alt_text } = req.body;
  if (!filename || !url) return ApiResponse.error(res, 'filename and url are required.', 400);

  const [result] = await pool.query(
    'INSERT INTO media_library (filename, original_name, url, type, mime_type, file_size, alt_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [filename, original_name || filename, url, type || 'image', mime_type, file_size || 0, alt_text]
  );

  return ApiResponse.created(res, { id: result.insertId }, 'Media item added.');
});

const updateMediaItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { alt_text, original_name } = req.body;
  const fields = []; const values = [];
  if (alt_text !== undefined) { fields.push('alt_text = ?'); values.push(alt_text); }
  if (original_name !== undefined) { fields.push('original_name = ?'); values.push(original_name); }
  if (fields.length === 0) return ApiResponse.error(res, 'No fields.', 400);
  values.push(id);
  await pool.query(`UPDATE media_library SET ${fields.join(', ')} WHERE id = ?`, values);
  return ApiResponse.success(res, {}, 'Media item updated.');
});

const deleteMediaItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM media_library WHERE id = ?', [id]);
  return ApiResponse.success(res, {}, 'Media item deleted.');
});

module.exports = {
  // Team Members
  getTeamMembers, getTeamMemberById, createTeamMember, updateTeamMember, deleteTeamMember, reorderTeamMembers,
  // Blog Categories
  getBlogCategories, createBlogCategory, updateBlogCategory, deleteBlogCategory,
  // Blogs
  getBlogs, getBlogBySlug, getBlogById, createBlog, updateBlog, deleteBlog,
  // Video Categories
  getVideoCategories, createVideoCategory, updateVideoCategory, deleteVideoCategory,
  // Videos
  getVideos, getVideoBySlug, getVideoById, createVideo, updateVideo, deleteVideo, incrementVideoLike, incrementVideoShare,
  // Media Library
  getMediaItems, createMediaItem, updateMediaItem, deleteMediaItem,
};
