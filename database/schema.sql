-- ============================================================
-- KONKAN BAZAAR — Database Schema
-- Pure MySQL with parameterized queries (no ORM)
-- ============================================================

CREATE DATABASE IF NOT EXISTS konkan_bazaar
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE konkan_bazaar;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  -- NULL for social-only (Google/Facebook) accounts; required for password accounts
  password_hash VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20),
  -- Personal referral code — unique, shared via /account/referrals (8 chars, e.g. KB7X9F2M)
  referral_code VARCHAR(20) DEFAULT NULL,
  -- IP the account was created from — anti-fraud: a referral code is only
  -- honoured on a device that has never created an account before
  signup_ip VARCHAR(45) DEFAULT NULL,
  role ENUM('customer','admin','seller') NOT NULL DEFAULT 'customer',
  avatar_url VARCHAR(500),
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  -- NULL + is_active=0 => permanent suspension; future date => timed suspension
  suspend_until DATETIME DEFAULT NULL,
  last_login DATETIME,
  reset_otp VARCHAR(10) DEFAULT NULL,
  reset_otp_expiry DATETIME DEFAULT NULL,
  email_verify_token VARCHAR(255) DEFAULT NULL,
  email_verify_expiry DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- phone is UNIQUE: the same number can never register twice (anti-fake-signup)
  UNIQUE KEY uk_users_phone (phone),
  UNIQUE KEY uk_users_referral_code (referral_code),
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_is_active (is_active),
  INDEX idx_users_signup_ip (signup_ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. ADDRESSES
-- ============================================================
-- NOTE: Social (Google/Facebook) login support requires password_hash to be
-- nullable. For EXISTING databases run:
--   ALTER TABLE users MODIFY password_hash VARCHAR(255) DEFAULT NULL;
-- (see database/social_oauth_migration.sql)
CREATE TABLE addresses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  house_no VARCHAR(100) NOT NULL,
  street VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  address_type ENUM('home','work','other') NOT NULL DEFAULT 'home',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_addresses_user (user_id),
  INDEX idx_addresses_pincode (pincode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(150) NOT NULL UNIQUE,
  description TEXT,
  image_url VARCHAR(500),
  parent_id INT UNSIGNED DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_categories_slug (slug),
  INDEX idx_categories_parent (parent_id),
  INDEX idx_categories_active_sort (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. PRODUCTS
-- ============================================================
CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  description TEXT,
  short_description VARCHAR(500),
  price DECIMAL(10,2) NOT NULL,
  mrp DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) GENERATED ALWAYS AS (ROUND(((mrp - price) / mrp) * 100, 2)) STORED,
  stock_quantity INT NOT NULL DEFAULT 0,
  sku VARCHAR(100) NOT NULL UNIQUE,
  category_id INT UNSIGNED NOT NULL,
  seller_id INT UNSIGNED DEFAULT NULL,
  brand VARCHAR(100),
  weight_grams DECIMAL(10,2),
  unit VARCHAR(50) DEFAULT 'piece',
  free_delivery TINYINT(1) NOT NULL DEFAULT 1,
  delivery_estimate VARCHAR(50) NOT NULL DEFAULT '3-5 days',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_bestseller TINYINT(1) NOT NULL DEFAULT 0,
  is_seasonal TINYINT(1) NOT NULL DEFAULT 0,
  is_organic TINYINT(1) NOT NULL DEFAULT 0,
  region_origin VARCHAR(100),
  shelf_life_days INT,
  ingredients TEXT,
  nutritional_info JSON,
  storage_instructions TEXT,
  average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT UNSIGNED NOT NULL DEFAULT 0,
  total_sold INT UNSIGNED NOT NULL DEFAULT 0,
  views_count INT UNSIGNED NOT NULL DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_products_slug (slug),
  INDEX idx_products_category (category_id),
  INDEX idx_products_price (price),
  INDEX idx_products_active_featured (is_active, is_featured),
  INDEX idx_products_bestseller (is_bestseller),
  INDEX idx_products_seasonal (is_seasonal),
  INDEX idx_products_organic (is_organic),
  INDEX idx_products_rating (average_rating),
  INDEX idx_products_created (created_at),
  FULLTEXT INDEX ft_products_search (name, description, short_description, ingredients, brand)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. PRODUCT IMAGES
-- ============================================================
CREATE TABLE product_images (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  is_primary TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_pi_product (product_id),
  INDEX idx_pi_primary (product_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. PRODUCT VARIANTS
-- ============================================================
CREATE TABLE product_variants (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  variant_name VARCHAR(100) NOT NULL,
  variant_value VARCHAR(100) NOT NULL,
  price_modifier DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_quantity INT NOT NULL DEFAULT 0,
  sku_suffix VARCHAR(50),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_pv_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. PRODUCT TAGS
-- ============================================================
CREATE TABLE product_tags (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  tag VARCHAR(50) NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_pt_product (product_id),
  INDEX idx_pt_tag (tag)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. ORDERS
-- ============================================================
CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  address_id INT UNSIGNED NOT NULL,
  status ENUM('pending','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','return_requested','returned','refund_initiated','refunded') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  coupon_code VARCHAR(50),
  coupon_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  points_used INT NOT NULL DEFAULT 0,
  points_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('online','cod') NOT NULL DEFAULT 'cod',
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  notes TEXT,
  estimated_delivery DATE,
  delivered_at DATETIME,
  -- Post-delivery lifecycle emails (sent by the background scheduler):
  -- review request ~2-3 days after delivery, reorder nudge ~14 days after.
  review_email_sent_at DATETIME,
  reorder_email_sent_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT,
  INDEX idx_orders_number (order_number),
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_payment_status (payment_status),
  INDEX idx_orders_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  variant_info JSON,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  INDEX idx_oi_order (order_id),
  INDEX idx_oi_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. ORDER TRACKING
-- ============================================================
CREATE TABLE order_tracking (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  status VARCHAR(50) NOT NULL,
  message TEXT,
  location VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_ot_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. CART
-- ============================================================
CREATE TABLE cart (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  guest_id VARCHAR(64) DEFAULT NULL,
  coupon_code VARCHAR(50),
  coupon_discount DECIMAL(10,2) DEFAULT 0.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_cart_guest (guest_id),
  UNIQUE KEY idx_cart_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. CART ITEMS
-- ============================================================
CREATE TABLE cart_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  variant_id INT UNSIGNED DEFAULT NULL,
  quantity INT NOT NULL DEFAULT 1,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
  INDEX idx_ci_cart (cart_id),
  INDEX idx_ci_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 13. WISHLIST
-- ============================================================
CREATE TABLE wishlist (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  price_at_add DECIMAL(10,2),
  last_alert_price DECIMAL(10,2),
  price_drop_alerted_at DATETIME,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_wishlist_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 14. COUPONS
-- ============================================================
CREATE TABLE coupons (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  type ENUM('percentage','flat','free_shipping','bogo') NOT NULL DEFAULT 'percentage',
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INT NOT NULL DEFAULT 0,
  used_count INT NOT NULL DEFAULT 0,
  applicable_categories JSON,
  applicable_products JSON,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coupons_code (code),
  INDEX idx_coupons_active (is_active, valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 15. COUPON USAGE
-- ============================================================
CREATE TABLE coupon_usage (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  coupon_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED NOT NULL,
  discount_applied DECIMAL(10,2) NOT NULL,
  used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_cu_coupon (coupon_id),
  INDEX idx_cu_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 16. REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  order_id INT UNSIGNED DEFAULT NULL,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  body TEXT,
  images JSON,
  is_verified_purchase TINYINT(1) NOT NULL DEFAULT 0,
  helpful_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_approved TINYINT(1) NOT NULL DEFAULT 0,
  show_on_home TINYINT(1) NOT NULL DEFAULT 0,
  admin_reply TEXT,
  admin_replied_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_rev_product (product_id),
  INDEX idx_rev_user (user_id),
  INDEX idx_rev_rating (rating),
  INDEX idx_rev_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 17. REVIEW VOTES
-- ============================================================
CREATE TABLE review_votes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  review_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  is_helpful TINYINT(1) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_rv_review_user (review_id, user_id),
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 18. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSON,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_read (user_id, is_read),
  INDEX idx_notif_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 19. BANNERS
-- ============================================================
CREATE TABLE banners (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  subtitle VARCHAR(500),
  image_url VARCHAR(500) NOT NULL,
  mobile_image_url VARCHAR(500),
  link_url VARCHAR(500),
  position ENUM('hero','mid','sidebar') NOT NULL DEFAULT 'hero',
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  valid_from DATETIME,
  valid_until DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_banners_position (position, sort_order),
  INDEX idx_banners_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20. FLASH SALES
-- ============================================================
CREATE TABLE flash_sales (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  quantity_limit INT NOT NULL DEFAULT 0,
  sold_count INT NOT NULL DEFAULT 0,
  starts_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_fs_product (product_id),
  INDEX idx_fs_active (is_active, starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 20b. BUNDLES (combo deals)
-- ============================================================
CREATE TABLE bundles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  description VARCHAR(500),
  bundle_price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  valid_from DATETIME,
  valid_until DATETIME,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bundles_active (is_active, valid_until),
  INDEX idx_bundles_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bundle_products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bundle_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_bundle_product (bundle_id, product_id),
  FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_bp_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 21. LOYALTY POINTS
-- ============================================================
CREATE TABLE loyalty_points (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  points INT NOT NULL,
  type ENUM('earned','redeemed','expired') NOT NULL DEFAULT 'earned',
  reference_id VARCHAR(100),
  description VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_lp_user (user_id),
  INDEX idx_lp_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 22. USER LOYALTY
-- ============================================================
CREATE TABLE user_loyalty (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL UNIQUE,
  total_points INT NOT NULL DEFAULT 0,
  lifetime_earned INT NOT NULL DEFAULT 0,
  tier ENUM('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 23. REFERRALS
-- ============================================================
CREATE TABLE referrals (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  referrer_id INT UNSIGNED NOT NULL,
  referred_id INT UNSIGNED NOT NULL,
  referral_code VARCHAR(50) NOT NULL,
  reward_given TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ref_referrer (referrer_id),
  INDEX idx_ref_code (referral_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 24. SEARCH LOGS
-- ============================================================
CREATE TABLE search_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL,
  query VARCHAR(255) NOT NULL,
  results_count INT DEFAULT 0,
  clicked_product_id INT UNSIGNED DEFAULT NULL,
  ip_address VARCHAR(45),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sl_query (query),
  INDEX idx_sl_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 25. SITE SETTINGS
-- ============================================================
CREATE TABLE site_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ss_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 26. SUBSCRIBERS
-- ============================================================
CREATE TABLE subscribers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subs_email (email),
  INDEX idx_subs_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 27. BANK OFFERS
-- ============================================================
CREATE TABLE bank_offers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL,
  bank_code VARCHAR(20),
  logo_url VARCHAR(500),
  offer_title VARCHAR(255) NOT NULL,
  offer_description VARCHAR(500),
  discount_type ENUM('credit_card','debit_card','upi','emi','netbanking') NOT NULL DEFAULT 'credit_card',
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(10,2),
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  valid_from DATETIME,
  valid_until DATETIME,
  terms_url VARCHAR(500),
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_bo_offer (bank_code, offer_title),
  INDEX idx_bo_active (is_active, valid_until),
  INDEX idx_bo_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 28. NAVBAR ITEMS (admin-managed storefront nav links)
-- ============================================================
CREATE TABLE navbar_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  label_key VARCHAR(50) NULL COMMENT 'Translation key (nav.*) for localized labels; falls back to label',
  label VARCHAR(100) NOT NULL COMMENT 'Display label (used when label_key has no translation)',
  href VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_navbar_active_order (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO navbar_items (label_key, label, href, sort_order, is_active) VALUES
  ('shop_by_region', 'Shop by Region', '/#shop-by-region', 1, 1),
  ('fresh_arrivals', 'Fresh Arrivals', '/products?sort=newest', 2, 1),
  ('seasonal_picks', 'Seasonal Picks', '/products?seasonal=true', 3, 1),
  ('seafood', 'Seafood', '/categories/coastal-seafood', 4, 1),
  ('organic', 'Organic', '/products?organic=true', 5, 1),
  ('cashew_special', 'Cashew Special', '/categories/cashew-dry-fruits', 6, 1),
  ('konkan_mango', 'Konkan Mango', '/categories/konkan-mangoes-fruits', 7, 1),
  ('offers', 'Offers', '/offers', 8, 1),
  ('about', 'About', '/about', 9, 1),
  ('blog', 'Blog', '/blog', 10, 1),
  ('videos', 'Videos', '/videos', 11, 1);

-- ============================================================
-- INSERT DEFAULT SETTINGS
-- ============================================================
INSERT INTO site_settings (setting_key, value) VALUES
('site_name', 'Konkan Bazaar'),
('site_description', 'Authentic Konkan region products delivered to your doorstep'),
('contact_email', 'hello@konkanbazaar.in'),
('contact_phone', '+91-9876543210'),
('free_shipping_min', '499'),
('delivery_charge', '49'),
('tax_rate', '5'),
('loyalty_points_per_rupee', '10'),
('loyalty_redeem_rate', '100'),
('referral_reward_amount', '50'),
('social_facebook', 'https://facebook.com/konkanbazaar'),
('social_instagram', 'https://instagram.com/konkanbazaar'),
('social_twitter', 'https://twitter.com/konkanbazaar'),
('store_hours', 'Mon-Sat: 9:00 AM - 8:00 PM, Sun: 10:00 AM - 6:00 PM'),
('address', 'Shop No. 45, Konkan Market, Mapusa, Goa 403507'),
('bundle_discount_percent', '10'),
('bundle_min_quantity', '3');
