'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ProductCarouselCard, { ProductCarouselCardSkeleton } from '@/components/product/ProductCarouselCard';

export default function AllUnder499Desktop() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['all-under-499', 'desktop'],
    queryFn: async () => {
      const res = await api.get('/products?max_price=499&limit=20&sort=discount');
      return res.data.data?.products || [];
    },
    staleTime: 120000,
  });

  // Hide section if no products qualify
  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="section-title">All Under ₹499</h2>
          <p className="section-subtitle">Budget-friendly Konkan treasures — all under ₹499</p>
        </div>
      </div>

      {/* ── 5 cards per row — same height/width as Flash Sale cards ── */}
      <div className="grid grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <ProductCarouselCardSkeleton simplified />
            </div>
          ))
        ) : (
          (products || []).slice(0, 10).map((product) => (
            <ProductCarouselCard key={product.id} product={product} simplified />
          ))
        )}
      </div>

      {/* ── Centered View All Button ── */}
      {!isLoading && products && products.length > 0 && (
        <div className="text-center mt-8">
          <Link
            href="/products?max_price=499"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
            style={{
              backgroundColor: '#1B3B2F',
              color: '#FFFFFF',
            }}
          >
            See all under ₹499
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      )}
    </section>
  );
}
