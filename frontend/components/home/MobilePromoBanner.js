'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const PROMO_SLIDES = [
  {
    title: 'Monsoon Special Offers',
    subtitle: 'Upto 30% OFF on Sea Foods & Pickles',
    cta: 'Shop Now',
    href: '/offers',
    image: 'https://images.unsplash.com/photo-1600369672770-985fd30f4bf1?w=600&q=80',
  },
  {
    title: 'Fresh Catch Delivered',
    subtitle: 'Premium dried fish & coastal delicacies',
    cta: 'Explore Seafood',
    href: '/categories/coastal-seafood',
    image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&q=80',
  },
  {
    title: 'Coastal Combo Deals',
    subtitle: 'Sol Kadhi, Pickles & Spices at best prices',
    cta: 'View Combos',
    href: '/offers',
    image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=600&q=80',
  },
];

export default function MobilePromoBanner() {
  const [current, setCurrent] = useState(0);
  const [imgErrors, setImgErrors] = useState({});

  const goTo = useCallback((idx) => {
    setCurrent(((idx % PROMO_SLIDES.length) + PROMO_SLIDES.length) % PROMO_SLIDES.length);
  }, []);

  // Auto-play every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      goTo(current + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, [current, goTo]);

  const slide = PROMO_SLIDES[current];

  return (
    <div
      style={{
        margin: '8px 16px',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative',
        height: '140px',
      }}
    >
      {/* Background Image or Fallback Gradient */}
      {imgErrors[current] ? (
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #3D2B1F, #5C4033)' }}
        />
      ) : (
        <Image
          src={slide.image}
          alt={slide.title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
          onError={() => setImgErrors((prev) => ({ ...prev, [current]: true }))}
        />
      )}

      {/* Dark overlay gradient (left-to-right for text legibility) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)',
        }}
      />

      {/* Text block — left aligned, vertically centered */}
      <div
        className="absolute inset-y-0 flex flex-col justify-center"
        style={{ left: '20px', right: '20px' }}
      >
        <h3
          className="font-bold leading-tight"
          style={{
            fontSize: '18px',
            color: '#FFFFFF',
          }}
        >
          {slide.title}
        </h3>
        <p
          className="mt-1"
          style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          {slide.subtitle}
        </p>
        <Link
          href={slide.href}
          className="inline-flex items-center font-semibold transition-colors hover:opacity-90 active:scale-[0.98]"
          style={{
            marginTop: '10px',
            backgroundColor: '#FFFFFF',
            color: '#1B3B2F',
            padding: '8px 20px',
            borderRadius: '6px',
            fontSize: '13px',
            alignSelf: 'flex-start',
          }}
        >
          {slide.cta}
          <svg
            className="w-3.5 h-3.5 ml-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </div>

      {/* Pagination dots */}
      <div
        className="absolute flex items-center gap-1.5"
        style={{ bottom: '10px', left: '50%', transform: 'translateX(-50%)' }}
      >
        {PROMO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className="rounded-full transition-all duration-300"
            style={{
              width: idx === current ? '20px' : '6px',
              height: '6px',
              backgroundColor: idx === current ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
            }}
            aria-label={`Go to promo slide ${idx + 1}`}
            suppressHydrationWarning
          />
        ))}
      </div>
    </div>
  );
}
