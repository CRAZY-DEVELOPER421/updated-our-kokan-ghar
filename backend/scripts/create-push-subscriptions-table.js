/**
 * Create push_subscriptions table for Web Push notifications.
 * Run: node scripts/create-push-subscriptions-table.js
 */
const pool = require('../config/db');

async function createTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT UNSIGNED NULL,
      endpoint TEXT NOT NULL,
      p256dh_key TEXT NOT NULL,
      auth_key TEXT NOT NULL,
      device_info VARCHAR(255) NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_endpoint (endpoint(500)),
      INDEX idx_push_user (user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(sql);
    console.log('✅ push_subscriptions table created successfully.');
  } catch (err) {
    if (err.code === 'ER_DUP_KEYNAME') {
      console.log('ℹ️  push_subscriptions table already exists.');
    } else {
      console.error('❌ Error creating table:', err.message);
    }
  } finally {
    await pool.end();
  }
}

createTable();
