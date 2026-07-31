const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');

/**
 * @swagger
 * /banners:
 *   get:
 *     summary: Get active banners (optionally filtered by position)
 *     tags: [Banners]
 *     parameters:
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by banner position (e.g., hero)
 *     responses:
 *       200:
 *         description: List of active banners.
 */
router.get('/', bannerController.getBanners);

module.exports = router;
