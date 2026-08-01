const express = require('express');
const router = express.Router();
const customerService = require('../controllers/customerService.controller');

/**
 * @swagger
 * /customer-service:
 *   get:
 *     summary: Get all active customer service pages (public)
 *     tags: [Customer Service]
 *     responses:
 *       200:
 *         description: List of active service pages.
 */
router.get('/', customerService.getPublicPages);

/**
 * @swagger
 * /customer-service/{key}:
 *   get:
 *     summary: Get a customer service page by key (public)
 *     tags: [Customer Service]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Service page details.
 *       404:
 *         description: Page not found.
 */
router.get('/:key', customerService.getPublicPageByKey);

module.exports = router;
