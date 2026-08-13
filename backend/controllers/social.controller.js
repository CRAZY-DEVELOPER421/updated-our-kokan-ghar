/**
 * Social OAuth controllers (Google + Facebook).
 *
 * Flow overview
 * -------------
 *   1. Frontend links the user to  GET /api/auth/google  (?redirect=/checkout)
 *   2. We redirect to the provider's consent screen (PKCE + random `state`).
 *   3. Provider redirects the browser back to our callback URL
 *      (e.g. /api/auth/google/callback). The `state` cookie set in step 1 is
 *      validated (CSRF protection) and the authorization code is exchanged
 *      server-side — the client secret NEVER leaves this server.
 *   4. The provider profile is verified (email_verified must be true).
 *   5. `upsertSocialUser` inserts or links the user in the existing `users`
 *      table, then the exact same JWT session tokens as the regular login are
 *      issued (access token + httpOnly refresh cookie).
 *   6. The browser is redirected back to the frontend
 *      (/social-callback?provider=google&success=1) which completes the
 *      session client-side and sends the user on their way.
 *
 * All OAuth credentials come from the environment — never hardcode them.
 */
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { generateRefreshToken } = require('./auth.controller');
const { sendEmail, sendWelcomeEmail, sendLoginEmail } = require('../services/email.service');
const { resolveUserStatus } = require('../services/suspension.service');

// ===== Configuration (env only) =====
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

// Public URL of the FRONTEND — where users are sent after a successful login.
// server.js also treats FRONTEND_URL as a comma-separated CORS allow-list, so
// take the first entry here.
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
// Public URL of THIS backend — used to build the exact `redirect_uri` that
// must be whitelisted in the Google / Facebook developer consoles.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const FACEBOOK_GRAPH_VERSION = 'v19.0';
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const FACEBOOK_AUTH_URL = `https://www.facebook.com/${FACEBOOK_GRAPH_VERSION}/dialog/oauth`;
const FACEBOOK_TOKEN_URL = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/oauth/access_token`;
const FACEBOOK_ME_URL = `https://graph.facebook.com/${FACEBOOK_GRAPH_VERSION}/me`;

// OAuth flow state (CSRF token + PKCE verifier + post-login redirect target)
// lives in a short-lived httpOnly cookie so callbacks can be validated.
const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000; // 10 minutes
const OAUTH_COOKIE_PATH = '/api/auth';

// ===== Small helpers =====

/** Restrict post-login redirects to same-site paths (prevents open redirects). */
function safeRedirect(raw) {
  if (typeof raw !== 'string' || !raw) return '/';
  if (raw.startsWith('//') || raw.includes('://') || raw.includes('\\')) return '/';
  if (!raw.startsWith('/')) return '/';
  return raw;
}

function setOAuthStateCookie(res, state, codeVerifier, redirect) {
  const payload = Buffer.from(
    JSON.stringify({ state, codeVerifier, redirect })
  ).toString('base64url');
  res.cookie(OAUTH_STATE_COOKIE, payload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    // 'lax' so the cookie is sent on the top-level GET navigation that the
    // provider performs when redirecting the browser back to our callback.
    sameSite: 'lax',
    path: OAUTH_COOKIE_PATH,
    maxAge: OAUTH_STATE_MAX_AGE,
  });
}

