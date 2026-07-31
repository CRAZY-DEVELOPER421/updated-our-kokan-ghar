'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import heroSlides from '@/lib/heroSlides';

// Desktop-only visual styling per slide (gradients + accent colors)
const slideStyles = [
  { bg: 'from-konkan-green-dark/80 to-konkan-green-primary/60', accent: '#E87722' },
  { bg: 'from-konkan-ocean/80 to-blue-900/60', accent: '#F4A261' },
  { bg: 'from-konkan-earth/80 to-amber-900/60', accent: '#F4A261' },
  { bg: 'from-amber-900/70 to-konkan-earth/60', accent: '#E87722' },
  { bg: 'from-green-800/70 to-konkan-green-dark/60', accent: '#16A34A' },
];

export default function HeroSlider() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="skeleton h-[250px] lg:h-[500px] w-full rounded-2xl" />;
  }

  return (
    <section className="relative">
      {/* Hide Swiper nav arrows on mobile (max-width: 768px) */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .swiper-button-next,
          .swiper-button-prev {
            display: none !important;
          }
        }
      `}</style>
      <Swiper
        modules={[Autoplay, EffectFade, Pagination, Navigation]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="rounded-2xl overflow-hidden"
      >
        {heroSlides.map((slide, idx) => {
          const style = slideStyles[idx] || slideStyles[0];
          return (
          <SwiperSlide key={idx}>
            <div className={`relative h-[250px] lg:h-[500px] bg-gradient-to-r ${style.bg} flex items-center`}>
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-white blur-3xl" />
                <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-white blur-3xl" />
              </div>

              <div className="relative z-10 container-custom">
                <div className="max-w-xl">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-4"
                    style={{ backgroundColor: style.accent }}
                  >
                    {slide.badge}
                  </span>

                  <h2 className="font-display text-3xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4">
                    {slide.title}
                  </h2>

                  <p className="text-white/80 text-base lg:text-lg mb-6 max-w-lg">
                    {slide.subtitle}
                  </p>

                  <Link
                    href={slide.href}
                    className="inline-flex items-center gap-2 bg-white text-konkan-green-dark font-semibold px-6 py-3 rounded-lg hover:bg-konkan-cream transition-colors"
                  >
                    {slide.cta}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
