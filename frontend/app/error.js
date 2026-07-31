'use client';

import Link from 'next/link';

export default function Error({ error, reset }) {
  // Log error to console in dev, could send to monitoring service in prod
  console.error('⚠️ Page Error:', error?.message);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🌊</div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary mb-3">
          Something went wrong!
        </h1>
        <p className="text-konkan-text-secondary mb-6">
          The Konkan sea breeze must have tangled our wires. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="btn-primary inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          <Link href="/" className="btn-secondary">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
