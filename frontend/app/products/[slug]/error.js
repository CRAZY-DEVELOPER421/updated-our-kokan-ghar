'use client';

import Link from 'next/link';

export default function ProductError({ error, reset }) {
  console.error('Product Page Error:', error?.message);

  return (
    <div className="container-custom py-16 text-center">
      <div className="max-w-md mx-auto">
        <div className="mb-4 flex justify-center">
          <svg className="w-12 h-12 text-konkan-saffron" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-konkan-text-primary mb-2">
          Could not load this product
        </h1>
        <p className="text-konkan-text-secondary mb-6">
          We had trouble fetching this product. It might be temporarily unavailable.
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
          <Link href="/products" className="btn-secondary">
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
