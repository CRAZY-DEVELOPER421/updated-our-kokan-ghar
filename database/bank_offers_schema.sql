-- ============================================================
-- BANK OFFERS — migration for existing databases
-- Run:  mysql -u root -p konkan_bazaar < bank_offers_schema.sql
-- ============================================================
USE konkan_bazaar;

CREATE TABLE IF NOT EXISTS bank_offers (
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

-- Sample seed data (replace with real bank partnerships)
INSERT IGNORE INTO bank_offers (bank_name, bank_code, logo_url, offer_title, offer_description, discount_type, min_order_amount, max_discount, is_active, valid_from, valid_until, terms_url, sort_order) VALUES
('HDFC Bank', 'HDFC', NULL, 'Up to ₹150 OFF on credit cards', 'Flat discount on HDFC Credit Card transactions', 'credit_card', 999.00, 150.00, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, 1),
('ICICI Bank', 'ICICI', NULL, 'Up to ₹125 OFF on credit cards', 'Instant discount on ICICI Credit Card payments', 'credit_card', 999.00, 125.00, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, 2),
('State Bank of India', 'SBI', NULL, '10% off on debit cards', '10% instant discount on SBI Debit Card transactions', 'debit_card', 1499.00, 200.00, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, 3),
('Axis Bank', 'AXIS', NULL, '₹100 OFF on UPI payments', 'Flat ₹100 cashback on Axis UPI payments', 'upi', 799.00, 100.00, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, 4),
('Kotak Mahindra Bank', 'KOTAK', NULL, 'No-cost EMI on orders above ₹2,999', 'Pay in easy EMI installments with zero interest', 'emi', 2999.00, NULL, 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NULL, 5);
