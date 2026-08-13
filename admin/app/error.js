'use client';

import Link from 'next/link';

export default function AdminError({ error, reset }) {
  console.error('Admin Error:', error?.message);

  return (
    <div className="min-h-screen bg-konkan-earth flex items-center justify-center px-4">
      <div className="text-center max-w-md bg-white rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-bold text-[#1C1C1E] mb-2">
          Dashboard Error
        </h1>
        <p className="text-sm text-[#6B7280] mb-6">
          Something went wrong while loading this section. Our team has been notified.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E87722] text-white text-sm font-semibold rounded-xl hover:bg-[#D95F0E] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#E87722] border-2 border-[#E87722] text-sm font-semibold rounded-xl hover:bg-[#E87722] hover:text-white transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
