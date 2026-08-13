/**
 * Shared suspension helpers — used by login, refresh-token, verifyToken and
 * OAuth linking so timed/permanent suspension behaves identically everywhere.
 *
 * Semantics:
 *   - is_active = 1                          -> active
 *   - is_active = 0 AND suspend_until NULL   -> PERMANENT suspension
 *   - is_active = 0 AND suspend_until future -> timed suspension (until date)
 *   - is_active = 0 AND suspend_until past   -> expired: auto-reactivate
 */
const pool = require('../config/db');

/**
 * Given a raw user row (must include is_active + suspend_until), return:
 *   { ok: true }                          -> user is allowed in
 *   { ok: true, reactivated: true }       -> expired timed suspension, DB row corrected
 *   { ok: false, message, statusCode }    -> still suspended, friendly message
 *
 * The row is MUTATED in place (is_active/suspend_until updated) when reactivated
 * so callers can re-use it without a fresh SELECT.
 */
const resolveUserStatus = async (user) => {
  if (Number(user.is_active) === 1) {
    return { ok: true };
  }

  // Timed suspension that already expired -> auto-reactivate and let them in.
  if (user.suspend_until && new Date(user.suspend_until).getTime() <= Date.now()) {
    await pool.query('UPDATE users SET is_active = 1, suspend_until = NULL WHERE id = ?', [user.id]);
    user.is_active = 1;
    user.suspend_until = null;
    return { ok: true, reactivated: true };
  }

  const until = user.suspend_until
    ? new Date(user.suspend_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return {
    ok: false,
    statusCode: 403,
    code: 'ACCOUNT_SUSPENDED',
    suspendUntil: user.suspend_until ? new Date(user.suspend_until).toISOString() : null,
    permanent: !user.suspend_until,
    message: until
      ? `Your account is temporarily suspended until ${until}. Please contact support if you think this is a mistake.`
      : 'Your account has been suspended. Please contact support.',
  };
};

/** Friendly computed status for admin UI (mirrors resolveUserStatus). */
const statusOf = (u) => {
  if (Number(u.is_active) === 1) return 'active';
  if (!u.suspend_until) return 'permanent_suspend';
  const until = new Date(u.suspend_until);
  if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) return 'active';
  return 'suspend';
};

/**
 * Flip every timed suspension that has already expired back to active IN THE
 * DATABASE. Single source of truth for "what counts as expired" — used by the
 * admin users list (so the admin sees Active immediately) and the server.js
 * background sweep (so users are unblocked even without any request).
 * Returns the number of rows reactivated.
 */
const reactivateExpiredSuspensions = async () => {
  const [result] = await pool.query(
    "UPDATE users SET is_active = 1, suspend_until = NULL WHERE is_active = 0 AND suspend_until IS NOT NULL AND suspend_until <= NOW()"
  );
  return result.affectedRows || 0;
};

module.exports = { resolveUserStatus, statusOf, reactivateExpiredSuspensions };
