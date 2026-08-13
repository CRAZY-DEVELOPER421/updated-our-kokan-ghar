'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuthStore from '@/lib/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import SuspensionTimer from '@/components/ui/SuspensionTimer';

// Runtime-resolved API base — works on localhost dev AND behind the tunnel/gateway.
function resolveApiBase() {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  }
  const port = window.location.port;
  if (port === '3000' || port === '3001') return 'http://localhost:5000/api';
  return '/api';
}
const API_URL = resolveApiBase();

// Start a provider OAuth flow. The backend handles the redirect round-trip and
// sends the browser back to /auth/social-callback which completes the session.
const startSocialAuth = (provider, redirectTo = '/') => {
  const params = new URLSearchParams({ redirect: redirectTo });
  window.location.href = `${API_URL}/auth/${provider}?${params.toString()}`;
};

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, login } = useAuthStore();

  // Where to send the user after login (preserves /login?redirect=/checkout)
  const getRedirectTarget = () => {
    const target = new URLSearchParams(window.location.search).get('redirect') || '/';
    return target.startsWith('/') && !target.startsWith('//') ? target : '/';
  };

  // Redirect if already logged in
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace(getRedirectTarget());
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const [form, setForm] = useState({ email: '', password: '' });

  // Prefill email when the user comes from the signup "already registered"
  // popup (/signup?email=... -> /login?email=...). Done in an effect so server
  // render and client hydration always match.
  useEffect(() => {
    const prefilled = new URLSearchParams(window.location.search).get('email');
    if (prefilled) setForm((prev) => ({ ...prev, email: prefilled }));
  }, []);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAccountMissing, setShowAccountMissing] = useState(false);
  const [showOAuthOnly, setShowOAuthOnly] = useState(false);
  const [suspensionInfo, setSuspensionInfo] = useState(null); // { message, suspendUntil, permanent }

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);

    if (result.success) {
      toast.success('Welcome back to Kokan Ghar!');
      router.push(getRedirectTarget());
    } else if (result.status === 404) {
      // Account doesn't exist — show a warm "please sign up" popup instead of a
      // scary red error toast. The email is carried over so signup is effortless.
      setShowAccountMissing(true);
    } else if (result.status === 403) {
      // Account is suspended — warm explanatory popup with live countdown,
      // not a red error toast. (result.suspension carries suspendUntil.)
      setSuspensionInfo(result.suspension || { message: result.message || 'Your account has been suspended.' });
    } else if (result.status === 401 && result.code === 'OAUTH_ONLY_ACCOUNT') {
      // Account was created via Google/Facebook and has no password yet —
      // show a friendly popup (Continue with Google / Forgot Password) instead
      // of a confusing "Invalid email or password" red toast.
      setShowOAuthOnly(true);
    } else {
      toast.error(result.message || 'Invalid email or password.');
    }
  };

  const contactSupport = () => {
    setSuspensionInfo(null);
    router.push('/contact');
  };

  const goToSignup = () => {
    setShowAccountMissing(false);
    // Keep the original post-login target (?redirect=/checkout) alive through
    // the popup -> signup hop, and carry the email over so it's pre-filled.
    const params = new URLSearchParams();
    if (form.email.trim()) params.set('email', form.email.trim());
    const redirect = getRedirectTarget();
    if (redirect !== '/') params.set('redirect', redirect);
    const qs = params.toString();
    router.push(`/signup${qs ? `?${qs}` : ''}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <Image
              src="/images/logo/konkan_logo.png"
              alt="Kokan Ghar Logo"
              width={740}
              height={337}
              className="h-12 w-auto"
              priority
            />
          </Link>
          <h1 className="font-display text-2xl font-bold text-konkan-text-primary mt-4">Welcome Back</h1>
          <p className="text-konkan-text-secondary text-sm mt-1">Sign in to continue shopping</p>
        </div>

        <div className="bg-white rounded-2xl card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={errors.password}
              />
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center gap-1.5 text-xs text-konkan-text-secondary cursor-pointer">
                  <input type="checkbox" id="show-password-login" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="rounded" />
                  Show password
                </label>
                <Link
                  href={`/forgot-password${form.email.trim() ? `?email=${encodeURIComponent(form.email.trim())}` : ''}`}
                  className="text-xs text-konkan-green-primary font-medium hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-konkan-sand" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-konkan-text-secondary">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => startSocialAuth('google', getRedirectTarget())}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-konkan-sand rounded-lg text-sm text-konkan-text-primary hover:bg-konkan-cream transition-colors min-w-0"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => startSocialAuth('facebook', getRedirectTarget())}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-konkan-sand rounded-lg text-sm text-konkan-text-primary hover:bg-konkan-cream transition-colors min-w-0"
            >
              <svg className="w-4 h-4 shrink-0 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-konkan-text-secondary mt-6">
          Don't have an account?{' '}
          <Link href="/signup" className="text-konkan-green-primary font-medium hover:underline">
            Create Account
          </Link>
        </p>
      </div>

      {/* Friendly popup when the account is suspended — not an error toast */}
      <Modal isOpen={!!suspensionInfo} onClose={() => setSuspensionInfo(null)} size="sm" title="">
        <div className="text-center pt-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-konkan-cream border border-konkan-sand flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-konkan-text-primary">
            Account Suspended ⏸️
          </h3>
          <p className="text-konkan-text-secondary text-sm leading-relaxed mt-2">
            {suspensionInfo?.message}
          </p>
          {suspensionInfo?.suspendUntil ? (
            <div className="mt-4 p-3 rounded-xl bg-konkan-cream border border-konkan-sand inline-block">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary mb-1.5">
                Account unlocks in
              </p>
              <SuspensionTimer until={suspensionInfo.suspendUntil} compact={false} />
            </div>
          ) : (
            <p className="text-konkan-text-secondary text-xs leading-relaxed mt-3">
              We're here to help — reach out and we'll sort it out as soon as possible.
            </p>
          )}
          <div className="mt-6 space-y-2.5">
            <Button size="lg" className="w-full" onClick={contactSupport}>
              Contact Support
            </Button>
            <button
              type="button"
              onClick={() => setSuspensionInfo(null)}
              className="w-full text-sm text-konkan-text-secondary hover:text-konkan-green-primary transition-colors py-1"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Friendly popup when the account was created via Google/Facebook (no
          password set yet) — not a confusing red error toast */}
      <Modal isOpen={showOAuthOnly} onClose={() => setShowOAuthOnly(false)} size="sm" title="">
        <div className="text-center pt-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-konkan-cream border border-konkan-sand flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-konkan-text-primary">
            Sign in with your social account
          </h3>
          <p className="text-konkan-text-secondary text-sm leading-relaxed mt-2">
            <span className="font-medium text-konkan-text-primary">{form.email.trim()}</span> was created with
            <span className="font-medium text-konkan-text-primary"> Google/Facebook</span> — this account has no password yet.
          </p>
          <div className="mt-6 space-y-2.5">
            <Button size="lg" className="w-full" onClick={() => startSocialAuth('google', getRedirectTarget())}>
              Continue with Google
            </Button>
            <Button size="lg" variant="outline" className="w-full" onClick={() => startSocialAuth('facebook', getRedirectTarget())}>
              Continue with Facebook
            </Button>
            <button
              type="button"
              onClick={() => setShowOAuthOnly(false)}
              className="w-full text-sm text-konkan-text-secondary hover:text-konkan-green-primary transition-colors py-1"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Friendly popup when the account doesn't exist yet — not an error toast */}
      <Modal isOpen={showAccountMissing} onClose={() => setShowAccountMissing(false)} size="sm" title="">
        <div className="text-center pt-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-konkan-cream border border-konkan-sand flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-3-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-konkan-text-primary">
            Welcome! Let's get you started 🎉
          </h3>
          <p className="text-konkan-text-secondary text-sm leading-relaxed mt-2">
            We couldn't find an account with <span className="font-medium text-konkan-text-primary">{form.email.trim()}</span>.
            Please create a new account to start shopping with us.
          </p>
          <div className="mt-6 space-y-2.5">
            <Button size="lg" className="w-full" onClick={goToSignup}>
              Create Account
            </Button>
            <button
              type="button"
              onClick={() => setShowAccountMissing(false)}
              className="w-full text-sm text-konkan-text-secondary hover:text-konkan-green-primary transition-colors py-1"
            >
              Try another email
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
