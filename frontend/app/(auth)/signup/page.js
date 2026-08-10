'use client';

import { useState, useMemo, useEffect } from 'react';
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

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, register } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace('/');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  const getRedirectTarget = () => {
    const target = new URLSearchParams(window.location.search).get('redirect') || '/';
    return target.startsWith('/') && !target.startsWith('//') ? target : '/';
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_REQUIREMENTS.filter((req) => req.test(form.password)).length;
    if (passed === 0) return { label: 'Weak', color: '#DC2626', width: '25%' };
    if (passed <= 2) return { label: 'Fair', color: '#E87722', width: '50%' };
    if (passed === 3) return { label: 'Good', color: '#F4A261', width: '75%' };
    return { label: 'Strong', color: '#16A34A', width: '100%' };
  }, [form.password]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';

    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';

    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';

    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';

    if (!agreedToTerms) errs.terms = 'You must agree to the terms and conditions';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.phone || undefined);
    setLoading(false);

    if (result.success) {
      toast.success('Welcome to Kokan Ghar! Use code WELCOME15 for 15% off.');
      router.push(getRedirectTarget());
    } else {
      toast.error(result.message || 'Registration failed. Please try again.');
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
          <h1 className="font-display text-2xl font-bold text-konkan-text-primary mt-4">Create Account</h1>
          <p className="text-konkan-text-secondary text-sm mt-1">Join Kokan Ghar and get ₹100 off your first order!</p>
        </div>

        <div className="bg-white rounded-2xl card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Ramesh Gaonkar"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
            />

            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              error={errors.phone}
              maxLength={10}
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                error={errors.password}
              />

              {/* Password Strength */}
              {form.password && (
                <div className="mt-2 space-y-1.5">
                  <div className="h-1.5 bg-konkan-sand rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: passwordStrength.width, backgroundColor: passwordStrength.color }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                    <label className="flex items-center gap-1.5 text-xs text-konkan-text-secondary cursor-pointer">
                      <input type="checkbox" id="show-password-signup" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="rounded" />
                      Show password
                    </label>
                  </div>
                  <ul className="space-y-0.5">
                    {PASSWORD_REQUIREMENTS.map((req, idx) => {
                      const met = req.test(form.password);
                      return (
                        <li key={idx} className={`flex items-center gap-1.5 text-xs ${met ? 'text-konkan-success' : 'text-konkan-text-secondary'}`}>
                          <svg className="w-3 h-3 shrink-0" fill={met ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            {met ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                              <circle cx="12" cy="12" r="10" strokeWidth={2} />
                            )}
                          </svg>
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <Input
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                error={errors.confirmPassword}
              />
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                id="agree-terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-konkan-sand text-konkan-green-primary focus:ring-konkan-green-primary"
              />
              <span className="text-xs text-konkan-text-secondary">
                I agree to the{' '}
                <Link href="/terms" className="text-konkan-green-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-konkan-green-primary hover:underline">Privacy Policy</Link>
              </span>
            </label>
            {errors.terms && <p className="text-xs text-konkan-error">{errors.terms}</p>}

            <Button type="submit" size="lg" className="w-full" loading={loading} disabled={!agreedToTerms}>
              Create Account
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-konkan-sand" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-konkan-text-secondary">or sign up with</span>
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
          Already have an account?{' '}
          <Link href="/login" className="text-konkan-green-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
