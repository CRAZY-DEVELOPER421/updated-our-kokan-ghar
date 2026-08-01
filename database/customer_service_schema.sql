-- ============================================================
-- CUSTOMER SERVICE PAGES — Terms, Return Policy, Shipping,
-- Shipping Policy, FAQ, Privacy Policy & custom service pages
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_service_pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  service_key VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  page_type ENUM('text','faq') NOT NULL DEFAULT 'text',
  content JSON NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_csp_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
