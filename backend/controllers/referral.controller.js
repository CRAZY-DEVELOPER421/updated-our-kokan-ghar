const pool = require('../config/db');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const generateReferralCode = () => {
  let c = '';
  for (let i = 0; i < 6; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `KB${c}`;
};

// Ensure a user always has a personal referral code (generated at signup,
// backfilled for legacy accounts on first fetch).
const ensureReferralCode = async (userId) => {
  const [rows] = await pool.query('SELECT referral_code FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) return null;
  if (rows[0].referral_code) return rows[0].referral_code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateReferralCode();
    try {
      await pool.query('UPDATE users SET referral_code = ? WHERE id = ?', [candidate, userId]);
      return candidate;
    } catch (err) {
      if (!err.code || err.code !== 'ER_DUP_ENTRY') throw err;
    }
  }
  throw new Error('Could not generate a unique referral code.');
};

// GET /users/referrals — personal code, share link and reward summary.
const getReferrals = asyncHandler(async (req, res) => {
  const code = await ensureReferralCode(req.user.id);

  const [rows] = await pool.query(
    `SELECT r.id, r.referral_code, r.reward_given, r.created_at,
            u.name AS referred_name, u.email AS referred_email
     FROM referrals r
     JOIN users u ON u.id = r.referred_id
     WHERE r.referrer_id = ?
     ORDER BY r.created_at DESC`,
    [req.user.id]
  );

  const [rewardRows] = await pool.query(
    "SELECT value FROM site_settings WHERE setting_key = 'referral_reward_amount'"
  );
  const rewardAmount = rewardRows.length > 0 ? Number(rewardRows[0].value) : 50;

  const totalReferred = rows.length;
  const rewarded = rows.filter((r) => Number(r.reward_given) === 1).length;

  return ApiResponse.success(res, {
    code,
    reward_amount: rewardAmount,
    link: `/signup?ref=${code}`,
    summary: {
      total_referred: totalReferred,
      rewarded: rewarded,
      pending: totalReferred - rewarded,
      total_reward_coins: rewarded * rewardAmount,
    },
    referrals: rows,
  });
});

module.exports = { getReferrals, ensureReferralCode, generateReferralCode };
