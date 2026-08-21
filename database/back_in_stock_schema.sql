-- ============================================================
-- BACK-IN-STOCK NOTIFICATION REQUESTS
-- ============================================================
-- Tracks which users/guests want to be notified when an
-- out-of-stock product is restocked.
-- ============================================================

USE konkan_bazaar;

CREATE TABLE IF NOT EXISTS back_in_stock_requests (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id  INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED DEFAULT NULL,
  email       VARCHAR(255) NOT NULL,
  is_notified TINYINT(1) NOT NULL DEFAULT 0,
  notified_at DATETIME DEFAULT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- One request per user per product (prevents duplicates)
  UNIQUE KEY uk_bis_user_product (product_id, user_id),
  UNIQUE KEY uk_bis_email_product (product_id, email),
  INDEX idx_bis_product (product_id),
  INDEX idx_bis_notified (is_notified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
