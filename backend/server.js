const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { generalLimiter, apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

const frontendOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (server-to-server, mobile apps, curl)
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:3000',
      'http://localhost:3001',
      ...frontendOrigins,
      ...(process.env.RAILWAY_STATIC_URL ? [process.env.RAILWAY_STATIC_URL] : []),
    ];
    callback(null, allowed.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'uploads')));

// ===== ROUTES =====
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const searchRoutes = require('./routes/search.routes');
const couponRoutes = require('./routes/coupon.routes');
const flashSaleRoutes = require('./routes/flashSale.routes');
const bankOfferRoutes = require('./routes/bankOffer.routes');
const bundleRoutes = require('./routes/bundle.routes');
const reviewRoutes = require('./routes/review.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const bannerRoutes = require('./routes/banner.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const contactRoutes = require('./routes/contact.routes');
const heroSlideRoutes = require('./routes/heroSlide.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/flash-sales', flashSaleRoutes);
app.use('/api/bank-offers', bankOfferRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/hero-slides', heroSlideRoutes);

// CMS (Team, Blog, Video, Media)
const cmsRoutes = require('./routes/cms.routes');
app.use('/api/cms', cmsRoutes);

// Customer Service Pages (Terms, Returns, Shipping, FAQ, Privacy, custom)
const customerServiceRoutes = require('./routes/customerService.routes');
app.use('/api/customer-service', customerServiceRoutes);

// Settings (public - for frontend to fetch contact info, social links)
const settingsController = require('./controllers/settings.controller');
/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get public site settings (contact info, social links, etc.)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Site settings key-value pairs.
 */
app.get('/api/settings', settingsController.getSettings);

// Upload
const uploadRoutes = require('./routes/upload.routes');
app.use('/api/upload', uploadRoutes);

// ===== SWAGGER API DOCS =====
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Konkan Bazaar API Docs'
}));

// JSON endpoint for OpenAPI spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ===== HEALTH CHECK =====
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: 'Konkan Bazaar API is running' }
 *                 timestamp: { type: string, format: date-time }
 */
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Konkan Bazaar API is running', timestamp: new Date().toISOString() });
});

// ===== ERROR HANDLER =====
app.use(errorHandler);

// ===== START SERVER =====
// Self-heal: make sure the timed-suspension column exists BEFORE the server
// accepts requests (login/verifyToken SELECT suspend_until, so a fresh DB
// would 500 without this). Mirrors the admin-controller ensure pattern.
const pool = require('./config/db');
const { reactivateExpiredSuspensions } = require('./services/suspension.service');
const ensureSuspendColumn = async () => {
  try {
    const [cols] = await pool.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'suspend_until'"
    );
    if (cols.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN suspend_until DATETIME NULL AFTER is_active, ADD INDEX idx_users_suspend (is_active, suspend_until)');
      console.log('[Startup] users.suspend_until column created.');
    }
  } catch (err) {
    console.error('[Startup] suspend_until self-heal failed:', err.message);
  }
};

ensureSuspendColumn().finally(() => {
  // Auto-reactivate expired timed suspensions in the background (every 60s).
  // The user is unblocked the moment their suspend_until passes — no login,
  // no admin visit, no manual action required. The same rule is also applied
  // lazily on login/verifyToken (resolveUserStatus) and when the admin loads
  // the users page (getUsers), so every path agrees with reality.
  setInterval(async () => {
    try {
      const affected = await reactivateExpiredSuspensions();
      if (affected > 0) {
        console.log(`[Suspension] Auto-reactivated ${affected} expired timed suspension(s).`);
      }
    } catch (err) {
      console.error('[Suspension] Auto-reactivate sweep failed:', err.message);
    }
  }, 60 * 1000);

  app.listen(PORT, '0.0.0.0', () => {
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://0.0.0.0:${PORT}`;
    console.log(`\nKonkan Bazaar Backend`);
    console.log(`Server running on ${baseUrl}`);
    console.log(`API: ${baseUrl}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
});

module.exports = app;
