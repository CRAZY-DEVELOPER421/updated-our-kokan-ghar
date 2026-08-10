'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuthStore from '@/lib/store/authStore';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

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
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    } else {
      toast.error(result.message || 'Invalid email or password.');
    }
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
    </div>
  );
}
