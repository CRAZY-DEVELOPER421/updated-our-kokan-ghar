# Google & Facebook Login — Setup Guide

This guide explains how Google Sign-In and Facebook Login work in the codebase,
how to configure the developer apps (you own these), and how to rotate keys.

> **No NextAuth.js.** This project already has a complete JWT auth system in the
> backend. Social login reuses it, so sessions, logout, role-based access and
> cart/wishlist all behave identically to email/password login.

---

## 1. Where the OAuth logic lives

| File | What it does |
| --- | --- |
| `backend/controllers/social.controller.js` | All OAuth logic: redirect start, callback, token exchange, profile verification, user upsert, session issue |
| `backend/routes/auth.routes.js` | Registers `GET /api/auth/google`, `/api/auth/google/callback`, `/api/auth/facebook`, `/api/auth/facebook/callback` |
| `backend/controllers/auth.controller.js` | Exports `generateAccessToken` / `generateRefreshToken` (reused by social login) |
| `frontend/app/(auth)/login/page.js` | Google / Facebook buttons (redirect to the backend) |
| `frontend/app/(auth)/signup/page.js` | Same buttons on the signup page |
| `frontend/app/(auth)/social-callback/page.js` | Completes the session after the provider redirects back |

### How the flow works (redirect flow with PKCE)

```
User clicks "Google"
        │  window.location → GET /api/auth/google?redirect=/checkout
        ▼
Backend generates `state` (CSRF) + PKCE `code_verifier`, stores them in a
short-lived httpOnly cookie, and 302s to accounts.google.com consent screen.
        │  User approves
        ▼
Google 302s browser → GET /api/auth/google/callback?code=…&state=…
        │
Backend: 1) validates `state` cookie (CSRF)  2) exchanges `code` for tokens
        3) verifies the ID token signature/audience (email_verified must be true)
        4) upserts the user in `users`  5) sets the normal refresh-token cookie
        6) 302s browser → /social-callback?provider=google&success=1 (the page
           lives in the `(auth)` route group, whose URL has no `/auth` prefix)
        ▼
Frontend callback page exchanges the refresh cookie for an access token,
loads the profile into the auth store, and sends the user to /checkout.
```

Facebook is identical except it uses the Graph API (`/me?fields=id,name,email`)
instead of an ID token; Facebook only returns `email` for confirmed addresses,
so its presence is the verified-email check.

---

## 2. Database changes

Run once against your **existing** database (no new tables):

```sql
ALTER TABLE users MODIFY password_hash VARCHAR(255) DEFAULT NULL;
```

Social-only accounts are inserted with `password_hash = NULL`, `role = 'customer'`,
`is_verified = 1`, `is_active = 1`. Existing accounts are **linked by email** —
only `last_login` and `avatar_url` are updated, so a user who signed up with a
password can still log in with that password after using Google.

> Note: the role ENUM in this database is `('customer','admin','seller')` —
> there is no `'user'` role, so OAuth signups use `'customer'` like normal signups.

---

## 3. Environment variables

The whole project uses **one universal env file** at the repo root. Copy
`.env.example` to `.env` (both at the project root) and set:

```
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
FACEBOOK_APP_ID=…
FACEBOOK_APP_SECRET=…
BACKEND_URL=http://localhost:5000   # public URL of the backend (production: https://api.yourdomain.com)
FRONTEND_URL=http://localhost:3000  # public URL of the frontend (first entry wins)
```

`BACKEND_URL` builds the exact `redirect_uri` sent to the providers — it must
match what you whitelist below **exactly** (scheme, host, port, path).

> **Same-site requirement (production).** The refresh cookie is `SameSite=Strict`,
> and the OAuth callback page completes the session with a cross-origin API call.
> This works only when the frontend and backend share a registrable domain
> (e.g. `www.kokanaghar.in` + `api.kokanaghar.in`). Putting the backend on an
> unrelated domain (like a default `*.up.railway.app` URL) breaks session
> completion — the same constraint already applies to the existing password
> login, so keep them on the same domain.

---

## 4. Exact redirect URIs to whitelist

These are the callback URLs your backend will receive the OAuth code at.
Whitelist them **exactly** (no trailing slash):

