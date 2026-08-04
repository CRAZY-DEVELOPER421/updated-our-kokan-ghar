'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import useAuthStore from '@/lib/store/authStore';
import useCartStore from '@/lib/store/cartStore';
import useWishlistStore from '@/lib/store/wishlistStore';

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
 */
export default function SocialCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const error = searchParams.get('error');
    const redirect = safeRedirect(searchParams.get('redirect') || '/');
    const isNew = searchParams.get('isNew') === '1';

    if (error) {
      toast.error(ERROR_MESSAGES[error] || 'Sign-in failed. Please try again.');
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

        toast.success(isNew ? 'Welcome to Kokan Ghar!' : 'Welcome back to Kokan Ghar!');
        router.replace(redirect);
      } catch {
        toast.error('Sign-in could not be completed. Please try again.');
        router.replace('/login');
      }
    })();
  }, [router, searchParams]);

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
    </div>
  );
}
