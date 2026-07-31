'use client';

import { useState, useEffect, useCallback } from 'react';
import ProductCard from './ProductCard';

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

export default function ProductGrid({ products = [], loading = false, skeletonCount = 8 }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [view, setView] = useState('grid');

  useEffect(() => {
    const saved = localStorage.getItem('productView');
    if (saved === 'list' || saved === 'grid') setView(saved);
  }, []);

  const handleViewChange = useCallback((v) => {
    setView(v);
    localStorage.setItem('productView', v);
  }, []);

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
              <div key={i} className="bg-white rounded-2xl card p-3 space-y-3 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="skeleton aspect-square w-full rounded-xl" />
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="flex items-center gap-2">
                  <div className="skeleton h-5 w-16 rounded" />
                  <div className="skeleton h-4 w-12 rounded" />
                </div>
                <div className="skeleton h-9 w-full rounded-xl" />
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

  // ─── Desktop (≥768px): with view toggle ───────────────
  if (!isMobile) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-konkan-text-secondary">
            Showing <strong className="text-konkan-text-primary">{products.length}</strong> products
          </span>
          <div className="flex items-center gap-1 bg-konkan-cream rounded-lg p-1">
            <button
              onClick={() => handleViewChange('grid')}
              className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm text-konkan-green-primary' : 'text-konkan-text-secondary hover:text-konkan-text-primary'}`}
              aria-label="Grid view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1 2.5A1.5 1.5 0 012.5 1h3A1.5 1.5 0 017 2.5v3A1.5 1.5 0 015.5 7h-3A1.5 1.5 0 011 5.5v-3zm8 0A1.5 1.5 0 0111.5 1h3A1.5 1.5 0 0116 2.5v3A1.5 1.5 0 0114.5 7h-3A1.5 1.5 0 019 5.5v-3zm-8 8A1.5 1.5 0 012.5 9h3A1.5 1.5 0 017 10.5v3A1.5 1.5 0 015.5 15h-3A1.5 1.5 0 011 13.5v-3zm8 0A1.5 1.5 0 0111.5 9h3a1.5 1.5 0 011.5 1.5v3a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 13.5v-3z" />
              </svg>
            </button>
            <button
              onClick={() => handleViewChange('list')}
              className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm text-konkan-green-primary' : 'text-konkan-text-secondary hover:text-konkan-text-primary'}`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5zm0-4a.5.5 0 01.5-.5h10a.5.5 0 010 1H3a.5.5 0 01-.5-.5z" />
              </svg>
            </button>
          </div>
        </div>

        <div className={view === 'grid' ? 'grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4' : 'space-y-4'}>
          {products.map((product, idx) => (
            <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${idx * 30}ms` }}>
              <ProductCard product={product} view={view} />
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