```
# Google (Authorized redirect URIs)
http://localhost:5000/api/auth/google/callback
https://<your-api-domain>/api/auth/google/callback

# Facebook (Valid OAuth Redirect URIs)
http://localhost:5000/api/auth/facebook/callback
https://<your-api-domain>/api/auth/facebook/callback
```

---

## 5. Google Cloud Console setup (you create this)

1. Go to https://console.cloud.google.com → create/select a project.
2. **APIs & Services → OAuth consent screen**
   - User type: **External**.
   - Fill app name, support email, developer contact.
   - Scopes: add `openid`, `email`, `profile` (or none — they're requested per-login).
   - **Test users**: add your personal Gmail(s) while the app is in "Testing" mode.
   - Publish the app when you're ready for real users.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Application type: **Web application**.
   - *Authorized JavaScript origins*: `http://localhost:3000` and your production frontend URL (needed for the callback page).
   - *Authorized redirect URIs*: paste the Google URI(s) from section 4.
   - Copy the **Client ID** and **Client secret** into the root `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
4. Restart the backend. Test with a **test user** first.

## 6. Facebook Developer Console setup (you create this)

1. Go to https://developers.facebook.com → **Create App** → type **Consumer**.
2. **App settings → Basic** — copy **App ID** and **App Secret** into the root `.env` (`FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`).
3. **Add product → Facebook Login** → **Settings**
   - *Valid OAuth Redirect URIs*: paste the Facebook URI(s) from section 4.
   - Enable *Use Strict Mode for Redirect URIs*.
4. **App Review** → your app must be **Live** for non-admin users; while in
   Development mode only admins/testers can log in.
5. The `email` permission: your app gets email for the user's *primary confirmed*
   email automatically on live apps; no review needed for `public_profile` + `email`.

---

## 7. Rotating API keys (Google / Facebook)

1. Generate new credentials in the provider console (Google: Credentials page;
   Facebook: App settings → Basic → reset App Secret).
2. Update the four variables in the root `.env` (`GOOGLE_CLIENT_SECRET`,
   `FACEBOOK_APP_SECRET`, and optionally the IDs).
3. Restart the backend (`npm run dev` / `pm2 restart` / Railway redeploy).
4. Old keys stop working the moment the provider rotates them — no code changes
   are needed. Never commit `.env`.

## 8. How the JWT session works

- Social login issues the **same** tokens as password login:
  - **Access token** (JWT, 15 min) — stored in `localStorage`, sent as
    `Authorization: Bearer` by the axios interceptor (`frontend/lib/api.js`).
    Contains `id`, `email`, `role` → used by `backend/middleware/auth.js`
    (`verifyToken`, `isAdmin`, `isSeller`) for role-based access.
  - **Refresh token** (JWT, 7 days) — httpOnly cookie set by the backend, so it
    survives reloads and is invisible to JS.
- On a 401, the interceptor silently calls `/auth/refresh-token` and retries.
- **Logout** (`authStore.logout`) calls `/auth/logout` (clears the cookie) and
  removes the access token + resets cart/wishlist state — session fully cleared.
- **Blocked users** (`is_active = 0`): the OAuth callback refuses the login and
  redirects back to the frontend with `error=account_deactivated`.

## 9. Testing checklist

- [ ] New user via Google creates a row (`password_hash` NULL, `role` customer, `is_verified` 1)
- [ ] New user via Facebook creates a row
- [ ] Existing user via Google → no duplicate, `last_login` updated
- [ ] Existing user via Facebook → no duplicate, `last_login` updated
- [ ] Password-only user later logs in via Google → still can log in with password
- [ ] `is_active = 0` user cannot log in (clear error, no session)
- [ ] Logout clears the session; reload stays logged out
- [ ] Reload while logged in stays logged in
- [ ] Works at 375px width (buttons are a 2-col grid)
- [ ] No console errors

## 10. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `error=google_not_configured` / `facebook_not_configured` | Missing env vars — check the root `.env` (frontend and backend both read this one file) |
| Redirect URI mismatch error from provider | Compare the `redirect_uri` in the browser URL against section 4 **exactly** (scheme/port/path, no trailing slash) |
| `error=email_unverified` | The provider account has no confirmed email — use a different account |
| Login works for admin/testers only | App is in Testing/Development mode — publish (Google) / make Live (Facebook) |
| Session lost on reload | Ensure the refresh cookie is set (check DevTools → Application → Cookies for `refreshToken` on the API host) |
