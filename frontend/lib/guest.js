'use client';

// A stable per-device id that lets visitors build a cart WITHOUT an account.
// Sent as the X-Guest-Id header; after login/signup the backend merges the
// guest cart into the user's cart and the id is cleared.
const GUEST_ID_KEY = 'konkan-guest-id';

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getGuestId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = generateId();
    try {
      localStorage.setItem(GUEST_ID_KEY, id);
    } catch {
      // storage unavailable (private mode) — fall back to in-memory only
    }
  }
  return id;
}

export function clearGuestId() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(GUEST_ID_KEY);
  } catch {
    // ignore
  }
}
