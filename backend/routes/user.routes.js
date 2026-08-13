const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');
const { addressValidation, changePasswordValidation, setPasswordValidation } = require('../middleware/validate');

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: User not found.
 */
router.get('/profile', verifyToken, userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Stored exactly as typed (lowercased only; dots preserved)
 *               phone:
 *                 type: string
 *                 pattern: '^[0-9]{10}$'
 *               avatar_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *       400:
 *         description: Invalid email format.
 *       409:
 *         description: Email already registered.
 *       401:
 *         description: Unauthorized.
 */
router.put('/profile', verifyToken, userController.updateProfile);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Change current user's password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *       400:
 *         description: Current password is incorrect.
 *       401:
 *         description: Unauthorized.
 */
router.put('/change-password', verifyToken, changePasswordValidation, userController.changePassword);

/**
 * @swagger
 * /users/set-password:
 *   put:
 *     summary: Set a password for an account created via Google/Facebook
 *     description: >
 *       OAuth-created accounts have no password (password_hash is NULL). This
 *       is the only way to add one — after that, email/password login works on
 *       the same account. Rejected with 400 if a password already exists.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 128
 *     responses:
 *       200:
 *         description: Password set successfully.
 *       400:
 *         description: Already has a password / validation failed.
 *       401:
 *         description: Unauthorized.
 */
router.put('/set-password', verifyToken, setPasswordValidation, userController.setPassword);

/**
 * @swagger
 * /users/addresses:
 *   get:
 *     summary: Get all addresses for current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of addresses.
 *       401:
 *         description: Unauthorized.
 */
router.get('/addresses', verifyToken, userController.getAddresses);

/**
 * @swagger
 * /users/addresses:
 *   post:
 *     summary: Create a new address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, house_no, street, city, state, pincode]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               phone:
 *                 type: string
 *                 pattern: '^[0-9]{10}$'
 *               house_no:
 *                 type: string
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *               is_default:
 *                 type: boolean
 *               address_type:
 *                 type: string
 *                 enum: [home, work, other]
 *     responses:
 *       201:
 *         description: Address added successfully.
 *       401:
 *         description: Unauthorized.
 */
router.post('/addresses', verifyToken, addressValidation, userController.createAddress);

/**
 * @swagger
 * /users/addresses/{id}:
 *   put:
 *     summary: Update an existing address
 *     tags: [Users]
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
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               house_no: { type: string }
 *               street: { type: string }
 *               city: { type: string }
 *               state: { type: string }
 *               pincode: { type: string }
 *               is_default: { type: boolean }
 *               address_type: { type: string, enum: [home, work, other] }
 *     responses:
 *       200:
 *         description: Address updated successfully.
 *       404:
 *         description: Address not found.
 */
router.put('/addresses/:id', verifyToken, addressValidation, userController.updateAddress);

/**
 * @swagger
 * /users/addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Address deleted successfully.
 *       404:
 *         description: Address not found.
 */
router.delete('/addresses/:id', verifyToken, userController.deleteAddress);

/**
 * @swagger
 * /users/notifications:
 *   get:
 *     summary: Get user notifications (paginated)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated notifications.
 */
router.get('/notifications', verifyToken, userController.getNotifications);

/**
 * @swagger
 * /users/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notification marked as read.
 */
router.put('/notifications/:id/read', verifyToken, userController.markNotificationRead);

/**
 * @swagger
 * /users/loyalty:
 *   get:
 *     summary: Get current user's loyalty/rewards info
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty information.
 *       500:
 *         description: Could not fetch loyalty info.
 */
router.get('/loyalty', verifyToken, userController.getLoyaltyInfo);

module.exports = router;
