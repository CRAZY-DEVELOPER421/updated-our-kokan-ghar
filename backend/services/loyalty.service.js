const pool = require('../config/db');

const POINTS_PER_RUPEE = 10;
const REDEEM_RATE = 100;
const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 5000,
  platinum: 10000
};

const calculateTier = (totalPoints) => {
  if (totalPoints >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (totalPoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (totalPoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
};

const ensureUserLoyalty = async (userId) => {
  const [existing] = await pool.query(
    'SELECT id FROM user_loyalty WHERE user_id = ?',
    [userId]
  );

  if (existing.length === 0) {
    await pool.query(
      'INSERT INTO user_loyalty (user_id, total_points, lifetime_earned, tier) VALUES (?, 0, 0, ?)',
      [userId, 'bronze']
    );
    return { total_points: 0, lifetime_earned: 0, tier: 'bronze' };
  }

  const [loyalty] = await pool.query(
    'SELECT * FROM user_loyalty WHERE user_id = ?',
    [userId]
  );
  return loyalty[0];
};

const addPoints = async (userId, amount, description = '') => {
  try {
    const points = Math.floor(amount / POINTS_PER_RUPEE);
    if (points <= 0) return { success: true, points: 0 };

    const [result] = await pool.query(
      'INSERT INTO loyalty_points (user_id, points, type, description) VALUES (?, ?, ?, ?)',
      [userId, points, 'earned', description || 'Points earned from order']
    );

    const [currentLoyalty] = await pool.query(
      'SELECT lifetime_earned FROM user_loyalty WHERE user_id = ?',
      [userId]
    );
    const newTotalLifetime = (currentLoyalty.length > 0 ? currentLoyalty[0].lifetime_earned : 0) + points;

    await pool.query(
      `UPDATE user_loyalty 
       SET total_points = total_points + ?, 
           lifetime_earned = lifetime_earned + ?,
           tier = ?,
           updated_at = NOW()
       WHERE user_id = ?`,
      [points, points, calculateTier(newTotalLifetime), userId]
    );

    return { success: true, points };
  } catch (error) {
    console.error('❌ Add points error:', error.message);
    return { success: false, error: error.message };
  }
};

const redeemPoints = async (userId, pointsToRedeem) => {
  try {
    const loyalty = await ensureUserLoyalty(userId);

    if (loyalty.total_points < pointsToRedeem) {
      return { success: false, message: 'Insufficient loyalty points.' };
    }

    const discountAmount = Math.floor(pointsToRedeem / REDEEM_RATE) * 10;
    const actualPointsToRedeem = discountAmount * REDEEM_RATE;

    await pool.query(
      'INSERT INTO loyalty_points (user_id, points, type, description) VALUES (?, ?, ?, ?)',
      [userId, -actualPointsToRedeem, 'redeemed', `Redeemed for ₹${discountAmount} discount`]
    );

    await pool.query(
      `UPDATE user_loyalty 
       SET total_points = total_points - ?,
           updated_at = NOW()
       WHERE user_id = ?`,
      [actualPointsToRedeem, userId]
    );

    return { success: true, discountAmount, pointsUsed: actualPointsToRedeem };
  } catch (error) {
    console.error('❌ Redeem points error:', error.message);
    return { success: false, error: error.message };
  }
};

const getLoyaltyInfo = async (userId) => {
  try {
    const loyalty = await ensureUserLoyalty(userId);
    const currentTier = calculateTier(loyalty.total_points);

    let nextTier = null;
    let pointsToNextTier = 0;

    if (currentTier === 'bronze') {
      nextTier = 'silver';
      pointsToNextTier = TIER_THRESHOLDS.silver - loyalty.total_points;
    } else if (currentTier === 'silver') {
      nextTier = 'gold';
      pointsToNextTier = TIER_THRESHOLDS.gold - loyalty.total_points;
    } else if (currentTier === 'gold') {
      nextTier = 'platinum';
      pointsToNextTier = TIER_THRESHOLDS.platinum - loyalty.total_points;
    }

    const [recentPoints] = await pool.query(
      'SELECT * FROM loyalty_points WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [userId]
    );

    loyalty.current_tier = currentTier;
    loyalty.next_tier = nextTier;
    loyalty.points_to_next_tier = pointsToNextTier > 0 ? pointsToNextTier : 0;
    loyalty.recent_activity = recentPoints;
    loyalty.points_value = Math.floor(loyalty.total_points / REDEEM_RATE) * 10;

    return loyalty;
  } catch (error) {
    console.error('❌ Get loyalty info error:', error.message);
    return null;
  }
};

module.exports = {
  addPoints,
  redeemPoints,
  getLoyaltyInfo,
  ensureUserLoyalty,
  POINTS_PER_RUPEE,
  REDEEM_RATE,
  TIER_THRESHOLDS
};
