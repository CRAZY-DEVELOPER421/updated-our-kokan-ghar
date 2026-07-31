'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AllUnder499() {
  const { data, isLoading } = useQuery({
    queryKey: ['category-deals', 'mobile'],
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
          All Under ₹499
        </h2>
        <Link
          href="/products?max_price=499"
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{
            fontSize: '13px',
            color: '#2D5F4C',
          }}
        >
          See all →
        </Link>
      </div>

      {/* ── 2-Column Grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2" style={{ padding: '0 16px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div
                className="w-full rounded-[12px] overflow-hidden"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="h-[140px] w-full"
                  style={{
                    backgroundColor: '#E8F0EC',
                    animation: 'shimmer 2s infinite linear',
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-3/4 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                  <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2" style={{ padding: '0 16px' }}>
          {categories.map((cat) => {
            const imgSrc = cat.representative_image || cat.category_image || '/images/placeholder.svg';
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}?max_price=499`}
                className="block rounded-[12px] overflow-hidden"
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {/* Image */}
                <div className="relative h-[140px] w-full" style={{ backgroundColor: '#F5F5F5' }}>
                  <Image
                    src={imgSrc}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    style={{ objectFit: 'cover' }}
                  />
                  {/* Starting price badge */}
                  <div
                    className="absolute bottom-2 right-2 text-white font-bold flex items-center justify-center"
                    style={{
                      backgroundColor: '#F5821F',
                      minWidth: '40px',
                      height: '40px',
                      borderRadius: '999px',
                      fontSize: '10px',
                      padding: '0 8px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    ₹{parseFloat(cat.starting_price).toLocaleString('en-IN')}+
                  </div>
                </div>
                {/* Category name */}
                <div className="p-3">
                  <h3
                    className="font-semibold"
                    style={{ fontSize: '13px', color: '#1A1A1A' }}
                  >
                    {cat.name}
                  </h3>
                  <p style={{ fontSize: '11px', color: '#8A8A8A', marginTop: '2px' }}>
                    Starting ₹{parseFloat(cat.starting_price).toLocaleString('en-IN')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
