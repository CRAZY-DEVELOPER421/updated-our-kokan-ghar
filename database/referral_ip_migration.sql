-- ============================================================
-- REFERRAL DEVICE GUARD — migration for EXISTING databases
-- ============================================================
-- Run this AFTER referral_migration.sql to stop repeated signups
-- from the same device/IP farming referral coins:
--
--   mysql -u <user> -p konkan_bazaar < referral_ip_migration.sql
--
-- Why:
--   Phone + email uniqueness already block re-signup with the same
--   identity. But a user could create accounts with a NEW phone +
--   NEW email from the same device and redeem a referral code every
--   time. `signup_ip` lets the backend enforce: a referral code is
--   only honoured on a device that has never created an account.
--   (Signing up WITHOUT a code is always allowed.)

ALTER TABLE users
  ADD COLUMN signup_ip VARCHAR(45) DEFAULT NULL AFTER referral_code,
  ADD INDEX idx_users_signup_ip (signup_ip);
