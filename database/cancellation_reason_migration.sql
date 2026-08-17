-- Cancellation Reasons + Analytics
-- Adds a cancel_reason column to orders so customers can say WHY they
-- cancelled, and admins can see a cancellation-reasons breakdown.
-- Run: mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < cancellation_reason_migration.sql

ALTER TABLE orders
  ADD COLUMN cancel_reason VARCHAR(191) NULL DEFAULT NULL AFTER payment_status;
