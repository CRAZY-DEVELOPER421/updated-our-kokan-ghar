'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';

export default function DealsUnder999Desktop() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['deals-under-999', 'desktop'],
    queryFn: async () => {
      const res = await api.get('/products/deals?limit=8');
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
          <h2 className="section-title">Deals Under ₹999</h2>
          <p className="section-subtitle">Top discounts on Konkan favourites — grab them fast</p>
        </div>
      </div>

      {/* ── Static Grid: 4 columns x 2 rows ── */}
      <div className="grid grid-cols-4 gap-5">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <ProductCardSkeleton />
            </div>
          ))
        ) : (
          (products || []).slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>

      {/* ── Centered View All Button ── */}
      <div className="text-center mt-8">
        <Link
          href="/products?max_price=999&sort=discount"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.97]"
          style={{
            backgroundColor: '#1B3B2F',
            color: '#FFFFFF',
          }}
        >
          See all deals
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
