const express = require('express');
const router = express.Router();
const cms = require('../controllers/cms.controller');

// ===== PUBLIC PUBLIC PUBLIC PUBLIC PUBLIC PUBLIC PUBLIC PUBLIC =====
// Public routes (no auth needed - placed first to avoid auth conflict)

/**
 * @swagger
 * /cms/team:
 *   get:
 *     summary: Get all team members (public)
 *     tags: [CMS - Team]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema: { type: string, default: 'true' }
 *       - in: query
 *         name: featured
 *         schema: { type: string, enum: ['true'] }
 *     responses:
 *       200:
 *         description: List of team members.
 */
router.get('/team', cms.getTeamMembers);

/**
 * @swagger
 * /cms/team/{id}:
 *   get:
 *     summary: Get a team member by ID (public)
 *     tags: [CMS - Team]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Team member details.
 *       404:
 *         description: Member not found.
 */
router.get('/team/:id', cms.getTeamMemberById);

/**
 * @swagger
 * /cms/blog-categories:
 *   get:
 *     summary: Get all blog categories with post counts (public)
 *     tags: [CMS - Blog]
 *     responses:
 *       200:
 *         description: List of blog categories.
 */
router.get('/blog-categories', cms.getBlogCategories);

/**
 * @swagger
 * /cms/blogs:
 *   get:
 *     summary: Get published blogs (paginated, public)
 *     tags: [CMS - Blog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: category
 *         schema: { type: integer }
 *       - in: query
 *         name: featured
 *         schema: { type: string, enum: ['true'] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated blogs.
 */
router.get('/blogs', cms.getBlogs);

/**
 * @swagger
 * /cms/blogs/slug/{slug}:
 *   get:
 *     summary: Get a blog post by slug (public)
 *     tags: [CMS - Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Blog post with related articles.
 *       404:
 *         description: Blog not found.
 */
router.get('/blogs/slug/:slug', cms.getBlogBySlug);

/**
 * @swagger
 * /cms/video-categories:
 *   get:
 *     summary: Get all video categories with video counts (public)
 *     tags: [CMS - Video]
 *     responses:
 *       200:
 *         description: List of video categories.
 */
router.get('/video-categories', cms.getVideoCategories);

/**
 * @swagger
 * /cms/videos:
 *   get:
 *     summary: Get published videos (paginated, public)
 *     tags: [CMS - Video]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: category
 *         schema: { type: integer }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: featured
 *         schema: { type: string, enum: ['true'] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated videos.
 */
router.get('/videos', cms.getVideos);

/**
 * @swagger
 * /cms/videos/slug/{slug}:
 *   get:
 *     summary: Get a video by slug (public)
 *     tags: [CMS - Video]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Video with related videos.
 *       404:
 *         description: Video not found.
 */
router.get('/videos/slug/:slug', cms.getVideoBySlug);

/**
 * @swagger
 * /cms/videos/{id}/like:
 *   post:
 *     summary: Increment video like count (public)
 *     tags: [CMS - Video]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Liked.
 */
router.post('/videos/:id/like', cms.incrementVideoLike);

/**
 * @swagger
 * /cms/videos/{id}/share:
 *   post:
 *     summary: Increment video share count (public)
 *     tags: [CMS - Video]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Share counted.
 */
router.post('/videos/:id/share', cms.incrementVideoShare);

/**
 * @swagger
 * /cms/media:
 *   get:
 *     summary: Get media library items (paginated, public)
 *     tags: [CMS - Media]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated media items.
 */
router.get('/media', cms.getMediaItems);

// ===== ADMIN ADMIN ADMIN ADMIN ADMIN ADMIN ADMIN ADMIN =====
const { verifyToken, isAdmin } = require('../middleware/auth');

// ===== TEAM (ADMIN) =====

/**
 * @swagger
 * /cms/team:
 *   post:
 *     summary: Create a team member (admin)
 *     tags: [CMS - Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               designation: { type: string }
 *               short_bio: { type: string }
 *               biography: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               image_url: { type: string }
 *               instagram: { type: string }
 *               facebook: { type: string }
 *               linkedin: { type: string }
 *               youtube: { type: string }
 *               twitter: { type: string }
 *               experience_years: { type: integer }
 *               skills: { type: string }
 *               specialization: { type: string }
 *               achievements: { type: string }
 *               certifications: { type: string }
 *               joining_date: { type: string, format: date }
 *               is_active: { type: boolean }
 *               is_featured: { type: boolean }
 *               display_order: { type: integer }
 *     responses:
 *       201:
 *         description: Team member created.
 *       400:
 *         description: Name is required.
 */
