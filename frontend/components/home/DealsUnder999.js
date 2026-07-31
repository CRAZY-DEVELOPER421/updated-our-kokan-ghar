'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import MobileProductCard from '@/components/product/MobileProductCard';

export default function DealsUnder999() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['deals-under-999', 'mobile'],
    queryFn: async () => {
      const res = await api.get('/products/deals?limit=6');
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
      {/* ── Section Header ── */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '24px 16px 12px' }}
      >
        <h2
          className="font-bold"
          style={{
            fontSize: '20px',
            color: '#1A1A1A',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Deals Under ₹999
        </h2>
        <Link
          href="/products?max_price=999&sort=discount"
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{
            fontSize: '13px',
            color: '#2D5F4C',
          }}
        >
          See more →
        </Link>
      </div>

      {/* ── Horizontal Scroll Row ── */}
      <div
        className="flex gap-3 overflow-x-auto"
        style={{
          paddingLeft: '16px',
          paddingTop: '12px',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[155px] shrink-0">
              <div
                className="overflow-hidden"
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  className="h-[165px] w-full"
                  style={{
                    backgroundColor: '#E8F0EC',
                    animation: 'shimmer 2s infinite linear',
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                <div className="p-2.5 space-y-2">
                  <div className="h-3 w-3/4 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                  <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                  <div className="h-3 w-1/3 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                </div>
              </div>
            </div>
          ))
        ) : (
          (products || []).slice(0, 6).map((product) => (
            <MobileProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </section>
  );
}
