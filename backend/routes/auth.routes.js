const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const socialController = require('../controllers/social.controller');
const { registerValidation, loginValidation, forgotPasswordValidation, resetPasswordValidation } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

// ===== SOCIAL OAUTH (Google / Facebook) =====
// These GET endpoints drive the browser redirect flow. `redirect` is an
// optional same-site path (e.g. /checkout) the user should land on after
// login — it is carried through the provider round-trip and back.
//
//   /api/auth/google            -> provider consent screen
//   /api/auth/google/callback   -> provider returns here; session is created
//   /api/auth/facebook          -> provider consent screen
//   /api/auth/facebook/callback -> provider returns here; session is created
//
// The start routes only issue a redirect (no secrets), so the global apiLimiter
// is enough — authLimiter (5/15min/IP) is too tight for users retrying flows.

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Start Google OAuth login (redirects to Google consent screen)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: redirect
 *         required: false
 *         schema: { type: string, example: /checkout }
 *         description: Same-site path to land on after login
 *     responses:
 *       302:
 *         description: Redirect to Google
 */
router.get('/google', socialController.googleLogin);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback (exchanges code, creates/looks up user)
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend /social-callback
 */
router.get('/google/callback', socialController.googleCallback);

/**
 * @swagger
 * /auth/facebook:
 *   get:
 *     summary: Start Facebook OAuth login (redirects to Facebook login dialog)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: redirect
 *         required: false
 *         schema: { type: string, example: /checkout }
 *         description: Same-site path to land on after login
 *     responses:
 *       302:
 *         description: Redirect to Facebook
 */
router.get('/facebook', socialController.facebookLogin);

/**
 * @swagger
 * /auth/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback (exchanges code, creates/looks up user)
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to frontend /social-callback
 */
router.get('/facebook/callback', socialController.facebookCallback);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new customer account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 128
 *                 example: mypassword123
 *               phone:
 *                 type: string
 *                 pattern: '^[0-9]{10}$'
 *                 example: '9876543210'
 *     responses:
 *       201:
 *         description: Registration successful. Welcome to Konkan Bazaar.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                           properties:
 *                             id: { type: integer }
 *                             name: { type: string }
 *                             email: { type: string }
 *                             role: { type: string, example: 'customer' }
 *                         accessToken: { type: string }
 *       409:
 *         description: Email already registered.
 *       400:
 *         description: Validation failed.
 */
router.post('/register', authLimiter, registerValidation, authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: mypassword123
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: object
 *                           properties:
 *                             id: { type: integer }
 *                             name: { type: string }
 *                             email: { type: string }
 *                             role: { type: string }
 *                             is_verified: { type: integer }
 *                         accessToken: { type: string }
 *       401:
 *         description: Invalid email or password.
 *       403:
 *         description: Account has been deactivated.
 */
router.post('/login', authLimiter, loginValidation, authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Can also be provided via httpOnly cookie
 *     responses:
 *       200:
 *         description: Token refreshed.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken: { type: string }
 *       401:
 *         description: Invalid or missing refresh token.
 */
router.post('/refresh-token', authController.refreshTokenHandler);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout and clear refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully.
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: OTP sent to your email.
 */
router.post('/forgot-password', authLimiter, forgotPasswordValidation, authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using OTP token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 description: OTP received via email
 *                 example: '123456'
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successful.
 *       400:
 *         description: Invalid or expired OTP.
 */
router.post('/reset-password', authLimiter, resetPasswordValidation, authController.resetPassword);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address using token
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid or expired verification token.
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @swagger
 * /auth/resend-verify:
 *   post:
 *     summary: Resend email verification link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent.
 */
router.post('/resend-verify', authLimiter, authController.resendVerifyEmail);

module.exports = router;