router.post('/team', verifyToken, isAdmin, cms.createTeamMember);

/**
 * @swagger
 * /cms/team/{id}:
 *   put:
 *     summary: Update a team member (admin)
 *     tags: [CMS - Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               designation: { type: string }
 *               short_bio: { type: string }
 *               biography: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               image_url: { type: string }
 *               instagram: { type: string }
 *               facebook: { type: string }
 *               linkedin: { type: string }
 *               youtube: { type: string }
 *               twitter: { type: string }
 *               experience_years: { type: integer }
 *               skills: { type: string }
 *               specialization: { type: string }
 *               achievements: { type: string }
 *               certifications: { type: string }
 *               joining_date: { type: string, format: date }
 *               is_active: { type: boolean }
 *               is_featured: { type: boolean }
 *               display_order: { type: integer }
 *     responses:
 *       200:
 *         description: Team member updated.
 */
router.put('/team/:id', verifyToken, isAdmin, cms.updateTeamMember);

/**
 * @swagger
 * /cms/team/{id}:
 *   delete:
 *     summary: Delete a team member (admin)
 *     tags: [CMS - Team]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Team member deleted.
 */
router.delete('/team/:id', verifyToken, isAdmin, cms.deleteTeamMember);

/**
 * @swagger
 * /cms/team/reorder:
 *   put:
 *     summary: Reorder team members (admin)
 *     tags: [CMS - Team]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order]
 *             properties:
 *               order:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: integer }
 *                     display_order: { type: integer }
 *     responses:
 *       200:
 *         description: Order updated.
 */
router.put('/team/reorder', verifyToken, isAdmin, cms.reorderTeamMembers);

// ===== BLOG CATEGORIES (ADMIN) =====

/**
 * @swagger
 * /cms/blog-categories:
 *   post:
 *     summary: Create a blog category (admin)
 *     tags: [CMS - Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Category created.
 */
router.post('/blog-categories', verifyToken, isAdmin, cms.createBlogCategory);

/**
 * @swagger
 * /cms/blog-categories/{id}:
 *   put:
 *     summary: Update a blog category (admin)
 *     tags: [CMS - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Category updated.
 */
router.put('/blog-categories/:id', verifyToken, isAdmin, cms.updateBlogCategory);

/**
 * @swagger
 * /cms/blog-categories/{id}:
 *   delete:
 *     summary: Delete a blog category (admin)
 *     tags: [CMS - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Category deleted.
 */
router.delete('/blog-categories/:id', verifyToken, isAdmin, cms.deleteBlogCategory);

// ===== BLOGS (ADMIN) =====

/**
 * @swagger
 * /cms/blogs/{id}:
 *   get:
 *     summary: Get a blog by ID (admin)
 *     tags: [CMS - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Blog post.
 *       404:
 *         description: Blog not found.
 */
router.get('/blogs/:id', verifyToken, isAdmin, cms.getBlogById);

/**
 * @swagger
 * /cms/blogs:
 *   post:
 *     summary: Create a blog post (admin)
 *     tags: [CMS - Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string }
 *               category_id: { type: integer }
 *               author_name: { type: string }
 *               author_avatar: { type: string }
 *               hero_image: { type: string }
 *               tags: { type: string }
 *               is_published: { type: boolean }
 *               is_featured: { type: boolean }
 *               meta_title: { type: string }
 *               meta_description: { type: string }
 *               meta_keywords: { type: string }
 *               og_image: { type: string }
 *               canonical_url: { type: string }
 *     responses:
 *       201:
 *         description: Blog created.
 */
router.post('/blogs', verifyToken, isAdmin, cms.createBlog);

/**
 * @swagger
 * /cms/blogs/{id}:
 *   put:
 *     summary: Update a blog post (admin)
 *     tags: [CMS - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               excerpt: { type: string }
 *               content: { type: string }
 *               category_id: { type: integer }
 *               author_name: { type: string }
 *               author_avatar: { type: string }
 *               hero_image: { type: string }
 *               tags: { type: string }
 *               is_published: { type: boolean }
 *               is_featured: { type: boolean }
 *               meta_title: { type: string }
 *               meta_description: { type: string }
 *               meta_keywords: { type: string }
 *               og_image: { type: string }
 *               canonical_url: { type: string }
 *     responses:
 *       200:
 *         description: Blog updated.
 */
