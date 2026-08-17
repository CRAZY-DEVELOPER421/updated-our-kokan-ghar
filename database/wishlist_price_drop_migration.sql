-- ============================================================
-- WISHLIST PRICE-DROP ALERTS — migration for EXISTING databases
-- ============================================================
-- Run this ONCE against your existing database to enable price-drop
-- notifications + emails for wishlist items:
--
--   mysql -u <user> -p konkan_bazaar < wishlist_price_drop_migration.sql
--
-- What it adds:
--   1. `price_at_add`        — the product's price when the customer added it
--                              to the wishlist (the "pehli baar" baseline).
--   2. `last_alert_price`    — the price at which we last sent an alert. A new
--                              alert only fires when the price drops another
--                              5% below THIS, so the same drop never double-
--                              sends, but a further drop triggers a fresh one.
--   3. `price_drop_alerted_at` — when the last alert went out (audit/debug).
--
-- Existing wishlist rows are backfilled to TODAY'S price, so a product that
-- already dropped before this feature shipped does NOT trigger an instant
-- flood of alerts — tracking starts from now for old rows.
ALTER TABLE wishlist
  ADD COLUMN price_at_add DECIMAL(10,2) NULL AFTER product_id,
  ADD COLUMN last_alert_price DECIMAL(10,2) NULL AFTER price_at_add,
  ADD COLUMN price_drop_alerted_at DATETIME NULL AFTER last_alert_price;

UPDATE wishlist w
JOIN products p ON p.id = w.product_id
SET w.price_at_add = p.price
WHERE w.price_at_add IS NULL;
