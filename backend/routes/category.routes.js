const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all active categories with subcategories and product counts
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories with nested children and flat all array.
 */
router.get('/', categoryController.getCategories);

/**
 * @swagger
 * /categories/{slug}:
 *   get:
 *     summary: Get a single category by slug with children and parent info
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category with children and parent.
 *       404:
 *         description: Category not found.
 */
router.get('/:slug', categoryController.getCategoryBySlug);

/**
 * @swagger
 * /categories/{slug}/products:
 *   get:
 *     summary: Get products by category slug (paginated)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 24 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [price_asc, price_desc, rating, newest, bestseller] }
 *       - in: query
 *         name: min_price
 *         schema: { type: number }
 *       - in: query
 *         name: max_price
 *         schema: { type: number }
 *       - in: query
 *         name: rating
 *         schema: { type: number }
 *     responses:
 *       200:
 *         description: Paginated products in category.
 *       404:
 *         description: Category not found.
 */
router.get('/:slug/products', categoryController.getCategoryProducts);

module.exports = router;