router.put('/blogs/:id', verifyToken, isAdmin, cms.updateBlog);

/**
 * @swagger
 * /cms/blogs/{id}:
 *   delete:
 *     summary: Delete a blog post (admin)
 *     tags: [CMS - Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Blog deleted.
 */
router.delete('/blogs/:id', verifyToken, isAdmin, cms.deleteBlog);

// ===== VIDEO CATEGORIES (ADMIN) =====

/**
 * @swagger
 * /cms/video-categories:
 *   post:
 *     summary: Create a video category (admin)
 *     tags: [CMS - Video]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               type: { type: string, enum: [long, short] }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Category created.
 */
router.post('/video-categories', verifyToken, isAdmin, cms.createVideoCategory);

/**
 * @swagger
 * /cms/video-categories/{id}:
 *   put:
 *     summary: Update a video category (admin)
 *     tags: [CMS - Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               type: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Category updated.
 */
router.put('/video-categories/:id', verifyToken, isAdmin, cms.updateVideoCategory);

/**
 * @swagger
 * /cms/video-categories/{id}:
 *   delete:
 *     summary: Delete a video category (admin)
 *     tags: [CMS - Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Category deleted.
 */
router.delete('/video-categories/:id', verifyToken, isAdmin, cms.deleteVideoCategory);

// ===== VIDEOS (ADMIN) =====

/**
 * @swagger
 * /cms/videos/{id}:
 *   get:
 *     summary: Get a video by ID (admin)
 *     tags: [CMS - Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Video details.
 *       404:
 *         description: Video not found.
 */
router.get('/videos/:id', verifyToken, isAdmin, cms.getVideoById);

/**
 * @swagger
 * /cms/videos:
 *   post:
 *     summary: Create a video (admin)
 *     tags: [CMS - Video]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, video_url]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               video_url: { type: string }
 *               thumbnail_url: { type: string }
 *               category_id: { type: integer }
 *               tags: { type: string }
 *               duration_seconds: { type: integer }
 *               is_published: { type: boolean }
 *               is_featured: { type: boolean }
 *               meta_title: { type: string }
 *               meta_description: { type: string }
 *               meta_keywords: { type: string }
 *               og_image: { type: string }
 *               scheduled_at: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Video created.
 */
router.post('/videos', verifyToken, isAdmin, cms.createVideo);

/**
 * @swagger
 * /cms/videos/{id}:
 *   put:
 *     summary: Update a video (admin)
 *     tags: [CMS - Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               video_url: { type: string }
 *               thumbnail_url: { type: string }
 *               category_id: { type: integer }
 *               tags: { type: string }
 *               duration_seconds: { type: integer }
 *               is_published: { type: boolean }
 *               is_featured: { type: boolean }
 *               meta_title: { type: string }
 *               meta_description: { type: string }
 *               meta_keywords: { type: string }
 *               og_image: { type: string }
 *               scheduled_at: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Video updated.
 */
router.put('/videos/:id', verifyToken, isAdmin, cms.updateVideo);

/**
 * @swagger
 * /cms/videos/{id}:
 *   delete:
 *     summary: Delete a video (admin)
 *     tags: [CMS - Video]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Video deleted.
 */
router.delete('/videos/:id', verifyToken, isAdmin, cms.deleteVideo);

// ===== MEDIA LIBRARY (ADMIN) =====

/**
 * @swagger
 * /cms/media:
 *   post:
 *     summary: Add a media item (admin)
 *     tags: [CMS - Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [filename, url]
 *             properties:
 *               filename: { type: string }
 *               original_name: { type: string }
 *               url: { type: string }
 *               type: { type: string, default: 'image' }
 *               mime_type: { type: string }
 *               file_size: { type: integer }
 *               alt_text: { type: string }
 *     responses:
 *       201:
 *         description: Media item added.
 */
router.post('/media', verifyToken, isAdmin, cms.createMediaItem);

/**
 * @swagger
 * /cms/media/{id}:
 *   put:
 *     summary: Update a media item (admin)
 *     tags: [CMS - Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               alt_text: { type: string }
 *               original_name: { type: string }
 *     responses:
 *       200:
 *         description: Media item updated.
 */
router.put('/media/:id', verifyToken, isAdmin, cms.updateMediaItem);

/**
 * @swagger
 * /cms/media/{id}:
 *   delete:
 *     summary: Delete a media item (admin)
 *     tags: [CMS - Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Media item deleted.
 */
router.delete('/media/:id', verifyToken, isAdmin, cms.deleteMediaItem);

module.exports = router;
