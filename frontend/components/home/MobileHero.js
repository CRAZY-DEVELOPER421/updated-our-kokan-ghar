'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import heroSlides from '@/lib/heroSlides';

/* ─── Mobile banner images (placeholders) ────────────────
 * Replace with your designed banners at:
 *   /public/images/banners/mobile-hero-{n}.jpg
 * Then update the array below with '/images/banners/mobile-hero-1.jpg' etc.
 * Images scale with aspect-[9/13.6] — recommended size: 900×1600px
 */

const BANNER_IMAGES = [
  'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600&q=80',
  'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=600&q=80',
  'https://images.unsplash.com/photo-1639509349366-2ad7dd62e46c?w=600&q=80',
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&q=80',
  'https://images.unsplash.com/photo-1595520772302-1d178dae9a8c?w=600&q=80',
];

export default function MobileHero() {
  const [imgErrors, setImgErrors] = useState({});

  const handleImgError = useCallback((idx) => {
    setImgErrors((prev) => ({ ...prev, [idx]: true }));
  }, []);

  // Real-time scale per slide based on Swiper progress
  const handleProgress = useCallback((swiper) => {
    if (!swiper.slides) return;
    swiper.slides.forEach((slideEl) => {
      const scale = 1 - Math.abs(slideEl.progress) * 0.15;
      const inner = slideEl.querySelector('.slide-inner');
      if (inner) {
        inner.style.transform = `scale(${scale})`;
      }
    });
  }, []);

  // Enable smooth scale transition on snap settle / autoplay
  const enableScaleTransition = useCallback((swiper) => {
    if (!swiper.slides) return;
    swiper.slides.forEach((slideEl) => {
      const inner = slideEl.querySelector('.slide-inner');
      if (inner) {
        inner.style.transition = 'transform 300ms ease-out';
      }
    });
  }, []);

  // Disable transition during drag — real-time follow, no lag
  const disableScaleTransition = useCallback((swiper) => {
    if (!swiper.slides) return;
    swiper.slides.forEach((slideEl) => {
      const inner = slideEl.querySelector('.slide-inner');
      if (inner) {
        inner.style.transition = 'none';
      }
    });
  }, []);

  return (
    <section className="relative w-full">
      {/* Custom pagination + hide nav buttons */}
      <style jsx global>{`
        .mobile-hero-swiper .swiper-pagination-bullet {
          width: 5px;
          height: 5px;
          background: rgba(255,255,255,0.55);
          opacity: 1;
          border-radius: 9999px;
          transition: all 300ms ease;
        }
        .mobile-hero-swiper .swiper-pagination-bullet-active {
          background: #ffffff;
          width: 16px;
          border-radius: 3px;
        }
        .mobile-hero-swiper .swiper-pagination {
          bottom: 8px !important;
        }
        .mobile-hero-swiper .swiper-button-next,
        .mobile-hero-swiper .swiper-button-prev {
          display: none !important;
        }
        .mobile-hero-swiper.swiper {
          overflow: hidden;
        }
        .slider-card {
          border-radius: 24px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
      `}</style>

      <Swiper
        modules={[Autoplay, Pagination]}
        slidesPerView={1.35}
        centeredSlides={true}
        spaceBetween={8}
        watchSlidesProgress={true}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop
        className="mobile-hero-swiper"
        onProgress={handleProgress}
        onSlideChangeTransitionStart={enableScaleTransition}
        onTouchStart={disableScaleTransition}
        onInit={(swiper) => setTimeout(() => handleProgress(swiper), 0)}
      >
        {heroSlides.map((slide, idx) => {
          const accentColor = idx % 2 === 0 ? '#E87722' : '#2D6A4F';
          return (
          <SwiperSlide key={idx}>
            <div className="slide-inner" style={{ transformOrigin: 'center center' }}>
              <Link
                href={slide.href}
                className="block relative aspect-[9/13.6] slider-card"
                aria-label={slide.title}
              >
                {/* Background Image */}
                {!imgErrors[idx] ? (
                  <img
                    src={BANNER_IMAGES[idx]}
                    alt={slide.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    onError={() => handleImgError(idx)}
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(135deg, #1B3B2F, #2D5F4C)' }}
                  />
                )}

                {/* Bottom-heavy overlay gradient */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.5) 100%)',
                  }}
                />

                {/* Text block — positioned at bottom */}
                <div className="absolute left-4 right-4" style={{ bottom: '45px' }}>
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold text-white mb-1.5"
                    style={{ backgroundColor: accentColor }}
                  >
                    {slide.badge}
                  </span>
                  <h2
                    className="text-white font-bold leading-tight max-w-[85%]"
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '18px',
                      lineHeight: 1.3,
                    }}
                  >
                    {slide.title}
                  </h2>
                  <p
                    className="text-white mt-1 tracking-wider"
                    style={{
                      fontSize: '11px',
                      opacity: 0.9,
                      letterSpacing: '1px',
                    }}
                  >
                    {slide.subtitle}
                  </p>
                  <div className="mt-2.5">
                    <span
                      className="inline-block text-white font-semibold rounded-[8px] transition-colors"
                      style={{
                        backgroundColor: '#2D6A4F',
                        padding: '8px 20px',
                        fontSize: '12px',
                      }}
                    >
                      {slide.cta}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
