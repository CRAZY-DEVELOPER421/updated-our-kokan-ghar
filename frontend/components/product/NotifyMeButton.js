'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * NotifyMeButton — displayed on out-of-stock product pages.
 * Lets logged-in users (or guests with an email) subscribe to be
 * notified when the product is restocked.
 *
 * Flow:
 *   1. Button shows "Notify Me When Available"
 *   2. Logged-in users → one-click subscribe
 *   3. Guests → email input appears, then subscribe
 *   4. On success → green confirmation "You're on the list!"
 */
export default function NotifyMeButton({ productId }) {
  const [email, setEmail] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Check if user is logged in
  const [loggedInEmail, setLoggedInEmail] = useState('');
  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Decode JWT to get email (simple base64 decode)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.email) setLoggedInEmail(payload.email);
      }
    } catch {}
  }, []);

  // Check existing subscription
  const checkEmail = loggedInEmail || email;
  const { data: checkData } = useQuery({
    queryKey: ['bis-check', productId, checkEmail],
    queryFn: async () => {
      if (!checkEmail) return { subscribed: false };
      const res = await api.get(`/products/${productId}/notify`, { params: { email: checkEmail } });
      return res.data.data;
    },
    enabled: !!checkEmail && showInput,
    staleTime: 60000,
  });

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const payload = { email: loggedInEmail || email };
      const res = await api.post(`/products/${productId}/notify`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      setMessage(data.message || "You're on the list! We'll notify you when this is back.");
    },
    onError: (err) => {
      setIsSuccess(false);
      setMessage(err.response?.data?.message || 'Something went wrong. Please try again.');
    },
  });

  // Already subscribed
  if (checkData?.subscribed) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="text-sm font-medium text-emerald-700">
          You&apos;ll be notified when this is back in stock!
        </span>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
        <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium text-emerald-700">{message}</span>
      </div>
    );
  }

  // Not subscribed — show button / email input
  return (
    <div className="space-y-3">
      {!showInput && !loggedInEmail ? (
        <button
          onClick={() => setShowInput(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm
            bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-all"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notify Me When Available
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (loggedInEmail || email.trim()) {
              subscribeMutation.mutate();
            }
          }}
          className="space-y-2"
        >
          {!loggedInEmail && (
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={subscribeMutation.isPending || (!loggedInEmail && !email.trim())}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm
              bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {subscribeMutation.isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Subscribing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notify Me When Available
              </>
            )}
          </button>
          {!loggedInEmail && (
            <button
              type="button"
              onClick={() => { setShowInput(false); setEmail(''); setMessage(''); }}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          )}
        </form>
      )}

      {/* Error message */}
      {message && !isSuccess && (
        <p className="text-xs text-red-500 text-center">{message}</p>
      )}
    </div>
  );
}
