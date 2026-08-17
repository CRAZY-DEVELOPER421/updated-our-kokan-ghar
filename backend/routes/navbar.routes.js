const express = require('express');
const router = express.Router();
const navbarController = require('../controllers/navbar.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @swagger
 * /navbar:
 *   get:
 *     summary: Get active navbar items for the storefront
 *     tags: [Navbar]
 *     responses:
 *       200:
 *         description: List of active navbar items ordered by sort_order.
 */
router.get('/', navbarController.getActiveItems);

/**
 * @swagger
 * /navbar/all:
 *   get:
 *     summary: Get all navbar items (admin)
 *     tags: [Navbar]
 *     security:
 *       - bearerAuth: []
 */
router.get('/all', verifyToken, isAdmin, navbarController.getItems);

/**
 * @swagger
 * /navbar/reorder:
 *   put:
 *     summary: Reorder navbar items (admin)
 *     tags: [Navbar]
 *     security:
 *       - bearerAuth: []
 */
router.put('/reorder', verifyToken, isAdmin, navbarController.reorderItems);

/**
 * @swagger
 * /navbar:
 *   post:
 *     summary: Create a navbar item (admin)
 *     tags: [Navbar]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', verifyToken, isAdmin, navbarController.createItem);

/**
 * @swagger
 * /navbar/{id}:
 *   put:
 *     summary: Update a navbar item (admin)
 *     tags: [Navbar]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', verifyToken, isAdmin, navbarController.updateItem);

/**
 * @swagger
 * /navbar/{id}:
 *   delete:
 *     summary: Delete a navbar item (admin)
 *     tags: [Navbar]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', verifyToken, isAdmin, navbarController.deleteItem);

module.exports = router;
