'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const PASSWORD_REQUIREMENTS = [
  { label: 'At least 6 characters', test: (p) => p.length >= 6 },
  { label: 'Contains a number', test: (p) => /\d/.test(p) },
  { label: 'Contains a letter', test: (p) => /[a-zA-Z]/.test(p) },
  { label: 'Contains a special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

// Resend-OTP cooldown (seconds) — avoids hammering the email service.
const RESEND_COOLDOWN = 30;

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1 = enter email, 2 = OTP + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [done, setDone] = useState(false);

  // Prefill email when arriving from /login?email=... -> Forgot Password link.
  useEffect(() => {
    const prefilled = new URLSearchParams(window.location.search).get('email');
    if (prefilled) setEmail(prefilled);
  }, []);

  // Resend-OTP countdown ticker. The boolean dep restarts the interval only
  // when the cooldown flips on (and cleans it up when it flips back off).
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCooldown > 0]);

  const passwordStrength = useMemo(() => {
    const passed = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length;
    if (passed === 0) return { label: 'Weak', color: '#DC2626', width: '25%' };
    if (passed <= 2) return { label: 'Fair', color: '#E87722', width: '50%' };
    if (passed === 3) return { label: 'Good', color: '#F4A261', width: '75%' };
    return { label: 'Strong', color: '#16A34A', width: '100%' };
  }, [password]);

  const sendOtp = async () => {
    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Invalid email format';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return false;

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      // The backend deliberately replies the same whether the email exists or
      // not (anti-enumeration). Show a friendly message either way.
      toast.success('If this email is registered, an OTP has been sent.');
      setStep(2);
      setResendCooldown(RESEND_COOLDOWN);
      return true;
    } catch {
      toast.error('Something went wrong. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      toast.success('A new OTP has been sent.');
      setResendCooldown(RESEND_COOLDOWN);
    } catch {
      toast.error('Could not resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const errs = {};
    if (!/^\d{6}$/.test(otp.trim())) errs.otp = 'Enter the 6-digit OTP from your email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: otp.trim(), password });
      setDone(true);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    router.push(`/login${email ? `?email=${encodeURIComponent(email.trim())}` : ''}`);
  };

  const goBackToEmail = () => {
    setStep(1);
    setErrors({});
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
          <h1 className="font-display text-2xl font-bold text-konkan-text-primary mt-4">
            {done ? 'Password Updated' : step === 1 ? 'Forgot Password?' : 'Reset Password'}
          </h1>
          <p className="text-konkan-text-secondary text-sm mt-1">
            {done
              ? 'Your password has been changed successfully.'
              : step === 1
                ? 'Enter your email and we will send you an OTP'
                : `We sent a 6-digit OTP to ${email.trim()}`}
          </p>
        </div>

        {done ? (
          /* ---- Success screen ---- */
          <div className="bg-white rounded-2xl card p-6 md:p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-konkan-cream border border-konkan-sand flex items-center justify-center mb-5">
              <svg className="w-8 h-8 text-konkan-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-konkan-text-secondary text-sm leading-relaxed">
              You can now sign in with your new password. Welcome back! 🎉
            </p>
            <Button size="lg" className="w-full mt-6" onClick={goToLogin}>
              Go to Sign In
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl card p-6 md:p-8">
            {step === 1 ? (
              /* ---- Step 1: email ---- */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendOtp();
                }}
                className="space-y-4"
              >
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                />
                <Button type="submit" size="lg" className="w-full" loading={loading}>
                  Send OTP
                </Button>
              </form>
            ) : (
              /* ---- Step 2: OTP + new password ---- */
              <div className="space-y-4">
                <div className="rounded-xl bg-konkan-cream border border-konkan-sand p-4 text-sm text-konkan-text-secondary leading-relaxed">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p>
                      Check your inbox for the OTP. It is valid for{' '}
                      <span className="font-medium text-konkan-text-primary">10 minutes</span>.
                      No email? Try the spam folder, or resend below.
                    </p>
                  </div>
                </div>

                <Input
                  label="OTP Code"
                  inputMode="numeric"
                  placeholder="6-digit code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  error={errors.otp}
                />

                <div>
                  <Input
                    label="New Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                  />
                  {password && (
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
                          <input type="checkbox" id="show-password-reset" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="rounded" />
                          Show password
                        </label>
                      </div>
                      <ul className="space-y-0.5">
                        {PASSWORD_REQUIREMENTS.map((req, idx) => {
                          const met = req.test(password);
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

                <Input
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                />

                <Button size="lg" className="w-full" onClick={resetPassword} loading={loading}>
                  Reset Password
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={resendOtp}
                    disabled={resendCooldown > 0}
                    className={`font-medium transition-colors ${resendCooldown > 0 ? 'text-konkan-text-secondary cursor-not-allowed' : 'text-konkan-green-primary hover:underline'}`}
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={goBackToEmail}
                    className="text-konkan-text-secondary hover:text-konkan-green-primary transition-colors"
                  >
                    Change email
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-sm text-konkan-text-secondary mt-6">
          Remembered your password?{' '}
          <Link href="/login" className="text-konkan-green-primary font-medium hover:underline">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
