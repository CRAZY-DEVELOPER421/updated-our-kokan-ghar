const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit a contact form message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, subject, message]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Your message has been received.
 *       400:
 *         description: Please fill in all required fields.
 */
router.post('/', contactController.submitContact);

module.exports = router;
