'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import SuspensionTimer from '@/components/ui/SuspensionTimer';

/**
 * Global suspension gate (mounted once in the root layout).
 *
 * Responsibilities:
 *  1. Listens for the window 'suspension:blocked' event fired by the API
 *     interceptor whenever ANY protected call returns a suspension 403
 *     (add-to-cart, wishlist, profile, refresh-token, ...). Marks the auth
 *     store and shows a friendly popup instead of random silent failures.
 *  2. Route-guard: a suspended user may only remain on the home page (and the
 *     auth/support pages). Any other route is popped + redirected to '/'.
 *  3. Shows the popup with the exact reason + a live countdown of the
 *     remaining suspension (permanent suspensions get the generic message).
 */
const ALLOWED_PATHS = ['/', '/login', '/signup', '/contact', '/social-callback'];

export default function SuspensionGate() {
  const router = useRouter();
  const pathname = usePathname();
  const { suspended, suspension, markSuspended, clearSuspended, fetchProfile } = useAuthStore();
  const [popupOpen, setPopupOpen] = useState(false);
  const lastEventAt = useRef(0);

  // 1) Global listener — any API 403 with code ACCOUNT_SUSPENDED. The store
  //    is always the single source of truth for suspension details (login,
  //    fetchProfile, social-callback and this event all call markSuspended
  //    with the full payload), so the popup reads `suspension` directly — no
  //    separate ref that could go stale across logout / re-login.
  const onSuspensionBlocked = useCallback(
    (e) => {
      const detail = e.detail || {};
      // Several API calls fail at once on load (cart + wishlist + profile);
      // debounce so the user only ever sees ONE popup.
      const now = Date.now();
      if (now - lastEventAt.current < 1500) return;
      lastEventAt.current = now;

      markSuspended(detail);
      setPopupOpen(true);
    },
    [markSuspended]
  );

  useEffect(() => {
    window.addEventListener('suspension:blocked', onSuspensionBlocked);
    return () => window.removeEventListener('suspension:blocked', onSuspensionBlocked);
  }, [onSuspensionBlocked]);

  // 2) Route-guard — suspended users only stay on allowed pages. `suspended`
  //    is ONLY ever true when a real suspension was detected (API 403 or
  //    failed login), so any attempt to leave the allowed pages gets the
  //    popup + a redirect home.
  useEffect(() => {
    if (!suspended) return;
    if (!ALLOWED_PATHS.includes(pathname)) {
      setPopupOpen(true);
      router.replace('/');
    }
  }, [suspended, pathname, router]);

  // 3) On mount, re-sync profile once if a token exists — a user suspended in
  //    another tab, or whose suspension just expired, gets the correct state.
  //    silent=true so the background check doesn't fire the popup on load
  //    (the navbar chip + timer is the persistent indicator; the popup is
  //    reserved for when the user actually tries to do something).
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('accessToken')) {
      fetchProfile(true);
    }
    // Run once on mount only.
  }, []);

  // 4) Countdown finished → the backend auto-reactivates on the next request.
  const handleExpire = useCallback(() => {
    clearSuspended();
    fetchProfile();
  }, [clearSuspended, fetchProfile]);

  const goHome = useCallback(() => {
    setPopupOpen(false);
    router.replace('/');
  }, [router]);

  const closePopup = useCallback(() => {
    setPopupOpen(false);
  }, []);

  const info = suspended ? (suspension || {}) : {};
  const message = info.message || 'Your account has been suspended. Please contact support.';
  const isPermanent = info.permanent || !info.suspendUntil;

  return (
    <Modal isOpen={popupOpen && suspended} onClose={closePopup} size="sm" title="">
      <div className="text-center pt-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-konkan-text-primary">
          Account Suspended ⏸️
        </h3>
        <p className="text-konkan-text-secondary text-sm leading-relaxed mt-2">{message}</p>

        {!isPermanent && info.suspendUntil ? (
          <div className="mt-4 p-3 rounded-xl bg-konkan-cream border border-konkan-sand inline-block">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary mb-1.5">
              Unlocks in
            </p>
            <SuspensionTimer until={info.suspendUntil} onExpire={handleExpire} compact={false} />
          </div>
        ) : (
          <p className="text-konkan-text-secondary text-xs leading-relaxed mt-3">
            We're here to help — reach out and we'll sort it out as soon as possible.
          </p>
        )}

        <div className="mt-6 space-y-2.5">
          <Button size="lg" className="w-full" onClick={goHome}>
            Go to Home
          </Button>
          <button
            type="button"
            onClick={() => {
              setPopupOpen(false);
              router.push('/contact');
            }}
            className="w-full text-sm text-konkan-text-secondary hover:text-konkan-green-primary transition-colors py-1"
          >
            Contact Support
          </button>
        </div>
      </div>
    </Modal>
  );
}
