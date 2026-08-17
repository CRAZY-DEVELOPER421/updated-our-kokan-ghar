-- ============================================================
-- LOYALTY POINTS REDEEM AT CHECKOUT — migration for EXISTING databases
-- ============================================================
-- Run this ONCE against your existing database to enable redeeming
-- Konkan Points at checkout:
--
--   mysql -u <user> -p konkan_bazaar < loyalty_redeem_migration.sql
--
-- Why: orders previously had no way to record how many loyalty points
-- a customer redeemed (and the ₹ discount those points produced), so the
-- redeemable balance couldn't be deducted or refunded per order.

ALTER TABLE orders
  ADD COLUMN points_used INT NOT NULL DEFAULT 0 AFTER coupon_discount,
  ADD COLUMN points_discount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER points_used;
