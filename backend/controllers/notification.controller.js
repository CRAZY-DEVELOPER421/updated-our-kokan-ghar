const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const [notifications] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [req.user.id, limit, offset]
  );

  const [unreadCount] = await pool.query(
    'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
    [req.user.id]
  );

  const [total] = await pool.query(
    'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
    [req.user.id]
  );

  return ApiResponse.paginated(res, {
    notifications,
    unread_count: unreadCount[0].count
  }, {
    page, limit,
    total: total[0].total,
    pages: Math.ceil(total[0].total / limit)
  });
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  return ApiResponse.success(res, {}, 'Notification marked as read.');
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
    [req.user.id]
  );

  return ApiResponse.success(res, {}, 'All notifications marked as read.');
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
