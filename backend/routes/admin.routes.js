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
 * /admin/analytics/cancellation-reasons:
 *   get:
 *     summary: Get cancellation reasons breakdown (admin)
 *     tags: [Admin - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cancellation reasons with counts.
 */
router.get('/analytics/cancellation-reasons', verifyToken, isAdmin, analyticsController.getCancellationReasons);

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
 *   get:
 *     summary: Get all flash sales (admin)
 *     tags: [Admin - Flash Sales]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of flash sales.
 */
router.get('/flash-sales', verifyToken, isAdmin, adminController.getFlashSales);

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
 * /admin/flash-sales/{id}:
 *   put:
 *     summary: Update a flash sale (admin)
 *     tags: [Admin - Flash Sales]
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
 *         description: Flash sale updated.
 *       400:
 *         description: No fields to update.
 */
router.put('/flash-sales/:id', verifyToken, isAdmin, adminController.updateFlashSale);

/**
 * @swagger
 * /admin/flash-sales/{id}:
 *   delete:
 *     summary: Delete a flash sale (admin)
 *     tags: [Admin - Flash Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Flash sale deleted.
 */
router.delete('/flash-sales/:id', verifyToken, isAdmin, adminController.deleteFlashSale);

/**
 * @swagger
 * /admin/bank-offers:
 *   get:
 *     summary: Get all bank offers (admin)
 *     tags: [Admin - Bank Offers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bank offers.
 */
router.get('/bank-offers', verifyToken, isAdmin, adminController.getBankOffers);

/**
 * @swagger
 * /admin/bank-offers:
 *   post:
 *     summary: Create a bank offer (admin)
 *     tags: [Admin - Bank Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bank_name, offer_title]
 *             properties:
 *               bank_name: { type: string }
 *               bank_code: { type: string }
 *               logo_url: { type: string }
 *               offer_title: { type: string }
 *               offer_description: { type: string }
 *               discount_type: { type: string, enum: [credit_card, debit_card, upi, emi, netbanking], default: credit_card }
 *               min_order_amount: { type: number }
 *               max_discount: { type: number }
 *               is_active: { type: boolean }
 *               valid_from: { type: string, format: date-time }
 *               valid_until: { type: string, format: date-time }
 *               terms_url: { type: string }
 *               sort_order: { type: integer }
 *     responses:
 *       201:
 *         description: Bank offer created.
 */
router.post('/bank-offers', verifyToken, isAdmin, adminController.createBankOffer);

/**
 * @swagger
 * /admin/bank-offers/{id}:
 *   put:
 *     summary: Update a bank offer (admin)
 *     tags: [Admin - Bank Offers]
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
 *         description: Bank offer updated.
 *       400:
 *         description: No fields to update.
 */
router.put('/bank-offers/:id', verifyToken, isAdmin, adminController.updateBankOffer);

/**
 * @swagger
 * /admin/bank-offers/{id}:
 *   delete:
 *     summary: Delete a bank offer (admin)
 *     tags: [Admin - Bank Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Bank offer deleted.
 */
router.delete('/bank-offers/:id', verifyToken, isAdmin, adminController.deleteBankOffer);

/**
 * @swagger
 * /admin/bundles:
 *   get:
 *     summary: Get all bundles (admin, includes member products)
 *     tags: [Admin - Bundles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bundles.
 */
router.get('/bundles', verifyToken, isAdmin, adminController.getBundles);

/**
 * @swagger
 * /admin/bundles/{id}:
 *   get:
 *     summary: Get a single bundle by ID (admin, includes member products)
 *     tags: [Admin - Bundles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Bundle details.
 *       404:
 *         description: Bundle not found.
 */
router.get('/bundles/:id', verifyToken, isAdmin, adminController.getBundleById);

/**
 * @swagger
 * /admin/bundles:
 *   post:
 *     summary: Create a bundle (admin)
 *     tags: [Admin - Bundles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, bundle_price, original_price]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               bundle_price: { type: number }
 *               original_price: { type: number }
 *               is_active: { type: boolean }
 *               valid_from: { type: string, format: date-time }
 *               valid_until: { type: string, format: date-time }
 *               sort_order: { type: integer }
 *               product_id: { type: integer, description: 'Optional linked combo product id' }
 *               bundle_products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id: { type: integer }
 *                     quantity: { type: integer }
 *     responses:
 *       201:
 *         description: Bundle created.
 */
router.post('/bundles', verifyToken, isAdmin, adminController.createBundle);

/**
 * @swagger
 * /admin/bundles/{id}:
 *   put:
 *     summary: Update a bundle (admin)
 *     tags: [Admin - Bundles]
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
 *         description: Bundle updated.
 *       400:
 *         description: No fields to update.
 */
router.put('/bundles/:id', verifyToken, isAdmin, adminController.updateBundle);

/**
 * @swagger
 * /admin/bundles/{id}:
 *   delete:
 *     summary: Delete a bundle (admin, also deletes linked combo product if any)
 *     tags: [Admin - Bundles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Bundle deleted.
 */
router.delete('/bundles/:id', verifyToken, isAdmin, adminController.deleteBundle);

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

// ===== CUSTOMER SERVICE PAGES (ADMIN) =====
const customerServiceController = require('../controllers/customerService.controller');

/**
 * @swagger
 * /admin/customer-service:
 *   get:
 *     summary: Get all customer service pages (admin)
 *     tags: [Admin - Customer Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of customer service pages.
 */
router.get('/customer-service', verifyToken, isAdmin, customerServiceController.getAdminPages);

/**
 * @swagger
 * /admin/customer-service/{id}:
 *   get:
 *     summary: Get a customer service page by ID (admin)
 *     tags: [Admin - Customer Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Customer service page details.
 *       404:
 *         description: Page not found.
 */
router.get('/customer-service/:id', verifyToken, isAdmin, customerServiceController.getAdminPageById);

/**
 * @swagger
 * /admin/customer-service:
 *   post:
 *     summary: Create a customer service page (admin)
 *     tags: [Admin - Customer Service]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [service_key, title]
 *             properties:
 *               service_key: { type: string }
 *               title: { type: string }
 *               page_type: { type: string, enum: [text, faq] }
 *               content: { type: object }
 *               is_active: { type: boolean }
 *               sort_order: { type: integer }
 *     responses:
 *       201:
 *         description: Page created.
 */
router.post('/customer-service', verifyToken, isAdmin, customerServiceController.createPage);

/**
 * @swagger
 * /admin/customer-service/{id}:
 *   put:
 *     summary: Update a customer service page (admin)
 *     tags: [Admin - Customer Service]
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
 *             properties:
 *               service_key: { type: string }
 *               title: { type: string }
 *               page_type: { type: string, enum: [text, faq] }
 *               content: { type: object }
 *               is_active: { type: boolean }
 *               sort_order: { type: integer }
 *     responses:
 *       200:
 *         description: Page updated.
 */
router.put('/customer-service/:id', verifyToken, isAdmin, customerServiceController.updatePage);

/**
 * @swagger
 * /admin/customer-service/{id}:
 *   delete:
 *     summary: Delete a customer service page (admin)
 *     tags: [Admin - Customer Service]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Page deleted.
 */
router.delete('/customer-service/:id', verifyToken, isAdmin, customerServiceController.deletePage);

// ===== CAMPAIGNS (FESTIVE COLLECTION PAGES) =====
const campaignController = require('../controllers/campaign.controller');

/**
 * @swagger
 * /admin/campaigns:
 *   get:
 *     summary: Get all campaigns (admin, with product count)
 *     tags: [Admin - Campaigns]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of campaigns.
 */
router.get('/campaigns', verifyToken, isAdmin, campaignController.getCampaigns);

/**
 * @swagger
 * /admin/campaigns/{id}:
 *   get:
 *     summary: Get a single campaign by ID (admin, includes product_ids)
 *     tags: [Admin - Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Campaign details.
 *       404:
 *         description: Campaign not found.
 */
router.get('/campaigns/:id', verifyToken, isAdmin, campaignController.getCampaignById);

/**
 * @swagger
 * /admin/campaigns:
 *   post:
 *     summary: Create a campaign (admin)
 *     tags: [Admin - Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, slug]
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               tagline: { type: string }
 *               description: { type: string }
 *               theme_color: { type: string }
 *               banner_image_url: { type: string }
 *               mobile_banner_image_url: { type: string }
 *               meta_title: { type: string }
 *               meta_description: { type: string }
 *               starts_at: { type: string, format: date-time }
 *               ends_at: { type: string, format: date-time }
 *               is_active: { type: boolean }
 *               sort_order: { type: integer }
 *               product_ids:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       201:
 *         description: Campaign created.
 */
router.post('/campaigns', verifyToken, isAdmin, campaignController.createCampaign);

/**
 * @swagger
 * /admin/campaigns/{id}:
 *   put:
 *     summary: Update a campaign (admin)
 *     tags: [Admin - Campaigns]
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
 *             properties:
 *               name: { type: string }
 *               slug: { type: string }
 *               tagline: { type: string }
 *               description: { type: string }
 *               theme_color: { type: string }
 *               banner_image_url: { type: string }
 *               mobile_banner_image_url: { type: string }
 *               meta_title: { type: string }
 *               meta_description: { type: string }
 *               starts_at: { type: string, format: date-time }
 *               ends_at: { type: string, format: date-time }
 *               is_active: { type: boolean }
 *               sort_order: { type: integer }
 *               product_ids:
 *                 type: array
 *                 items: { type: integer }
 *     responses:
 *       200:
 *         description: Campaign updated.
 *       404:
 *         description: Campaign not found.
 */
router.put('/campaigns/:id', verifyToken, isAdmin, campaignController.updateCampaign);

/**
 * @swagger
 * /admin/campaigns/{id}:
 *   delete:
 *     summary: Delete a campaign (admin, removes its curated product links)
 *     tags: [Admin - Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Campaign deleted.
 */
router.delete('/campaigns/:id', verifyToken, isAdmin, campaignController.deleteCampaign);

// ===== REVIEW MODERATION =====

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     summary: Get all reviews for moderation (admin, paginated, filterable)
 *     tags: [Admin - Reviews]
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
 *         schema: { type: string, enum: [all, approved, hidden] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated reviews with moderation stats.
 */
router.get('/reviews', verifyToken, isAdmin, adminController.getAdminReviews);

/**
 * @swagger
 * /admin/reviews/{id}/status:
 *   put:
 *     summary: Approve or hide a review (admin)
 *     tags: [Admin - Reviews]
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
 *             required: [approved]
 *             properties:
 *               approved: { type: boolean }
 *     responses:
 *       200:
 *         description: Review approved/hidden. Product rating recomputed.
 *       404:
 *         description: Review not found.
 */
router.put('/reviews/:id/status', verifyToken, isAdmin, adminController.updateReviewStatus);

/**
 * @swagger
 * /admin/reviews/{id}/reply:
 *   put:
 *     summary: Post or remove the store's reply on a review (admin)
 *     tags: [Admin - Reviews]
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
 *             required: [reply]
 *             properties:
 *               reply: { type: string, description: 'Empty string removes the reply' }
 *     responses:
 *       200:
 *         description: Reply posted or removed.
 *       404:
 *         description: Review not found.
 */
router.put('/reviews/:id/reply', verifyToken, isAdmin, adminController.replyToReview);

/**
 * @swagger
 * /admin/reviews/{id}/home:
 *   put:
 *     summary: Feature or un-feature a review on the homepage slider (admin)
 *     tags: [Admin - Reviews]
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
 *             required: [show_on_home]
 *             properties:
 *               show_on_home: { type: boolean }
 *     responses:
 *       200:
 *         description: Review added/removed from homepage slider.
 *       404:
 *         description: Review not found.
 */
router.put('/reviews/:id/home', verifyToken, isAdmin, adminController.toggleHomeReview);

/**
 * @swagger
 * /admin/reviews/{id}:
 *   delete:
 *     summary: Delete a review (admin)
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Review deleted. Product rating recomputed.
 *       404:
 *         description: Review not found.
 */
router.delete('/reviews/:id', verifyToken, isAdmin, adminController.deleteReview);

module.exports = router;
