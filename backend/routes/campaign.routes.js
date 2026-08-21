const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaign.controller');

/**
 * @swagger
 * /campaigns:
 *   get:
 *     summary: Get active festive campaign landing pages (menu order)
 *     tags: [Campaigns]
 *     responses:
 *       200:
 *         description: List of currently active campaigns.
 */
router.get('/', campaignController.getActiveCampaigns);

/**
 * @swagger
 * /campaigns/{slug}:
 *   get:
 *     summary: Get a single campaign page by slug with its curated products
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Campaign details + product list (with flash-sale info).
 *       404:
 *         description: Campaign not found.
 */
router.get('/:slug', campaignController.getCampaignBySlug);

module.exports = router;
