const express = require('express');
const router = express.Router();
const bankOfferController = require('../controllers/bankOffer.controller');

/**
 * @swagger
 * /bank-offers:
 *   get:
 *     summary: Get currently active bank offers
 *     tags: [Bank Offers]
 *     responses:
 *       200:
 *         description: List of active bank offers with bank name, offer text, and conditions.
 */
router.get('/', bankOfferController.getBankOffers);

module.exports = router;
