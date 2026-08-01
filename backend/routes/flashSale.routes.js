const express = require('express');
const router = express.Router();
const flashSaleController = require('../controllers/flashSale.controller');

/**
 * @swagger
 * /flash-sales:
 *   get:
 *     summary: Get currently active flash sales with product info and end time
 *     tags: [Flash Sales]
 *     responses:
 *       200:
 *         description: List of active flash sales with sale price, original price, and ends_at.
 */
router.get('/', flashSaleController.getActiveFlashSales);

module.exports = router;
