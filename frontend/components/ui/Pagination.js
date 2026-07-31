'use client';

import Link from 'next/link';

export default function Pagination({ currentPage, totalPages, baseUrl, params = {} }) {
  if (totalPages <= 1) return null;

  const buildUrl = (page) => {
    const query = new URLSearchParams({ ...params, page: String(page) });
    return `${baseUrl}?${query.toString()}`;
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        start = 2;
        end = Math.min(4, totalPages - 1);
      } else if (currentPage >= totalPages - 1) {
        start = Math.max(totalPages - 3, 2);
        end = totalPages - 1;
      }

      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={buildUrl(currentPage - 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-konkan-text-secondary hover:text-konkan-green-primary hover:bg-konkan-cream transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-konkan-sand cursor-not-allowed">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      {/* Page X of Y text (mobile) */}
      <span className="sm:hidden text-xs text-konkan-text-secondary font-medium px-2">
        Page {currentPage} of {totalPages}
      </span>

      {/* Page numbers (hidden on mobile) */}
      <div className="hidden sm:flex items-center gap-1">
        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-konkan-text-secondary">...</span>
          ) : (
            <Link
              key={page}
              href={buildUrl(page)}
              className={`min-w-[36px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-konkan-green-primary text-white'
                  : 'text-konkan-text-secondary hover:text-konkan-green-primary hover:bg-konkan-cream'
              }`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </Link>
          )
        )}
      </div>

      {/* Page X of Y text (desktop) */}
      <span className="hidden sm:inline text-xs text-konkan-text-secondary font-medium px-1">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={buildUrl(currentPage + 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-konkan-text-secondary hover:text-konkan-green-primary hover:bg-konkan-cream transition-colors"
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-konkan-sand cursor-not-allowed">
          <span className="hidden sm:inline">Next</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </nav>
  );
}
