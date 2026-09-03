-- ============================================================
-- Migration: Buy More, Save More — slab discount on orders
-- ============================================================
-- The cart page always showed tiered discounts (5%/10%/15% based on
-- subtotal). This migration adds the ledger columns so order creation
-- stores exactly what the customer saw and was charged.
--   slab_percent  TINYINT  — the tier (0, 5, 10, 15)
--   slab_discount DECIMAL  — the rupee discount applied to this order
-- The shared calculation lives in backend/services/slabDiscount.service.js
-- and drives BOTH the cart summary and order creation.
ALTER TABLE orders
  ADD COLUMN slab_percent TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER coupon_discount,
  ADD COLUMN slab_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER slab_percent;
