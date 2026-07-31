const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const analyticsController = require('../controllers/analytics.controller');
const settingsController = require('../controllers/settings.controller');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { productValidation, categoryValidation } = require('../middleware/validate');

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login with panel password
 *     tags: [Admin - Auth]
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
 *                 description: Admin panel password
 *     responses:
 *       200:
 *         description: Admin login successful.
 *       401:
 *         description: Invalid admin password.
 *       404:
 *         description: No admin user found.
 */
router.post('/login', adminController.adminLogin);

/**
 * @swagger
 * /admin/analytics/dashboard:
 *   get:
 *     summary: Get admin dashboard stats (also at /analytics/dashboard)
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats.
 */
router.get('/analytics/dashboard', verifyToken, isAdmin, analyticsController.getDashboard);

/**
 * @swagger
 * /admin/analytics/top-products:
 *   get:
 *     summary: Get top selling products (admin)
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top products.
 */
router.get('/analytics/top-products', verifyToken, isAdmin, analyticsController.getTopProducts);

/**
 * @swagger
 * /admin/analytics/category-performance:
 *   get:
 *     summary: Get category performance (admin)
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Category performance.
 */
router.get('/analytics/category-performance', verifyToken, isAdmin, analyticsController.getCategoryPerformance);

/**
 * @swagger
 * /admin/analytics/search-terms:
 *   get:
 *     summary: Get top search terms (admin)
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Search terms.
 */
router.get('/analytics/search-terms', verifyToken, isAdmin, analyticsController.getSearchTerms);

/**
 * @swagger
 * /admin/products:
 *   get:
 *     summary: Get all products (admin, paginated, with filters)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: integer }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive] }
 *       - in: query
 *         name: imageStatus
 *         schema: { type: string, enum: [uploaded, pending] }
 *     responses:
 *       200:
 *         description: Paginated products.
 */
router.get('/products', verifyToken, isAdmin, adminController.getProducts);

/**
 * @swagger
 * /admin/products/{id}:
 *   get:
 *     summary: Get a single product by ID (admin, includes images, variants, tags, flash sale)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product details.
 *       404:
 *         description: Product not found.
 */
router.get('/products/:id', verifyToken, isAdmin, adminController.getProductById);

/**
 * @swagger
 * /admin/products:
 *   post:
 *     summary: Create a new product (admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price, mrp, stock_quantity, category_id, sku]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               short_description: { type: string }
 *               price: { type: number }
 *               mrp: { type: number }
 *               stock_quantity: { type: integer }
 *               sku: { type: string }
 *               category_id: { type: integer }
 *               brand: { type: string }
 *               weight_grams: { type: integer }
 *               unit: { type: string }
 *               is_featured: { type: boolean }
 *               is_bestseller: { type: boolean }
 *               is_seasonal: { type: boolean }
 *               is_organic: { type: boolean }
 *               region_origin: { type: string }
 *               shelf_life_days: { type: integer }
 *               ingredients: { type: string }
 *               nutritional_info: { type: string }
 *               storage_instructions: { type: string }
 *     responses:
 *       201:
 *         description: Product created.
 */
