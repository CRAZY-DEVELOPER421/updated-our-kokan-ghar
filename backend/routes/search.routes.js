const express = require('express');
const router = express.Router();
const multer = require('multer');
const searchController = require('../controllers/search.controller');

// Memory storage for image search — no need to save to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'), false);
    }
  },
});

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search products with filters and pagination
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (min 2 characters)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 24 }
 *       - in: query
 *         name: category
 *         schema: { type: integer }
 *       - in: query
 *         name: min_price
 *         schema: { type: number }
 *       - in: query
 *         name: max_price
 *         schema: { type: number }
 *       - in: query
 *         name: rating
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [price_asc, price_desc, rating, newest, relevance] }
 *     responses:
 *       200:
 *         description: Paginated search results.
 *       400:
 *         description: Search query must be at least 2 characters.
 */
router.get('/', searchController.search);

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions (products and categories)
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Partial search term
 *     responses:
 *       200:
 *         description: Product and category suggestions.
 */
router.get('/suggestions', searchController.getSuggestions);

/**
 * @swagger
 * /search/trending:
 *   get:
 *     summary: Get trending search terms (last 7 days)
 *     tags: [Search]
 *     responses:
 *       200:
 *         description: Trending search terms.
 */
router.get('/trending', searchController.getTrending);

/**
 * @swagger
 * /search/image:
 *   post:
 *     summary: Search products by image (visual similarity)
 *     tags: [Search]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Visually similar products.
 */
router.post('/image', upload.single('image'), searchController.searchByImage);

module.exports = router;
