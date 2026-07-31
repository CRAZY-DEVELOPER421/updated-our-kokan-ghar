const pool = require('../config/db');

/**
 * Create a notification for a user
 * @param {number} userId - The user ID to notify
 * @param {string} type - Notification type (e.g. order_confirmed, order_shipped, etc.)
 * @param {string} title - Notification title
 * @param {string|null} message - Optional detailed message
 * @param {object|null} data - Optional JSON data payload
 */
async function createNotification(userId, type, title, message = null, data = null) {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
      [userId, type, title, message, data ? JSON.stringify(data) : null]
    );
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
}

module.exports = {
  createNotification,
};
