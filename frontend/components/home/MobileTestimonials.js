'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

function StarIcons({ count }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className="w-3 h-3"
          fill={i < count ? '#FFB800' : 'none'}
          stroke={i < count ? '#FFB800' : '#E5E5E5'}
          viewBox="0 0 20 20"
          strokeWidth={1}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function MobileTestimonials() {
  // Real customer reviews from the backend (admin picks them via "Add to
  // Home"). Falls back to the curated list below when none are featured yet
  // or the API is unreachable, so this section is never empty.
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get('/reviews/home?limit=8')
      .then((res) => {
        if (mounted && res.data?.data?.reviews?.length) {
          setReviews(res.data.data.reviews.map((r) => ({
            name: r.user_name || 'Customer',
            verified: 'Verified Buyer',
            rating: Number(r.rating) || 5,
            text: r.body || r.title || '',
            product: r.product_name,
          })));
        }
      })
      .catch(() => { /* keep fallback */ });
    return () => { mounted = false; };
  }, []);

  // No featured reviews yet → hide the whole section instead of showing fakes.
  if (!reviews || reviews.length === 0) return null;

  const testimonials = reviews;

  return (
    <section>
      {/* Section Header */}
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
          What Our Customers Say
        </h2>
        <Link
          href="/testimonials"
          className="font-semibold hover:opacity-80 transition-opacity"
          style={{
            fontSize: '13px',
            color: '#2D5F4C',
          }}
        >
          View All &rarr;
        </Link>
      </div>

      {/* Horizontal Scroll Cards */}
      <div
        className="flex gap-3 overflow-x-auto"
        style={{
          paddingLeft: '16px',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="shrink-0"
            style={{
              width: 'calc(50vw - 20px)',
              maxWidth: '200px',
            }}
          >
            <div
              className="flex flex-col"
              style={{
                backgroundColor: '#FAFAF8',
                borderRadius: '12px',
                padding: '14px',
                border: '1px solid #E5E5E5',
              }}
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                  style={{
                    backgroundColor: '#3A7D5C',
                    fontSize: '13px',
                  }}
                >
                  {t.name.split(' ').map(function(n) { return n[0]; }).join('')}
                </div>
                <div className="min-w-0">
                  <p
                    className="font-semibold truncate"
                    style={{ fontSize: '13px', color: '#1A1A1A' }}
                  >
                    {t.name}
                  </p>
                  <p style={{ fontSize: '11px', color: '#8A8A8A' }}>
                    {t.verified}
                  </p>
                </div>
              </div>

              {/* Stars */}
              <div className="mt-2">
                <StarIcons count={t.rating} />
              </div>

              {/* Quote */}
              <p
                className="mt-2 leading-snug line-clamp-3"
                style={{
                  fontSize: '12px',
                  color: '#4A4A4A',
                  fontStyle: 'italic',
                }}
              >
                &ldquo;{t.text}&rdquo;
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
