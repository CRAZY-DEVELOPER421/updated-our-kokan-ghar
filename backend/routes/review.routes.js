const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { verifyToken } = require('../middleware/auth');

/**
 * @swagger
 * /reviews/{id}/helpful:
 *   post:
 *     summary: Vote a review as helpful or unhelpful (toggle)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_helpful]
 *             properties:
 *               is_helpful:
 *                 type: boolean
 *                 description: true for helpful, false for unhelpful
 *     responses:
 *       200:
 *         description: Vote recorded or removed.
 *       401:
 *         description: Unauthorized.
 */
router.post('/:id/helpful', verifyToken, reviewController.voteHelpful);

module.exports = router;
