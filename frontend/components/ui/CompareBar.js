'use client';

import Link from 'next/link';
import useCompareStore from '@/lib/store/compareStore';

export default function CompareBar() {
  const selectedIds = useCompareStore((s) => s.selectedIds);
  const removeProduct = useCompareStore((s) => s.removeProduct);
  const clearAll = useCompareStore((s) => s.clearAll);

  if (selectedIds.length === 0) return null;

  const compareUrl = `/compare?${selectedIds.map((id) => `p=${id}`).join('&')}`;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-[#0f0f1a] border-t border-gray-200 dark:border-[#2a2a40] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: selected count */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-konkan-green-primary text-white text-sm font-bold shrink-0">
            {selectedIds.length}
          </div>
          <span className="text-sm text-gray-600 truncate hidden sm:block">
            product{selectedIds.length > 1 ? 's' : ''} selected for comparison
          </span>
          <span className="text-sm text-gray-600 sm:hidden">
            {selectedIds.length} selected
          </span>
        </div>

        {/* Center: product chips (visible on larger screens) */}
        <div className="hidden md:flex items-center gap-1.5 flex-1 justify-center overflow-x-auto">
          {selectedIds.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 bg-konkan-cream text-konkan-text-primary text-xs px-2.5 py-1 rounded-full shrink-0"
            >
              #{id}
              <button
                onClick={() => removeProduct(id)}
                className="w-4 h-4 rounded-full bg-gray-200 hover:bg-red-200 hover:text-red-600 flex items-center justify-center transition-colors"
                aria-label={`Remove product ${id}`}
              >
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1"
          >
            Clear
          </button>
          <Link
            href={compareUrl}
            className={`inline-flex items-center gap-1.5 px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              selectedIds.length >= 2
                ? 'bg-konkan-green-primary text-white hover:bg-konkan-green-dark shadow-[0_4px_12px_rgba(45,106,79,0.3)]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Compare{selectedIds.length >= 2 ? ` (${selectedIds.length})` : ''}
          </Link>
        </div>
      </div>
    </div>
  );
}
