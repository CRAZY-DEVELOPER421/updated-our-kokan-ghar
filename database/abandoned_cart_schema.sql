-- ============================================================
-- ABANDONED CART RECOVERY — Schema Migration
-- ============================================================
-- Run once:
--   mysql -u root -p konkan_bazaar < database/abandoned_cart_schema.sql
-- ============================================================

USE konkan_bazaar;

-- Tracks when a recovery email was sent for a cart so we never spam.
-- One row per cart — updated each time a new recovery email goes out.
CREATE TABLE IF NOT EXISTS abandoned_cart_emails (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id         INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED DEFAULT NULL,
  email           VARCHAR(255) NOT NULL,
  coupon_code     VARCHAR(50) DEFAULT NULL,
  coupon_id       INT UNSIGNED DEFAULT NULL,
  cart_total      DECIMAL(10,2) NOT NULL DEFAULT 0,
  item_count      INT UNSIGNED NOT NULL DEFAULT 0,
  status          ENUM('SENT', 'OPENED', 'RECOVERED') NOT NULL DEFAULT 'SENT',
  sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  opened_at       DATETIME DEFAULT NULL,
  recovered_at    DATETIME DEFAULT NULL,
  recovered_order_id INT UNSIGNED DEFAULT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ace_cart (cart_id),
  INDEX idx_ace_user (user_id),
  INDEX idx_ace_status (status),
  INDEX idx_ace_sent (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
