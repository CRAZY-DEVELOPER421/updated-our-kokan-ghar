'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AllUnder499Desktop() {
  const { data, isLoading } = useQuery({
    queryKey: ['category-deals', 'desktop'],
    queryFn: async () => {
      const res = await api.get('/products/category-deals?max_price=499');
      return res.data.data?.categories || [];
    },
    staleTime: 120000,
  });

  const categories = data || [];

  // Hide section if no categories qualify
  if (!isLoading && categories.length === 0) {
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

      {/* ── 4-Column Grid with hover effects ── */}
      {isLoading ? (
        <div className="grid grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div
                className="w-full rounded-2xl overflow-hidden"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="h-[220px] w-full"
                  style={{
                    backgroundColor: '#E8F0EC',
                    animation: 'shimmer 2s infinite linear',
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-3/4 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                  <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-5">
          {categories.map((cat) => {
            const imgSrc = cat.representative_image || cat.category_image || '/images/placeholder.svg';
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}?max_price=499`}
                className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {/* Image */}
                <div className="relative h-[220px] w-full overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
                  <Image
                    src={imgSrc}
                    alt={cat.name}
                    fill
                    sizes="25vw"
                    style={{ objectFit: 'cover' }}
                    className="transition-transform duration-500 group-hover:scale-110"
                  />
                  {/* Starting price badge */}
                  <div
                    className="absolute bottom-3 right-3 text-white font-bold flex items-center justify-center"
                    style={{
                      backgroundColor: '#F5821F',
                      minWidth: '48px',
                      height: '48px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      padding: '0 10px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                    }}
                  >
                    ₹{parseFloat(cat.starting_price).toLocaleString('en-IN')}+
                  </div>
                </div>
                {/* Category name */}
                <div className="p-4">
                  <h3
                    className="font-bold group-hover:text-konkan-green-primary transition-colors"
                    style={{ fontSize: '15px', color: '#1A1A1A' }}
                  >
                    {cat.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#8A8A8A', marginTop: '4px' }}>
                    Starting ₹{parseFloat(cat.starting_price).toLocaleString('en-IN')} · {cat.product_count} items
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Centered View All Button ── */}
      {!isLoading && categories.length > 0 && (
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
