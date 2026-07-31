'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import ProductGrid from '@/components/product/ProductGrid';
import Skeleton from '@/components/ui/Skeleton';

export default function SearchResultsInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'relevance';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const rating = searchParams.get('rating') || '';
  const organic = searchParams.get('organic') || '';
  const seasonal = searchParams.get('seasonal') || '';
  const bestseller = searchParams.get('bestseller') || '';
  const discount = searchParams.get('discount') || '';

  const [allProducts, setAllProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const sentinelRef = useRef(null);
  const abortRef = useRef(null);

  // Stable filter key — changes when filters change (triggers reset)
  const filterKey = useMemo(() =>
    JSON.stringify({ query, sort, category, minPrice, maxPrice, rating, organic, seasonal, bestseller, discount }),
    [query, sort, category, minPrice, maxPrice, rating, organic, seasonal, bestseller, discount]
  );

  // Reset when filters change
  useEffect(() => {
    setAllProducts([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotal(0);
    setInitialLoadDone(false);
    setLoading(true);
  }, [filterKey]);

  // Fetch a specific page
  const fetchPage = useCallback(async (pageNum, append = false) => {
    if (!query) return;

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    // Cancel previous in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const params = { page: pageNum, limit: 20, sort };
      if (query) params.q = query;
      if (category) params.category = category;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (rating) params.rating = rating;
      if (organic === 'true') params.organic = 'true';
      if (seasonal === 'true') params.seasonal = 'true';
      if (bestseller === 'true') params.bestseller = 'true';
      if (discount) params.discount = discount;

      const qs = new URLSearchParams(params).toString();
      const res = await api.get(`/search?${qs}`, { signal: controller.signal });
      const data = res.data.data;
      const newProducts = data?.products || [];
      const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

      if (append) {
        setAllProducts(prev => [...prev, ...newProducts]);
      } else {
        setAllProducts(newProducts);
      }
      setTotal(pagination.total);
      setTotalPages(pagination.pages);
      setCurrentPage(pageNum);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
        if (!append) setAllProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setInitialLoadDone(true);
    }
  }, [query, sort, category, minPrice, maxPrice, rating, organic, seasonal, bestseller, discount]);

  // Initial fetch when query/filters change
  useEffect(() => {
    if (query) {
      fetchPage(1, false);
    }
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchPage, query]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!query || !initialLoadDone) return;
    if (currentPage >= totalPages) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loadingMore && currentPage < totalPages) {
          fetchPage(currentPage + 1, true);
        }
      },
      { rootMargin: '300px' } // trigger 300px before the sentinel comes into view
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [query, initialLoadDone, currentPage, totalPages, loadingMore, fetchPage]);

  if (!query) return null;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-32" />
          <Skeleton variant="button" className="w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton variant="image" />
              <Skeleton variant="title" />
              <Skeleton variant="price" />
              <Skeleton variant="button" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Result Count */}
      {total > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-konkan-text-secondary">
            Showing <strong className="text-konkan-text-primary">{allProducts.length}</strong> of{' '}
            <strong className="text-konkan-text-primary">{total}</strong> results for{' '}
            <strong className="text-konkan-green-primary">&ldquo;{query}&rdquo;</strong>
          </p>
        </div>
      )}

      {/* Products */}
      {allProducts.length > 0 ? (
        <>
          <ProductGrid products={allProducts} skeletonCount={8} />

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-4" />

          {/* Loading More — Skeleton Cards */}
          {loadingMore && (
            <div className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl card p-3 space-y-3 animate-fade-up"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="skeleton aspect-square w-full rounded-lg" />
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                    <div className="flex items-center gap-2">
                      <div className="skeleton h-5 w-16 rounded" />
                      <div className="skeleton h-4 w-12 rounded" />
                    </div>
                    <div className="skeleton h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
              {/* Subtle loading indicator below cards */}
              <div className="flex items-center justify-center py-4 gap-2">
                <div className="w-4 h-4 border-2 border-konkan-green-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-konkan-text-secondary">Loading more...</span>
              </div>
            </div>
          )}

          {/* All Loaded */}
          {!loadingMore && currentPage >= totalPages && total > 0 && (
            <div className="text-center py-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-konkan-sand/50" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-konkan-cream px-4 text-xs text-konkan-text-secondary">
                    You&apos;ve viewed all {total} results
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl card">
          <div className="mb-4 flex justify-center">
            <svg className="w-12 h-12 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold text-konkan-text-primary mb-2">
            No results found
          </h3>
          <p className="text-konkan-text-secondary mb-2">
            We couldn&apos;t find any products matching &ldquo;{query}&rdquo;
          </p>
          <p className="text-sm text-konkan-text-secondary mb-6">
            Try adjusting your search terms or filters
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-sm text-konkan-text-secondary">
            {['Alphonso', 'Cashew', 'Spice', 'Mango', 'Coconut', 'Rice', 'Seafood', 'Honey'].map((term) => (
              <a
                key={term}
                href={`/search?q=${term.toLowerCase()}`}
                className="px-3 py-1.5 bg-konkan-cream rounded-full hover:bg-konkan-green-primary hover:text-white transition-colors"
              >
                {term}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
