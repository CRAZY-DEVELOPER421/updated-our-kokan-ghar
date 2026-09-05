'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getReferrer } from '@/lib/hooks/useScrollRestoration';

/**
 * Thin sticky bar at the top of PDP — "← Back to results (120 products)"
 * Shows only when the user navigated from a PLP/category/search page.
 * Uses sessionStorage to remember the referrer URL and product count.
 */
export default function BackToResults() {
  const [referrer, setReferrer] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const data = getReferrer();
    if (data) {
      setReferrer(data);
      // Small delay so the bar slides in smoothly
      requestAnimationFrame(() => setVisible(true));
    }
  }, []);

  if (!referrer) return null;

  return (
    <div
      className={`sticky top-0 z-40 transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-[#0f0f1a] border-b border-konkan-sand/40 dark:border-[#2a2a40] shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 h-10">
            <Link
              href={referrer.url}
              className="group flex items-center gap-2 text-sm text-konkan-text-secondary hover:text-konkan-green-primary transition-colors"
            >
              {/* Arrow */}
              <svg
                className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to results</span>
              {referrer.totalProducts > 0 && (
                <span className="text-konkan-text-secondary/50 text-xs">
                  ({referrer.totalProducts.toLocaleString()} products)
                </span>
              )}
            </Link>

            {/* Breadcrumb-style separator */}
            <span className="text-konkan-text-secondary/30 mx-1">|</span>

            {/* Current page indicator */}
            <span className="text-xs text-konkan-text-secondary/60 truncate max-w-[200px]">
              Product Detail
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
