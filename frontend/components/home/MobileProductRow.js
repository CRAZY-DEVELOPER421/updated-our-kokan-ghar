'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import MobileProductCard from '@/components/product/MobileProductCard';

export default function MobileProductRow({
  title = 'Bestsellers',
  viewAllHref = '/products?sort=bestseller',
  queryKey = ['bestsellers', 'mobile'],
  apiEndpoint = '/products/bestsellers',
}) {
  const { data: products, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get(apiEndpoint);
      return res.data.data?.products || res.data.data || [];
    },
    staleTime: 120000,
  });

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
          {title}
        </h2>
        <Link
          href={viewAllHref}
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{
            fontSize: '13px',
            color: '#2D5F4C',
          }}
        >
          View All →
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
                {/* Skeleton image */}
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
                {/* Skeleton text lines */}
                <div className="p-2.5 space-y-2">
                  <div className="h-3 w-3/4 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                  <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                  <div className="h-3 w-1/3 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                  <div
                    className="h-[34px] w-full rounded-[8px] mt-2"
                    style={{ backgroundColor: '#E8F0EC' }}
                  />
                </div>
              </div>
            </div>
          ))
        ) : (
          (products || []).slice(0, 10).map((product) => (
            <MobileProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </section>
  );
}
