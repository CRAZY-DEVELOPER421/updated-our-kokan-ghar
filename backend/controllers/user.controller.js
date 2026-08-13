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
  const { name, phone, avatar_url, email } = req.body;

  // Email is editable from the profile page. It is stored EXACTLY as the user
  // typed it (lowercased only — dots, +tags, %, # etc. are all preserved, so
  // sawant.sakshi016@gmail.com never becomes sawantsakshi016@gmail.com).
  let cleanEmail = null;
  if (email !== undefined && email !== null && String(email).trim() !== '') {
    cleanEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return ApiResponse.error(res, 'Invalid email format.', 400);
    }
    // Skip the duplicate check when the email didn't actually change.
    const [me] = await pool.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    if (!me.length || me[0].email !== cleanEmail) {
      const [dup] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [cleanEmail, req.user.id]
      );
      if (dup.length > 0) {
        return ApiResponse.error(res, 'This email is already registered.', 409);
      }
    }
  }

  await pool.query(
    `UPDATE users SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      avatar_url = COALESCE(?, avatar_url),
      email = COALESCE(?, email)
     WHERE id = ?`,
    [name, phone, avatar_url, cleanEmail, req.user.id]
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

  // OAuth-created accounts (password_hash NULL) have no current password —
  // they must use /users/set-password first. bcrypt.compare would throw on a
  // null hash, so short-circuit to a clean 400 instead of a 500.
  const isMatch = users[0].password_hash
    ? await bcrypt.compare(current_password, users[0].password_hash)
    : false;
  if (!isMatch) {
    return ApiResponse.error(res, 'Current password is incorrect.', 400);
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(new_password, salt);

  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, req.user.id]);

  return ApiResponse.success(res, {}, 'Password changed successfully.');
});

/**
 * Set a password on an account created via Google/Facebook.
 *
 * Those accounts are inserted with password_hash = NULL, so this endpoint is
 * the ONLY way they can gain an email/password credential. Once set, BOTH
 * the social login AND the email/password login reach the same account.
 * A user who already has a password (regular signup / already set) is
 * rejected — they should use change-password instead.
 */
const setPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  const [users] = await pool.query(
    'SELECT password_hash FROM users WHERE id = ?',
    [req.user.id]
  );

  if (users.length === 0) {
    return ApiResponse.error(res, 'User not found.', 404);
  }

  if (users[0].password_hash) {
    return ApiResponse.error(res, 'You already have a password set. Use Change Password to update it.', 400);
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(password, salt);

  // Conditional UPDATE — atomically guarded by password_hash IS NULL so two
  // concurrent requests can never both claim the "no password yet" slot.
  const [result] = await pool.query(
    'UPDATE users SET password_hash = ? WHERE id = ? AND password_hash IS NULL',
    [password_hash, req.user.id]
  );

  if (result.affectedRows === 0) {
    return ApiResponse.error(res, 'You already have a password set. Use Change Password to update it.', 400);
  }

  return ApiResponse.success(res, {}, 'Password set successfully. You can now sign in with email & password too.');
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
  setPassword,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getNotifications,
  markNotificationRead,
  getLoyaltyInfo
};
