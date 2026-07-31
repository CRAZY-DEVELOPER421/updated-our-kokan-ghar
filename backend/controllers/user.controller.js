const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const loyaltyService = require('../services/loyalty.service');

const getProfile = asyncHandler(async (req, res) => {
  const [users] = await pool.query(
    'SELECT id, name, email, phone, role, avatar_url, is_verified, is_active, last_login, created_at FROM users WHERE id = ?',
    [req.user.id]
  );

  if (users.length === 0) {
    return ApiResponse.error(res, 'User not found.', 404);
  }

  return ApiResponse.success(res, { user: users[0] });
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar_url } = req.body;

  await pool.query(
    'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
    [name, phone, avatar_url, req.user.id]
  );

  const [users] = await pool.query(
    'SELECT id, name, email, phone, role, avatar_url FROM users WHERE id = ?',
    [req.user.id]
  );

  return ApiResponse.success(res, { user: users[0] }, 'Profile updated successfully.');
});

const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  const [users] = await pool.query(
    'SELECT password_hash FROM users WHERE id = ?',
    [req.user.id]
  );

  const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
  if (!isMatch) {
    return ApiResponse.error(res, 'Current password is incorrect.', 400);
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(new_password, salt);

  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, req.user.id]);

  return ApiResponse.success(res, {}, 'Password changed successfully.');
});

const getAddresses = asyncHandler(async (req, res) => {
  const [addresses] = await pool.query(
    'SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
    [req.user.id]
  );

  return ApiResponse.success(res, { addresses });
});

const createAddress = asyncHandler(async (req, res) => {
  const { name, phone, house_no, street, city, state, pincode, is_default, address_type } = req.body;

  if (is_default) {
    await pool.query(
      'UPDATE addresses SET is_default = 0 WHERE user_id = ?',
      [req.user.id]
    );
  }

  const [result] = await pool.query(
    'INSERT INTO addresses (user_id, name, phone, house_no, street, city, state, pincode, is_default, address_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, name, phone, house_no, street, city, state, pincode, is_default ? 1 : 0, address_type || 'home']
  );

  const [addresses] = await pool.query('SELECT * FROM addresses WHERE id = ?', [result.insertId]);

  return ApiResponse.created(res, { address: addresses[0] }, 'Address added successfully.');
});

const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, house_no, street, city, state, pincode, is_default, address_type } = req.body;

  const [existing] = await pool.query(
    'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (existing.length === 0) {
    return ApiResponse.error(res, 'Address not found.', 404);
  }

  if (is_default) {
    await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
  }

  await pool.query(
    `UPDATE addresses SET 
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      house_no = COALESCE(?, house_no),
      street = COALESCE(?, street),
      city = COALESCE(?, city),
      state = COALESCE(?, state),
      pincode = COALESCE(?, pincode),
      is_default = COALESCE(?, is_default),
      address_type = COALESCE(?, address_type)
     WHERE id = ? AND user_id = ?`,
    [name, phone, house_no, street, city, state, pincode, is_default, address_type, id, req.user.id]
  );

  const [addresses] = await pool.query('SELECT * FROM addresses WHERE id = ?', [id]);

  return ApiResponse.success(res, { address: addresses[0] }, 'Address updated successfully.');
});

const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [result] = await pool.query(
    'DELETE FROM addresses WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  if (result.affectedRows === 0) {
    return ApiResponse.error(res, 'Address not found.', 404);
  }

  return ApiResponse.success(res, {}, 'Address deleted successfully.');
});

const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const [notifications] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
    [req.user.id, limit, offset]
  );

  const [countResult] = await pool.query(
    'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
    [req.user.id]
  );

  return ApiResponse.paginated(res, { notifications }, {
    page,
    limit,
    total: countResult[0].total,
    pages: Math.ceil(countResult[0].total / limit)
  });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await pool.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, req.user.id]
  );

  return ApiResponse.success(res, {}, 'Notification marked as read.');
});

const getLoyaltyInfo = asyncHandler(async (req, res) => {
  const loyalty = await loyaltyService.getLoyaltyInfo(req.user.id);

  if (!loyalty) {
    return ApiResponse.error(res, 'Could not fetch loyalty info.', 500);
  }

  return ApiResponse.success(res, { loyalty });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getNotifications,
  markNotificationRead,
  getLoyaltyInfo
};
