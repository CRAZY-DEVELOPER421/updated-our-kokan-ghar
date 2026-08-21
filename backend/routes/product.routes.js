const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken } = require('../middleware/auth');
const { reviewValidation } = require('../middleware/validate');
const backInStockService = require('../services/backInStock.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products with filtering, sorting, and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 24
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category slug or ID
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *       - in: query
 *         name: rating
 *         schema:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, rating, newest, bestseller, discount]
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: organic
 *         schema:
 *           type: string
 *           enum: ['true']
 *       - in: query
 *         name: seasonal
 *         schema:
 *           type: string
 *           enum: ['true']
 *       - in: query
 *         name: featured
 *         schema:
 *           type: string
 *           enum: ['true']
 *     responses:
 *       200:
 *         description: Paginated list of products.
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /products/deals:
 *   get:
 *     summary: Get deal products under ₹999 with active discounts
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of deal products sorted by discount desc.
 */
router.get('/deals', productController.getDealsUnder999);

/**
 * @swagger
 * /products/category-deals:
 *   get:
 *     summary: Get categories with products under a price threshold (default ₹499)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of categories with min price and product count.
 */
router.get('/category-deals', productController.getCategoryDeals);

/**
 * @swagger
 * /products/random:
 *   get:
 *     summary: Get random products with optional category/price filters
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Paginated list of random/matching products.
 */
router.get('/random', productController.getRandomProducts);

/**
 * @swagger
 * /products/featured:
 *   get:
 *     summary: Get featured products (up to 12)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of featured products.
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * @swagger
 * /products/bestsellers:
 *   get:
 *     summary: Get bestseller products (up to 12)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of bestseller products.
 */
router.get('/bestsellers', productController.getBestsellers);

/**
 * @swagger
 * /products/seasonal:
 *   get:
 *     summary: Get seasonal products (up to 12)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of seasonal products.
 */
router.get('/seasonal', productController.getSeasonalProducts);

/**
 * @swagger
 * /products/new-arrivals:
 *   get:
 *     summary: Get new arrivals (up to 12)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of new arrival products.
 */
router.get('/new-arrivals', productController.getNewArrivals);

/**
 * @swagger
 * /products/regions:
 *   get:
 *     summary: Get all product regions with live product counts (Shop by Region)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of regions (region_origin) with product count, starting price and a representative image.
 */
router.get('/regions', productController.getRegions);

/**
 * @swagger
 * /products/filters:
 *   get:
 *     summary: Get distinct brands and regions for the product filter sidebar
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lists of distinct brands and region_origin values.
 */
router.get('/filters', productController.getFilterOptions);

/**
 * @swagger
 * /products/{slug}:
 *   get:
 *     summary: Get a single product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details with images, variants, tags, and flash sale info.
 *       404:
 *         description: Product not found.
 */
// ── Back-in-Stock Notifications ───────────────────────────
/**
 * @swagger
 * /products/{id}/notify:
 *   post:
 *     summary: Subscribe to back-in-stock notification
 *     tags: [Products]
 */
router.post('/:id/notify', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const userEmail = email || req.user?.email;

  if (!userEmail) {
    return ApiResponse.error(res, 'Email is required. Please log in or provide your email.', 400);
  }

  const result = await backInStockService.subscribe(parseInt(id), req.user, userEmail);

  if (result.success) {
    return ApiResponse.success(res, { subscribed: true }, result.message);
  }
  return ApiResponse.error(res, result.message, 400);
}));

/**
 * @swagger
 * /products/{id}/notify:
 *   get:
 *     summary: Check if current user/email is subscribed for back-in-stock
 *     tags: [Products]
 */
router.get('/:id/notify', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const email = req.query.email || req.user?.email;

  if (!email) return ApiResponse.success(res, { subscribed: false });

  const result = await backInStockService.checkSubscription(parseInt(id), email);
  return ApiResponse.success(res, result);
}));

router.get('/:slug', productController.getProductBySlug);

/**
 * @swagger
 * /products/{id}/related:
 *   get:
 *     summary: Get related products by category (up to 8)
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of related products.
 */
router.get('/:id/related', productController.getRelatedProducts);

/**
 * @swagger
 * /products/{id}/reviews:
 *   get:
 *     summary: Get product reviews (paginated) with rating stats
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated reviews with rating distribution.
 */
router.get('/:id/reviews', productController.getProductReviews);

/**
 * @swagger
 * /products/{id}/reviews:
 *   post:
 *     summary: Add a review to a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rating]
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               body:
 *                 type: string
 *                 maxLength: 5000
 *     responses:
 *       201:
 *         description: Review submitted successfully.
 *       400:
 *         description: You have already reviewed this product.
 *       401:
 *         description: Unauthorized.
 */
router.post('/:id/reviews', verifyToken, reviewValidation, productController.createReview);

module.exports = router;
