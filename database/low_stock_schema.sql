-- ============================================================
-- LOW STOCK ALERT + DAILY DIGEST — Schema Migration
-- ============================================================
-- Run this file once:
--   mysql -u root -p konkan_bazaar < database/low_stock_schema.sql
-- Idempotent: safe to re-run (IF NOT EXISTS / IF EXISTS guards).
-- ============================================================

USE konkan_bazaar;

-- ── 1. Add per-product low-stock & critical thresholds ──────────
-- These columns may already exist if the migration was partially
-- applied. Guard with IF NOT EXISTS so repeated runs are safe.

SET @exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'products'
    AND COLUMN_NAME  = 'low_stock_threshold'
);

SET @sql = IF(
  @exists = 0,
  'ALTER TABLE products
     ADD COLUMN low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 10
       AFTER stock_quantity,
     ADD COLUMN critical_stock_threshold INT UNSIGNED NOT NULL DEFAULT 3
       AFTER low_stock_threshold',
  'SELECT 1'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── 2. stock_alerts — tracks one active low-stock alert per product ──
-- Only ONE row per product can have status = 'ACTIVE' at any time.
-- When the product is restocked above threshold → status becomes 'RESOLVED'.
-- If it dips again later → a new ACTIVE row is inserted.

CREATE TABLE IF NOT EXISTS stock_alerts (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id        INT UNSIGNED NOT NULL,
  alert_type        ENUM('LOW_STOCK', 'CRITICAL', 'OUT_OF_STOCK') NOT NULL DEFAULT 'LOW_STOCK',
  threshold         INT UNSIGNED NOT NULL DEFAULT 10,
  stock_at_alert    INT NOT NULL DEFAULT 0,
  status            ENUM('ACTIVE', 'RESOLVED') NOT NULL DEFAULT 'ACTIVE',
  first_alert_sent_at DATETIME DEFAULT NULL,
  resolved_at       DATETIME DEFAULT NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Only one ACTIVE alert per product at a time (partial unique index)
  UNIQUE KEY uk_stock_alert_active_product (product_id, status, alert_type),
  INDEX idx_stock_alert_product (product_id),
  INDEX idx_stock_alert_status (status),
  INDEX idx_stock_alert_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Index on products for fast low-stock lookups ──────────────
-- Composite index: all low-stock queries filter is_active + stock_quantity.
SET @idx_exists = (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'products'
    AND INDEX_NAME = 'idx_products_stock_status'
);

SET @idx_sql = IF(
  @idx_exists = 0,
  'CREATE INDEX idx_products_stock_status ON products (is_active, stock_quantity)',
  'SELECT 1'
);

PREPARE idx_stmt FROM @idx_sql;
EXECUTE idx_stmt;
DEALLOCATE PREPARE idx_stmt;

-- ============================================================
-- NOTE: This migration does NOT modify any existing product
-- data. The new columns use safe defaults (10 and 3).
-- ============================================================
