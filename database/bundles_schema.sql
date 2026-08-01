-- ============================================================
-- BUNDLES (combo deals) — standalone migration
-- Adds the bundles + bundle_products tables for the Offers page
-- Bundle Deals section. Safe to run on an existing database.
--
-- Run:  mysql -u root -p konkan_bazaar < bundles_schema.sql
-- ============================================================
USE konkan_bazaar;

CREATE TABLE IF NOT EXISTS bundles (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED,
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
  INDEX idx_bundles_sort (sort_order),
  INDEX idx_bundles_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bundle_products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  bundle_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_bundle_product (bundle_id, product_id),
  FOREIGN KEY (bundle_id) REFERENCES bundles(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_bp_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
