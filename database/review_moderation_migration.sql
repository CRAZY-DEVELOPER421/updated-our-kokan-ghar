-- ============================================================
-- REVIEW MODERATION — migration for EXISTING databases
-- ============================================================
-- Run this ONCE against your existing database to enable the
-- admin review moderation panel (approve/hide) + admin replies:
--
--   mysql -u <user> -p konkan_bazaar < review_moderation_migration.sql
--
-- What it adds:
--   1. `admin_reply`        — the store's public reply shown under a review
--   2. `admin_replied_at`   — when the reply was posted (displayed on the
--                             storefront and lets us sort/audit)
--
-- New reviews are AUTO-APPROVED on insert (is_approved = 1), so the site
-- never shows "0 reviews" while the admin moderates. The admin panel uses
-- is_approved to Approve / Hide (reject) any review.
ALTER TABLE reviews
  ADD COLUMN admin_reply TEXT NULL AFTER is_approved,
  ADD COLUMN admin_replied_at DATETIME NULL AFTER admin_reply;
