'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import MobileProductCard from '@/components/product/MobileProductCard';

// ── Inline countdown timer (compact pill badge format) ──
function FlashCountdown() {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const target = new Date();
    target.setHours(target.getHours() + 8, target.getMinutes() + 45, 0, 0);

    const calculate = () => {
      const now = new Date().getTime();
      const diff = Math.max(0, target.getTime() - now);
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculate());
    const interval = setInterval(() => {
      const remaining = calculate();
      setTimeLeft(remaining);
      if (remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  const pad = (num) => String(num).padStart(2, '0');

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold leading-none"
      style={{
        backgroundColor: '#E53935',
        color: '#FFFFFF',
        fontSize: '11px',
        padding: '4px 8px',
        whiteSpace: 'nowrap',
        lineHeight: '14px',
      }}
    >
      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Ends in {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}
    </span>
  );
}

export default function MobileFlashSale() {
  // REAL flash sales from the DB (same source as desktop) — each row carries
  // quantity_limit + sold_count for the scarcity bar.
  const { data: flashSales, isLoading } = useQuery({
    queryKey: ['mobile-flash-sales'],
    queryFn: async () => {
      const res = await api.get('/flash-sales');
      return res.data.data?.flashSales || [];
    },
    staleTime: 60000,
  });

  // Map flash-sale rows into the MobileProductCard shape (price = sale price)
  const products = (flashSales || []).slice(0, 8).map((f) => ({
    id: f.product_id,
    slug: f.product_slug,
    name: f.product_name,
    image: f.primary_image,
    price: Number(f.sale_price),
    mrp: Number(f.original_price),
    discount_percent: Math.round(((Number(f.original_price) - Number(f.sale_price)) / Number(f.original_price)) * 100),
    average_rating: 0,
    review_count: 0,
    sold_count: Number(f.sold_count) || 0,
    quantity_limit: Number(f.quantity_limit) || 0,
  }));

  if (!isLoading && products.length === 0) return null;

  return (
    <section>
      <div
        style={{
          backgroundColor: '#FFF3E0',
          overflow: 'hidden',
        }}
      >
      {/* ── Header area ── */}
      <div
        style={{
          padding: '20px 16px 12px',
        }}
      >
        {/* Top row - center aligned for proper vertical alignment */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Title + LIVE badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="font-bold"
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '16px',
                lineHeight: '20px',
                color: '#1B3B2F',
              }}
            >
              Flash Sale
            </span>
            <span
              className="text-[10px] font-bold text-white leading-none animate-blink"
              style={{
                backgroundColor: '#E53935',
                padding: '3px 6px',
              }}
            >
              LIVE
            </span>
          </div>

          {/* Right: Countdown + View All */}
          <div className="flex items-center gap-2">
            <FlashCountdown />
            <Link
              href="/offers"
              className="text-[13px] font-semibold shrink-0"
              style={{ color: '#1B3B2F' }}
            >
              View All →
            </Link>
          </div>
        </div>

        {/* Sub-text */}
        <p
          className="mt-1 text-[12px]"
          style={{ color: '#8B6914' }}
        >
          Limited stock at unbeatable Konkan prices
        </p>
      </div>

      {/* Product cards row — horizontal scroll */}
      <div
        className="flex gap-3 overflow-x-auto"
        style={{
          padding: '0 16px 16px',
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
          (products || []).slice(0, 8).map((product) => (
            <MobileProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
    </section>
  );
}
