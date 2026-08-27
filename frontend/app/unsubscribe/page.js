'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  // Auto-submit if token is present (clicked from email link)
  useEffect(() => {
    if (token) {
      setStatus('loading');
      api.post('/subscribers/unsubscribe', { token })
        .then(() => {
          setStatus('success');
          setMessage('You have been unsubscribed successfully. We\'ll miss you!');
        })
        .catch(() => {
          setStatus('error');
          setMessage('Invalid or expired link. Try entering your email below.');
        });
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    try {
      await api.post('/subscribers/unsubscribe', { email });
      setStatus('success');
      setMessage('You have been unsubscribed successfully. We\'ll miss you!');
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
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

        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {status === 'success' ? (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Unsubscribed</h1>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <Link href="/" className="inline-block bg-konkan-green-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-konkan-green-dark transition-colors">
                Back to Home
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Unsubscribe from Newsletter</h1>
              <p className="text-gray-500 text-sm mb-6">
                Sorry to see you go! Enter your email to confirm unsubscription.
              </p>

              {status === 'error' && message && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{message}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/30 focus:border-konkan-green-primary"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {status === 'loading' ? 'Unsubscribing...' : 'Unsubscribe'}
                </button>
              </form>

              <p className="mt-4 text-xs text-gray-400">
                Changed your mind? <Link href="/" className="text-konkan-green-primary hover:underline">Go back home</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
