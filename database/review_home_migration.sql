-- ============================================================
-- REVIEW → HOME SLIDER — migration for EXISTING databases
-- ============================================================
-- Run this ONCE against your existing database to enable picking
-- customer reviews from the admin panel ("Add to Home") that then
-- appear in the homepage "What Our Customers Say" slider:
--
--   mysql -u <user> -p konkan_bazaar < review_home_migration.sql
--
-- `show_on_home` = 1 means the review is featured on the homepage.
-- Only APPROVED reviews can be featured (enforced by the public
-- endpoint), and the homepage falls back to recent approved reviews
-- when nothing is explicitly featured.
ALTER TABLE reviews
  ADD COLUMN show_on_home TINYINT(1) NOT NULL DEFAULT 0 AFTER is_approved,
  ADD INDEX idx_rev_home (show_on_home, is_approved);
