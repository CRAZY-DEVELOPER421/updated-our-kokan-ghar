'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import useAuthStore from '@/lib/store/authStore';
import useCartStore from '@/lib/store/cartStore';
import useWishlistStore from '@/lib/store/wishlistStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';

// Human-readable messages for the error codes the backend can send back.
const ERROR_MESSAGES = {
  google_not_configured: 'Google login is not configured yet. Please use email/password.',
  facebook_not_configured: 'Facebook login is not configured yet. Please use email/password.',
  google_cancelled: 'Google sign-in was cancelled.',
  facebook_cancelled: 'Facebook sign-in was cancelled.',
  invalid_state: 'This sign-in link has expired. Please try again.',
  missing_code: 'Sign-in could not be completed. Please try again.',
  email_unverified: 'Your email is not verified on this provider.',
  account_deactivated: 'Your account has been deactivated. Please contact support.',
  account_suspended: 'Your account has been suspended. Please contact support.',
  google_failed: 'Google sign-in failed. Please try again.',
  facebook_failed: 'Facebook sign-in failed. Please try again.',
};

// Mirrors the backend's validation — the value is already backend-sanitized,
// this is defense-in-depth against open redirects.
const safeRedirect = (raw) =>
  typeof raw === 'string' &&
  raw.startsWith('/') &&
  !raw.startsWith('//') &&
  !raw.includes('://') &&
  !raw.includes('\\')
    ? raw
    : '/';

/**
 * Landing page for OAuth logins.
 *
 * The backend has already:
 *   - upserted the user in the `users` table,
 *   - set the httpOnly `refreshToken` cookie (same as a password login),
 *   - redirected here with ?provider=&success=&isNew=&redirect=.
 *
 * This page exchanges the refresh cookie for an access token, loads the
 * profile into the auth store, then sends the user where they were headed.
 * NEW OAuth signups (isNew=1) are first invited to set a password so they
 * can later sign in with email & password too — optional, skippable.
 */
export default function SocialCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);
  const redirectRef = useRef('/');
  const isNewRef = useRef(false);

  // "Set your password" popup for NEW OAuth signups (password_hash is NULL).
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const error = searchParams.get('error');
    const redirect = safeRedirect(searchParams.get('redirect') || '/');
    redirectRef.current = redirect;
    const isNew = searchParams.get('isNew') === '1';
    isNewRef.current = isNew;

    if (error) {
      // Suspended accounts carry a backend-provided message with the exact
      // reason (e.g. "suspended until 14 August") — prefer it over the generic
      // fallback so the user knows exactly what happened.
      const backendMessage = searchParams.get('message');
      const msg = error === 'account_suspended' && backendMessage
        ? backendMessage
        : (ERROR_MESSAGES[error] || 'Sign-in failed. Please try again.');

      if (error === 'account_suspended') {
        // Remember the suspension so the navbar shows the "Suspended + timer"
        // chip AND the global gate popup explains it (login will block again
        // anyway — no point in forcing a roundtrip). The window event is what
        // the SuspensionGate listens for, so dispatch it like the API would.
        const suspendUntil = searchParams.get('suspendUntil');
        const suspension = {
          message: msg,
          suspendUntil: suspendUntil || null,
          permanent: searchParams.get('permanent') === '1',
        };
        useAuthStore.getState().markSuspended(suspension);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('suspension:blocked', { detail: suspension }));
        }
        router.replace('/');
        return;
      }

      toast.error(msg);
      router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    (async () => {
      try {
        // 1. Exchange the httpOnly refresh cookie for an access token.
        const refreshRes = await api.post('/auth/refresh-token');
        if (!refreshRes.data.success) throw new Error('No session to complete.');
        localStorage.setItem('accessToken', refreshRes.data.data.accessToken);

        // 2. Load the user profile into the auth store (persists across reloads).
        await useAuthStore.getState().fetchProfile();

        // 3. Refresh user-specific data (cart, wishlist).
        useCartStore.getState().fetchCart();
        useWishlistStore.getState().fetchWishlist();

        if (isNew) {
          // Brand-new OAuth account — password_hash is NULL. Invite the user
          // to set a password so email/password login ALSO works on this same
          // account later. Skippable — social login keeps working regardless.
          setShowSetPassword(true);
        } else {
          toast.success('Welcome back to Kokan Ghar!');
          router.replace(redirect);
        }
      } catch {
        toast.error('Sign-in could not be completed. Please try again.');
        router.replace('/login');
      }
    })();
  }, [router, searchParams]);

  const finishRedirect = (opts = {}) => {
    setShowSetPassword(false);
    // New OAuth signups always get the welcome toast — whether they saved a
    // password or skipped. Returning users already got theirs earlier. When
    // the caller already showed a toast (e.g. "Password set!"), skip it.
    if (isNewRef.current && opts.showWelcome !== false) {
      toast.success('Welcome to Kokan Ghar!');
    }
    router.replace(redirectRef.current || '/');
  };

  const handleSavePassword = async () => {
    setPwError('');
    if (password.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    if (password.length > 128) {
      setPwError('Password must be 128 characters or fewer.');
      return;
    }
    if (password !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }

    setPwSaving(true);
    try {
      await api.put('/users/set-password', { password });
      toast.success('Password set! You can now sign in with email & password too.');
      finishRedirect({ showWelcome: false });
    } catch (e) {
      // ONLY the "already has a password" case (e.g. the user set one in
      // another tab, or a race) is a non-failure. Any other 400 — e.g. a
      // validation error — must surface so the user knows nothing was saved.
      const alreadyHas = (e.response?.data?.message || '').toLowerCase().includes('already have a password');
      if (e.response?.status === 400 && alreadyHas) {
        toast.success('Welcome to Kokan Ghar!');
        finishRedirect();
      } else {
        setPwError(e.response?.data?.message || 'Could not set your password. Please try again.');
      }
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link href="/" className="inline-block">
          <Image
            src="/images/logo/konkan_logo.png"
            alt="Kokan Ghar Logo"
            width={740}
            height={337}
            className="h-12 w-auto mx-auto"
            priority
          />
        </Link>
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-konkan-sand border-t-konkan-green-primary animate-spin" aria-hidden="true" />
          <p className="text-konkan-text-secondary text-sm">Completing your sign-in…</p>
        </div>
      </div>

      {/* Friendly popup for brand-new OAuth signups: set a password (optional)
          so the same account also works with email & password later. */}
      <Modal isOpen={showSetPassword} onClose={finishRedirect} size="sm" title="">
        <div className="text-center pt-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-konkan-cream border border-konkan-sand flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-konkan-text-primary">
            Welcome to Kokan Ghar! 🎉
          </h3>
          <p className="text-konkan-text-secondary text-sm leading-relaxed mt-2">
            Your account was created with <span className="font-medium text-konkan-text-primary">Google/Facebook</span>.
            Set a password so you can also sign in with <span className="font-medium text-konkan-text-primary">email &amp; password</span> anytime — same account, both ways.
          </p>

          <div className="mt-5 space-y-4 text-left">
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={pwError}
            />
          </div>

          <div className="mt-6 space-y-2.5">
            <Button size="lg" className="w-full" onClick={handleSavePassword} loading={pwSaving}>
              Save Password
            </Button>
            <button
              type="button"
              onClick={finishRedirect}
              className="w-full text-sm text-konkan-text-secondary hover:text-konkan-green-primary transition-colors py-1"
            >
              Skip for now — I'll use Google/Facebook to sign in
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