function getOAuthState(req) {
  const raw = req.cookies?.[OAUTH_STATE_COOKIE];
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function clearOAuthStateCookie(res) {
  res.clearCookie(OAUTH_STATE_COOKIE, { path: OAUTH_COOKIE_PATH });
}

/** Redirect the browser back to the frontend with an outcome the callback page reads. */
function redirectToFrontend(res, params) {
  const qs = new URLSearchParams(params).toString();
  // NOTE: the frontend page lives in the `(auth)` route group
  // (frontend/app/(auth)/social-callback/page.js), whose actual URL is
  // /social-callback — route-group parentheses are NOT part of the URL.
  return res.redirect(`${FRONTEND_URL}/social-callback?${qs}`);
}

/**
 * Issue the exact same session as the regular email/password login:
 * a short-lived access token + a long-lived httpOnly refresh cookie.
 */
function issueSession(res, user) {
  // The access token is NOT put in the redirect URL — the frontend exchanges
  // the refresh cookie for one via /auth/refresh-token on its callback page.
  const refreshToken = generateRefreshToken({ id: user.id });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/** Fire the same auth emails as email/password auth: welcome for new users,
 *  welcome-back for returning users. Fire-and-forget — never blocks OAuth. */
function sendAuthEmails(user) {
  sendEmail({
    to: user.email,
    subject: user.isNew ? 'Welcome to Kokan Ghar!' : 'Welcome back to Kokan Ghar!',
    html: (user.isNew ? sendWelcomeEmail(user.email, user.name) : sendLoginEmail(user.name)).html,
  });
}

/**
 * Link an existing user (account linking by email). Only last_login and
 * avatar_url are updated — the password_hash is untouched, so a user who
 * signed up with email/password can still log in with that password after
 * using Google/Facebook. Throws 403 for blocked (is_active = 0) accounts.
 */
async function linkExistingUser({ cleanEmail, cleanAvatar }) {
  const [existing] = await pool.query(
    'SELECT id, name, email, role, is_active, suspend_until, avatar_url FROM users WHERE email = ?',
    [cleanEmail]
  );

  if (existing.length === 0) return null;

  const user = existing[0];
  const status = await resolveUserStatus(user);
  if (!status.ok) {
    const err = new Error(status.message);
    err.statusCode = status.statusCode;
    err.suspendUntil = status.suspendUntil || '';
    err.permanent = !!status.permanent;
    throw err;
  }
  // Keep the previous avatar if the provider didn't supply one.
  await pool.query(
    'UPDATE users SET last_login = NOW(), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
    [cleanAvatar, user.id]
  );
  return { ...user, isNew: false };
}

/**
 * Core upsert shared by Google & Facebook. Never creates duplicate rows:
 *
 *  - Email not in `users`     -> INSERT with password_hash = NULL,
 *                                role = 'customer', is_verified = 1,
 *                                is_active = 1.
 *  - Email already in `users` -> link via `linkExistingUser`.
 *  - Existing but blocked     -> throws 403 (denied).
 *  - Concurrent signup race   -> UNIQUE(email) fires ER_DUP_ENTRY; we then
 *                                link the row the other request created.
 *
 * The role ENUM in this database is ('customer','admin','seller'); there is
 * no 'user' role, so OAuth signups use 'customer' like regular signups.
 */
async function upsertSocialUser({ name, email, avatarUrl }) {
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name || '').trim().slice(0, 100) || cleanEmail.split('@')[0];
  const cleanAvatar = avatarUrl ? String(avatarUrl).slice(0, 500) : null;

  const linked = await linkExistingUser({ cleanEmail, cleanAvatar });
  if (linked) return linked;

  try {
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, avatar_url, is_verified, is_active)
       VALUES (?, ?, NULL, 'customer', ?, 1, 1)`,
      [cleanName, cleanEmail, cleanAvatar]
    );

    return {
      id: result.insertId,
      name: cleanName,
      email: cleanEmail,
      role: 'customer',
      is_active: 1,
      avatar_url: cleanAvatar,
      isNew: true,
    };
  } catch (err) {
    // A concurrent OAuth callback created this email between our SELECT and
    // INSERT. Link that row instead of failing with a generic error.
    if (err.code === 'ER_DUP_ENTRY') {
      const linkedAfterRace = await linkExistingUser({ cleanEmail, cleanAvatar });
      if (linkedAfterRace) return linkedAfterRace;
    }
    throw err;
  }
}

// ===== Google =====

/** Step 1 — send the user to Google's consent screen (PKCE + state). */
const googleLogin = asyncHandler(async (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return redirectToFrontend(res, { error: 'google_not_configured' });
  }

  const state = crypto.randomBytes(24).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');

  setOAuthStateCookie(res, state, codeVerifier, safeRedirect(req.query.redirect));

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
});

/** Step 2 — exchange the code, verify the ID token, upsert + issue session. */
const googleCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  const oauthState = getOAuthState(req);
  clearOAuthStateCookie(res);
  // Keep the post-login target even on failures so the user isn't dumped at /.
  const redirect = oauthState?.redirect || '/';

  if (error) {
    // User denied the consent screen or the flow was cancelled.
    return redirectToFrontend(res, { error: 'google_cancelled', redirect });
  }
  if (!oauthState || !state || state !== oauthState.state) {
    return redirectToFrontend(res, { error: 'invalid_state', redirect });
  }
  if (!code) {
    return redirectToFrontend(res, { error: 'missing_code', redirect });
  }

  try {
    const client = new OAuth2Client(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      `${BACKEND_URL}/api/auth/google/callback`
    );

    const { tokens } = await client.getToken({ code, codeVerifier: oauthState.codeVerifier });

    // Throws if the signature, audience, issuer or expiry are invalid.
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    // Only accept accounts where Google confirms the email.
    if (!payload || !payload.email || payload.email_verified !== true) {
      return redirectToFrontend(res, { error: 'email_unverified', redirect });
    }

    const user = await upsertSocialUser({
      name: payload.name,
      email: payload.email,
      avatarUrl: payload.picture || null,
    });

    sendAuthEmails(user);
    issueSession(res, user);
    return redirectToFrontend(res, {
      provider: 'google',
      success: '1',
      isNew: user.isNew ? '1' : '0',
      redirect,
    });
  } catch (err) {
    if (err.statusCode === 403) {
      // Pass the suspension detail through so the frontend can show exactly
      // why the account is blocked (e.g. "suspended until 14 August").
      const params = new URLSearchParams({ error: 'account_suspended', redirect });
      if (err.message) params.set('message', err.message);
      if (err.suspendUntil) params.set('suspendUntil', err.suspendUntil);
      params.set('permanent', err.permanent ? '1' : '0');
      return res.redirect(`${FRONTEND_URL}/social-callback?${params.toString()}`);
    }
    return redirectToFrontend(res, { error: 'google_failed', redirect });
  }
});

// ===== Facebook ===

/** Step 1 — send the user to Facebook's login dialog (state for CSRF). */
const facebookLogin = asyncHandler(async (req, res) => {
  if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
    return redirectToFrontend(res, { error: 'facebook_not_configured' });
  }

  const state = crypto.randomBytes(24).toString('hex');
  setOAuthStateCookie(res, state, null, safeRedirect(req.query.redirect));

  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: `${BACKEND_URL}/api/auth/facebook/callback`,
    response_type: 'code',
    scope: 'email,public_profile',
    state,
  });

  return res.redirect(`${FACEBOOK_AUTH_URL}?${params.toString()}`);
});

/** Step 2 — exchange the code for a token, fetch profile, upsert + session. */
const facebookCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;
  const oauthState = getOAuthState(req);
  clearOAuthStateCookie(res);
  // Keep the post-login target even on failures so the user isn't dumped at /.
  const redirect = oauthState?.redirect || '/';

  if (error) {
    return redirectToFrontend(res, { error: 'facebook_cancelled', redirect });
  }
  if (!oauthState || !state || state !== oauthState.state) {
    return redirectToFrontend(res, { error: 'invalid_state', redirect });
  }
  if (!code) {
    return redirectToFrontend(res, { error: 'missing_code', redirect });
  }

  try {
    // Exchange the code for an app-scoped token. The app secret is only used
    // server-side here and is never exposed to the browser.
    const tokenParams = new URLSearchParams({
      client_id: FACEBOOK_APP_ID,
      client_secret: FACEBOOK_APP_SECRET,
      redirect_uri: `${BACKEND_URL}/api/auth/facebook/callback`,
      code,
    });
    const tokenRes = await fetch(`${FACEBOOK_TOKEN_URL}?${tokenParams.toString()}`);
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return redirectToFrontend(res, { error: 'facebook_failed', redirect });
    }

    // Facebook only returns `email` for confirmed addresses — its presence is
    // the verified-email signal for this provider.
    const meParams = new URLSearchParams({
      fields: 'id,name,email,picture.type(large)',
      access_token: tokenData.access_token,
    });
    const meRes = await fetch(`${FACEBOOK_ME_URL}?${meParams.toString()}`);
    const profile = await meRes.json();

    if (!profile.id || !profile.email) {
      return redirectToFrontend(res, { error: 'email_unverified', redirect });
    }

    const user = await upsertSocialUser({
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.picture?.data?.url || null,
    });

    sendAuthEmails(user);
    issueSession(res, user);
    return redirectToFrontend(res, {
      provider: 'facebook',
      success: '1',
      isNew: user.isNew ? '1' : '0',
      redirect,
    });
  } catch (err) {
    if (err.statusCode === 403) {
      const params = new URLSearchParams({ error: 'account_suspended', redirect });
      if (err.message) params.set('message', err.message);
      if (err.suspendUntil) params.set('suspendUntil', err.suspendUntil);
      params.set('permanent', err.permanent ? '1' : '0');
      return res.redirect(`${FRONTEND_URL}/social-callback?${params.toString()}`);
    }
    return redirectToFrontend(res, { error: 'facebook_failed', redirect });
  }
});

module.exports = {
  googleLogin,
  googleCallback,
  facebookLogin,
  facebookCallback,
  upsertSocialUser, // exported for future provider additions / tests
};
