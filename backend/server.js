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
    // Allow any ngrok-free.dev subdomain (tunnel URLs change on restart)
    const isNgrok = /^https?:\/\/[^/]+\.ngrok-free\.dev$/.test(origin);
    callback(null, allowed.includes(origin) || isNgrok);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Id', 'X-Silent-Suspension']
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
const navbarRoutes = require('./routes/navbar.routes');
const campaignRoutes = require('./routes/campaign.routes');
const pushRoutes = require('./routes/push.routes');
const pushAdvancedRoutes = require('./routes/pushAdvanced.routes');
const ga4Routes = require('./routes/ga4.routes');
const subscriberRoutes = require('./routes/subscriber.routes');

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
app.use('/api/navbar', navbarRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/push', pushAdvancedRoutes);
app.use('/api/ga4', ga4Routes);
app.use('/api/subscribers', subscriberRoutes);

// CSV Export / Import (admin)
const exportRoutes = require('./routes/export.routes');
app.use('/api/admin', exportRoutes);

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

ensureSuspendColumn().finally(async () => {
  // Self-heal: ensure the slab-discount ledger columns exist (Buy More,
  // Save More). createOrder INSERTs slab_percent/slab_discount, so a DB
  // created before the feature would 500 without this.
  try {
    const [cols] = await pool.query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'slab_discount'"
    );
    if (cols.length === 0) {
      await pool.query('ALTER TABLE orders ADD COLUMN slab_percent TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER coupon_discount, ADD COLUMN slab_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER slab_percent');
      console.log('[Startup] orders.slab_percent / slab_discount columns created.');
    }
  } catch (err) {
    console.error('[Startup] slab columns self-heal failed:', err.message);
  }
  // Ensure stock_alerts table + low_stock_threshold column exist
  try {
    const { ensureStockAlertSchema } = require('./services/stockAlert.service');
    await ensureStockAlertSchema();
    const { ensureSchema: ensureBisSchema } = require('./services/backInStock.service');
    await ensureBisSchema();
  } catch (err) {
    console.error('[Startup] schema ensure failed:', err.message);
  }

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

  // Post-delivery lifecycle emails — review request (~2-3 days) + reorder
  // nudge (~14 days) after delivery. Fire-and-forget: a failed run is logged
  // and never crashes the server; each order is emailed at most once per flow
  // (guarded by review_email_sent_at / reorder_email_sent_at).
  if (process.env.LIFECYCLE_EMAILS_ENABLED !== 'false') {
    const { runLifecycleEmails } = require('./services/lifecycle.service');
    const LIFECYCLE_INTERVAL_MIN = parseInt(process.env.LIFECYCLE_EMAILS_INTERVAL_MIN, 10) || 60;

    // First run shortly after boot (staggered), then every N minutes.
    setTimeout(() => {
      runLifecycleEmails().catch((err) => {
        console.error('[Lifecycle] Initial run failed:', err.message);
      });
    }, 3 * 60 * 1000);

    setInterval(() => {
      runLifecycleEmails().catch((err) => {
        console.error('[Lifecycle] Sweep failed:', err.message);
      });
    }, LIFECYCLE_INTERVAL_MIN * 60 * 1000);
  }

  // Wishlist price-drop alerts — daily cron. When a wishlisted product's
  // price drops >= PRICE_DROP_MIN_PERCENT (default 5%) below the price at
  // which the customer added it (or the last alert), the user gets an in-app
  // notification (type `price_drop`) + email. Fire-and-forget like the other
  // schedulers: a failed sweep is logged, never crashes the server, and the
  // alert floor only moves DOWN so the same drop never double-sends.
  if (process.env.PRICE_DROP_ALERTS_ENABLED !== 'false') {
    const { runPriceDropAlerts } = require('./services/priceDrop.service');
    const PRICE_DROP_INTERVAL_HOURS = parseInt(process.env.PRICE_DROP_ALERTS_INTERVAL_HOURS, 10) || 24;

    // First run shortly after boot (staggered), then every N hours.
    setTimeout(() => {
      runPriceDropAlerts().catch((err) => {
        console.error('[PriceDrop] Initial run failed:', err.message);
      });
    }, 5 * 60 * 1000);

    setInterval(() => {
      runPriceDropAlerts().catch((err) => {
        console.error('[PriceDrop] Sweep failed:', err.message);
      });
    }, PRICE_DROP_INTERVAL_HOURS * 60 * 60 * 1000);
  }

  // ── Daily Business Digest — sent every day at 08:00 AM IST ──
  // Uses an in-process setInterval that checks IST hour/minute.
  // For production reliability, prefer system cron (see README below).
  if (process.env.DAILY_DIGEST_ENABLED !== 'false') {
    const { sendDailyDigest } = require('./services/dailyDigest.service');

    // Calculate ms until next 08:00 AM IST
    function msUntilNextDigest() {
      const now = new Date();
      // IST = UTC+5:30
      const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
      const target = new Date(istNow);
      target.setHours(8, 0, 0, 0);
      if (target <= istNow) target.setDate(target.getDate() + 1);
      return target.getTime() - istNow.getTime();
    }

    const scheduleNext = () => {
      const delay = msUntilNextDigest();
      const hours = Math.floor(delay / (1000 * 60 * 60));
      const mins = Math.floor((delay % (1000 * 60 * 60)) / (1000 * 60));
      console.log(`[Digest] Next daily digest in ${hours}h ${mins}m (08:00 AM IST)`);
      setTimeout(() => {
        sendDailyDigest().catch((err) => {
          console.error('[Digest] Scheduled run failed:', err.message);
        });
        scheduleNext(); // schedule the next day
      }, delay);
    };

    // First check shortly after boot, then daily
    setTimeout(() => {
      const now = new Date();
      const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
      // If it's currently 08:00 AM IST ± 5 minutes, send immediately
      if (istNow.getHours() === 8 && istNow.getMinutes() < 5) {
        sendDailyDigest().catch((err) => {
          console.error('[Digest] Initial run failed:', err.message);
        });
      }
      scheduleNext();
    }, 7 * 60 * 1000); // staggered after other schedulers
  }

  // ── Abandoned Cart Recovery — hourly sweep ──
  // Finds carts idle for 24+ hours, sends recovery emails with coupons.
  if (process.env.ABANDONED_CART_RECOVERY_ENABLED !== 'false') {
    const { runAbandonedCartRecovery } = require('./services/abandonedCart.service');
    const CART_RECOVERY_INTERVAL_MIN = parseInt(process.env.ABANDONED_CART_INTERVAL_MIN, 10) || 60;

    // First run shortly after boot (staggered), then every N minutes.
    setTimeout(() => {
      runAbandonedCartRecovery().catch((err) => {
        console.error('[AbandonedCart] Initial run failed:', err.message);
      });
    }, 9 * 60 * 1000);

    setInterval(() => {
      runAbandonedCartRecovery().catch((err) => {
        console.error('[AbandonedCart] Sweep failed:', err.message);
      });
    }, CART_RECOVERY_INTERVAL_MIN * 60 * 1000);
  }

  app.listen(PORT, '0.0.0.0', () => {
    const baseUrl = process.env.RAILWAY_STATIC_URL || `http://0.0.0.0:${PORT}`;
    console.log(`\nKonkan Bazaar Backend`);
    console.log(`Server running on ${baseUrl}`);
    console.log(`API: ${baseUrl}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
});

module.exports = app;
