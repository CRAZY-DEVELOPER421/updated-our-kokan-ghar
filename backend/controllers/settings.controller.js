const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const getSettings = asyncHandler(async (req, res) => {
  const [settings] = await pool.query('SELECT setting_key, `value` FROM site_settings ORDER BY id ASC');
  const result = {};
  settings.forEach(s => {
    result[s.setting_key] = s.value;
  });
  return ApiResponse.success(res, { settings: result });
});

const updateSettings = asyncHandler(async (req, res) => {
  const updates = req.body;
  if (!updates || Object.keys(updates).length === 0) {
    return ApiResponse.error(res, 'No settings to update.', 400);
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined) {
      await pool.query(
        'INSERT INTO site_settings (setting_key, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        [key, value, value]
      );
    }
  }

  return ApiResponse.success(res, {}, 'Settings updated successfully.');
});

module.exports = {
  getSettings,
  updateSettings,
};
