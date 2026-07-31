const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');

/**
 * @swagger
 * /coupons:
 *   get:
 *     summary: Get all currently available/active coupons
 *     tags: [Coupons]
 *     responses:
 *       200:
 *         description: List of active coupons with code, type, value, and validity.
 */
router.get('/', couponController.getAvailableCoupons);

module.exports = router;
