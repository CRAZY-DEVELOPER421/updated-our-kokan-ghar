const express = require('express');
const router = express.Router();
const heroSlideController = require('../controllers/heroSlide.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /hero-slides:
 *   get:
 *     summary: Get active hero slides for the storefront
 *     tags: [Hero Slides]
 *     responses:
 *       200:
 *         description: List of active hero slides ordered by sort_order.
 */
router.get('/', heroSlideController.getActiveSlides);

/**
 * @swagger
 * /hero-slides/all:
 *   get:
 *     summary: Get all hero slides (admin)
 *     tags: [Hero Slides]
 *     security:
 *       - bearerAuth: []
 */
router.get('/all', verifyToken, isAdmin, heroSlideController.getSlides);

/**
 * @swagger
 * /hero-slides:
 *   post:
 *     summary: Create a hero slide (admin)
 *     tags: [Hero Slides]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', verifyToken, isAdmin, heroSlideController.createSlide);

/**
 * @swagger
 * /hero-slides/{id}:
 *   put:
 *     summary: Update a hero slide (admin)
 *     tags: [Hero Slides]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', verifyToken, isAdmin, heroSlideController.updateSlide);

/**
 * @swagger
 * /hero-slides/{id}:
 *   delete:
 *     summary: Delete a hero slide (admin)
 *     tags: [Hero Slides]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', verifyToken, isAdmin, heroSlideController.deleteSlide);

module.exports = router;
