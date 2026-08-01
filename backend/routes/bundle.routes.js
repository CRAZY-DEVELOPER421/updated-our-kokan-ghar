const express = require('express');
const router = express.Router();
const bundleController = require('../controllers/bundle.controller');

/**
 * @swagger
 * /bundles:
 *   get:
 *     summary: Get active bundle deals (combos) with their products
 *     tags: [Bundles]
 *     responses:
 *       200:
 *         description: List of active bundles.
 */
router.get('/', bundleController.getActiveBundles);

module.exports = router;
