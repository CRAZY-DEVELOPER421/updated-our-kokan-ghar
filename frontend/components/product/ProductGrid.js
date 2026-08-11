'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import ProductCarouselCard, { ProductCarouselCardSkeleton } from './ProductCarouselCard';

function useMediaQuery(query) {
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// Product listing / category / search grid.
// Desktop (≥768px): shared ProductCarouselCard design (same as homepage sections).
// Mobile (<768px): original Amazon-style list rows (ProductCard view="list").
export default function ProductGrid({ products = [], loading = false, skeletonCount = 8 }) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  // SSR-safe: don't decide the layout until we know the viewport
  const resolved = isMobile !== null;

  if (loading) {
    if (!resolved) return <div className="min-h-[40vh]" />;
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton h-4 w-32 rounded" />
        </div>
        {isMobile ? (
          <div className="divide-y divide-gray-100 bg-white" style={{ margin: '0 -16px' }}>
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="skeleton w-[110px] h-[110px] rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                  <div className="skeleton h-5 w-1/2 rounded" />
                  <div className="skeleton h-8 w-full rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <ProductCarouselCardSkeleton />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── SSR guard: wait for viewport to be known ─────────
  if (!resolved) {
    return <div className="min-h-[40vh]" />;
  }

  // ─── Empty state ──────────────────────────────────────
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mb-4 flex justify-center">
          <svg className="w-12 h-12 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="font-display text-xl font-bold text-konkan-text-primary mb-2">No products found</h3>
        <p className="text-konkan-text-secondary">Try adjusting your filters or search terms.</p>
      </div>
    );
  }

  // ─── Desktop (≥768px): 4-col grid of the shared card ──
  if (!isMobile) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-konkan-text-secondary">
            Showing <strong className="text-konkan-text-primary">{products.length}</strong> products
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {products.map((product, idx) => (
            <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${idx * 30}ms` }}>
              <ProductCarouselCard product={product} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Mobile (<768px): Amazon-style list with dividers ──
  return (
    <div>
      <div className="mb-3">
        <span className="text-xs text-konkan-text-secondary">
          <strong className="text-konkan-text-primary">{products.length}</strong> products
        </span>
      </div>

      <div className="bg-white divide-y divide-gray-100" style={{ margin: '0 -16px' }}>
        {products.map((product, idx) => (
          <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${idx * 30}ms` }}>
            <ProductCard product={product} view="list" />
          </div>
        ))}
      </div>
    </div>
  );
}