router.post('/products', verifyToken, isAdmin, productValidation, adminController.createProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   put:
 *     summary: Update a product (admin, accepts any product fields)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Product updated.
 *       400:
 *         description: No fields to update.
 */
router.put('/products/:id', verifyToken, isAdmin, adminController.updateProduct);

/**
 * @swagger
 * /admin/products/{id}:
 *   delete:
 *     summary: Delete a product (admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Product deleted.
 */
router.delete('/products/:id', verifyToken, isAdmin, adminController.deleteProduct);

/**
 * @swagger
 * /admin/products/{id}/images:
 *   post:
 *     summary: Add an image to a product (admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [image_url]
 *             properties:
 *               image_url: { type: string }
 *               alt_text: { type: string }
 *               is_primary: { type: boolean }
 *     responses:
 *       201:
 *         description: Image added.
 */
router.post('/products/:id/images', verifyToken, isAdmin, adminController.addProductImage);

/**
 * @swagger
 * /admin/products/{id}/images/{imageId}:
 *   delete:
 *     summary: Delete a product image (admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Image deleted.
 *       404:
 *         description: Image not found.
 */
router.delete('/products/:id/images/:imageId', verifyToken, isAdmin, adminController.deleteProductImage);

/**
 * @swagger
 * /admin/products/{id}/images/{imageId}/primary:
 *   put:
 *     summary: Set a product image as primary (admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Primary image updated.
 */
router.put('/products/:id/images/:imageId/primary', verifyToken, isAdmin, adminController.setPrimaryImage);

/**
 * @swagger
 * /admin/products/{id}/variants:
 *   post:
 *     summary: Add a variant to a product (admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [variant_name, variant_value]
 *             properties:
 *               variant_name: { type: string }
 *               variant_value: { type: string }
 *               price_modifier: { type: number }
 *               stock_quantity: { type: integer }
 *               sku_suffix: { type: string }
 *     responses:
 *       201:
 *         description: Variant added.
 */
router.post('/products/:id/variants', verifyToken, isAdmin, adminController.addVariant);

/**
 * @swagger
 * /admin/products/{id}/variants/{variantId}:
 *   put:
 *     summary: Update a product variant (admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               variant_name: { type: string }
 *               variant_value: { type: string }
 *               price_modifier: { type: number }
 *               stock_quantity: { type: integer }
 *               sku_suffix: { type: string }
 *     responses:
 *       200:
 *         description: Variant updated.
 */
router.put('/products/:id/variants/:variantId', verifyToken, isAdmin, adminController.updateVariant);

/**
 * @swagger
 * /admin/products/{id}/variants/{variantId}:
 *   delete:
 *     summary: Delete a product variant (admin)
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Variant deleted.
 */
router.delete('/products/:id/variants/:variantId', verifyToken, isAdmin, adminController.deleteVariant);

/**
 * @swagger
 * /admin/categories:
 *   get:
 *     summary: Get all categories (admin, includes inactive)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories.
 */
router.get('/categories', verifyToken, isAdmin, adminController.getCategories);

/**
 * @swagger
 * /admin/categories:
 *   post:
 *     summary: Create a category (admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               image_url: { type: string }
 *               parent_id: { type: integer }
 *               sort_order: { type: integer }
 *               meta_title: { type: string }
 *               meta_description: { type: string }
 *     responses:
 *       201:
 *         description: Category created.
 */
router.post('/categories', verifyToken, isAdmin, categoryValidation, adminController.createCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   put:
 *     summary: Update a category (admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Category updated.
 */
router.put('/categories/:id', verifyToken, isAdmin, adminController.updateCategory);

/**
 * @swagger
 * /admin/categories/{id}:
 *   delete:
 *     summary: Delete a category (admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Category deleted.
 */
router.delete('/categories/:id', verifyToken, isAdmin, adminController.deleteCategory);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders (admin, paginated, filterable by status)
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated orders.
 */
router.get('/orders', verifyToken, isAdmin, adminController.getOrders);

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     summary: Get a single order by ID (admin, with items, tracking, address)
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Order details.
 *       404:
 *         description: Order not found.
 */
router.get('/orders/:id', verifyToken, isAdmin, adminController.getOrderById);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   put:
 *     summary: Update order status (admin)
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, out_for_delivery, delivered, cancelled, returned]
 *               message:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated.
 *       400:
 *         description: Invalid status.
 */
router.put('/orders/:id/status', verifyToken, isAdmin, adminController.updateOrderStatus);

/**
 * @swagger
 * /admin/users/{id}/status:
 *   put:
 *     summary: Activate or suspend a user (admin)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [is_active]
 *             properties:
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User activated/suspended.
 */
router.put('/users/:id/status', verifyToken, isAdmin, adminController.updateUserStatus);

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete a user (admin, cannot delete self)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deleted.
 *       400:
 *         description: Cannot delete your own account.
 */
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser);

/**
 * @swagger
 * /admin/coupons:
 *   get:
 *     summary: Get all coupons (admin)
 *     tags: [Admin - Coupons]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of coupons.
 */
router.get('/coupons', verifyToken, isAdmin, adminController.getCoupons);

/**
 * @swagger
 * /admin/coupons:
 *   post:
 *     summary: Create a coupon (admin)
 *     tags: [Admin - Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, type, value]
 *             properties:
 *               code: { type: string }
 *               type: { type: string }
 *               value: { type: number }
 *               min_order_amount: { type: number }
 *               max_discount: { type: number }
 *               usage_limit: { type: integer }
 *               is_active: { type: boolean }
 *               valid_from: { type: string, format: date-time }
 *               valid_until: { type: string, format: date-time }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Coupon created.
 */
router.post('/coupons', verifyToken, isAdmin, adminController.createCoupon);

/**
 * @swagger
 * /admin/coupons/{id}:
 *   put:
 *     summary: Update a coupon (admin)
 *     tags: [Admin - Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Coupon updated.
 */
router.put('/coupons/:id', verifyToken, isAdmin, adminController.updateCoupon);

/**
 * @swagger
 * /admin/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon (admin)
 *     tags: [Admin - Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Coupon deleted.
 */
router.delete('/coupons/:id', verifyToken, isAdmin, adminController.deleteCoupon);

/**
 * @swagger
 * /admin/banners:
 *   post:
 *     summary: Create a banner (admin)
 *     tags: [Admin - Banners]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, image_url]
 *             properties:
 *               title: { type: string }
 *               subtitle: { type: string }
 *               image_url: { type: string }
 *               mobile_image_url: { type: string }
 *               link_url: { type: string }
 *               position: { type: string, default: 'hero' }
 *               sort_order: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       201:
 *         description: Banner created.
 */
router.post('/banners', verifyToken, isAdmin, adminController.createBanner);

/**
 * @swagger
 * /admin/banners/{id}:
 *   put:
 *     summary: Update a banner (admin)
 *     tags: [Admin - Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Banner updated.
 */
router.put('/banners/:id', verifyToken, isAdmin, adminController.updateBanner);

/**
 * @swagger
 * /admin/banners/{id}:
 *   delete:
 *     summary: Delete a banner (admin)
 *     tags: [Admin - Banners]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Banner deleted.
 */
router.delete('/banners/:id', verifyToken, isAdmin, adminController.deleteBanner);

/**
 * @swagger
 * /admin/flash-sales:
 *   post:
 *     summary: Create a flash sale (admin)
 *     tags: [Admin - Flash Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [product_id, sale_price, original_price, starts_at, ends_at]
 *             properties:
 *               product_id: { type: integer }
 *               sale_price: { type: number }
 *               original_price: { type: number }
 *               quantity_limit: { type: integer }
 *               starts_at: { type: string, format: date-time }
 *               ends_at: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Flash sale created.
 */
router.post('/flash-sales', verifyToken, isAdmin, adminController.createFlashSale);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (admin, paginated)
 *     tags: [Admin - Users]
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
 *         description: Paginated users.
 */
router.get('/users', verifyToken, isAdmin, adminController.getUsers);

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get site settings (admin)
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Site settings.
 */
router.get('/settings', verifyToken, isAdmin, settingsController.getSettings);

/**
 * @swagger
 * /admin/settings:
 *   put:
 *     summary: Update site settings (admin)
 *     tags: [Admin - Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Key-value pairs of settings to update
 *             example: { site_name: "Konkan Bazaar", support_email: "hello@konkanbazaar.in" }
 *     responses:
 *       200:
 *         description: Settings updated successfully.
 */
router.put('/settings', verifyToken, isAdmin, settingsController.updateSettings);

module.exports = router;
