'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Pagination, Navigation, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import heroSlides from '@/lib/heroSlides';

// Heading size scale (matches the admin builder preview)
const headingSizes = { h1: 'text-4xl', h2: 'text-3xl', h3: 'text-2xl', h4: 'text-xl', h5: 'text-lg', h6: 'text-base' };

// Fallback: convert the static heroSlides config into the same block structure
// the admin panel produces, so the hero always renders even if the API is down.
const staticSlides = heroSlides.map((s) => ({
  media_type: 'image',
  image_url: s.image,
  video_url: null,
  blocks: [
    { type: 'badge', text: s.badge },
    { type: 'h2', text: s.title },
    { type: 'p', text: s.subtitle },
    { type: 'button', text: s.cta, link: s.href, variant: 'primary' },
  ],
}));

// Backend uploads (e.g. /uploads/x.png) live on the API origin — resolve them
// there, while frontend static paths (/images/...) stay as-is.
const resolveMedia = (url) => {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/uploads/')) return getImageUrl(url);
  return url;
};

// Group consecutive button blocks into a single horizontal row so all buttons
// sit on the SAME line with a gap between them — never stacked, never wrapped.
function groupBlocks(blocks = []) {
  return blocks.reduce((acc, block) => {
    if (block.type === 'button') {
      const last = acc[acc.length - 1];
      if (last && last.type === 'buttons') last.buttons.push(block);
      else acc.push({ type: 'buttons', buttons: [block] });
    } else {
      acc.push({ type: 'single', block });
    }
    return acc;
  }, []);
}

function HeroBlock({ block }) {
  if (!block.text) return null;

  if (block.type === 'badge') {
    return (
      <span className="inline-block px-3.5 py-1 rounded-full bg-konkan-saffron text-white text-xs font-semibold uppercase tracking-wide mb-5">
        {block.text}
      </span>
    );
  }

  if (/^h[1-6]$/.test(block.type)) {
    const Tag = block.type;
    return (
      <Tag className={`font-display font-bold text-white leading-[1.15] ${headingSizes[block.type] || 'text-3xl'} mb-4`}>
        {block.text}
      </Tag>
    );
  }

  if (block.type === 'p') {
    return (
      <p className="text-white/85 text-base lg:text-lg leading-relaxed max-w-[85%] mb-7">
        {block.text}
      </p>
    );
  }

  if (block.type === 'button') {
    const isGhost = block.variant === 'ghost';
    const href = block.link || '/';
    return (
      <Link
        href={href}
        className={`inline-flex items-center gap-2 whitespace-nowrap font-semibold px-4 py-2.5 text-xs sm:px-6 sm:py-3 sm:text-sm rounded-lg transition-colors ${
          isGhost
            ? 'border border-white/70 text-white hover:bg-white/10'
            : 'bg-konkan-green-primary text-white hover:bg-konkan-green-dark'
        }`}
      >
        {block.text}
        {!isGhost && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        )}
      </Link>
    );
  }

  return null;
}

// Every time a slide becomes active, replay its video from the START and pause
// the hidden ones — combined with the video's own loop, hero videos keep
// replaying forever and never restart mid-way through when a slide returns.
const handleSlideChange = (swiper) => {
  swiper.slides.forEach((slideEl) => {
    const video = slideEl.querySelector('video');
    if (!video) return;
    if (slideEl.classList.contains('swiper-slide-active')) {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
};

export default function HeroSlider() {
  const [slides, setSlides] = useState(staticSlides);
  // Current slide for the "01 / 05" counter — realIndex stays correct even in
  // loop mode (where swiper.activeIndex counts duplicated slides).
  const [activeIndex, setActiveIndex] = useState(0);

  const onSlideChange = (swiper) => {
    handleSlideChange(swiper);
    setActiveIndex(swiper.realIndex ?? swiper.activeIndex);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/hero-slides');
        const remote = res.data?.data?.slides || [];
        // Respect the admin's intent — an empty list means the hero is hidden
        // (fall back to static content only when the API is unreachable).
        if (!cancelled) setSlides(remote);
      } catch {
        // API unreachable — keep the static fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <section>
      <style jsx global>{`
        @media (max-width: 768px) {
          .swiper-button-next,
          .swiper-button-prev {
            display: none !important;
          }
        }
        /* White pagination over the background media */
        .hero-image-swiper .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.6);
          opacity: 1;
        }
        .hero-image-swiper .swiper-pagination-bullet-active {
          background: #ffffff;
        }
        /* Arrows — ghost style, no background (white arrow + soft shadow for
           readability over any hero media; hidden on mobile, see above) */
        .hero-image-swiper .swiper-button-next,
        .hero-image-swiper .swiper-button-prev {
          width: 42px;
          height: 42px;
          border-radius: 9999px;
          background-color: transparent;
          color: #ffffff;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .hero-image-swiper .swiper-button-next:hover,
        .hero-image-swiper .swiper-button-prev:hover {
          opacity: 0.8;
          transform: scale(1.08);
        }
        .hero-image-swiper .swiper-button-next::after,
        .hero-image-swiper .swiper-button-prev::after {
          font-size: 16px;
          font-weight: 700;
        }
      `}</style>

      {slides.length === 0 ? (
        <div className="hidden" />
      ) : (
      <div className="relative">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination, Navigation, Keyboard]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 5000, disableOnInteraction: true, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        navigation
        keyboard={{ enabled: true }}
        // Fade effect makes snapGrid length 1, so Swiper marks the slider
        // "locked" and the keyboard module's direction-lock silently blocks
        // arrow keys — explicitly allow both directions (loop handles the wrap).
        allowSlideNext
        allowSlidePrev
        watchOverflow={false}
        loop={slides.length > 1}
        className="hero-image-swiper rounded-[10px] overflow-hidden"
        onSlideChange={onSlideChange}
        onInit={(swiper) => onSlideChange(swiper)}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={slide.id || idx}>
            <div className="relative h-[320px] lg:h-[540px] xl:h-[580px] overflow-hidden">
              {/* Full background media — covers the ENTIRE hero */}
              {slide.media_type === 'video' && slide.video_url ? (
                <video
                  src={resolveMedia(slide.video_url)}
                  poster={resolveMedia(slide.image_url)}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  disablePictureInPicture
                  controls={false}
                  aria-hidden="true"
                  tabIndex={-1}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMedia(slide.image_url)}
                  alt={slide.blocks?.find((b) => /^h[1-6]$/.test(b.type))?.text || 'Hero'}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Readability overlay — darker on the left where the text sits */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/15" />

              {/* ── Left: text content over the background ── */}
              <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-10 lg:px-12 xl:px-16">
                <div className="max-w-xl space-y-0">
                  {groupBlocks(slide.blocks).map((group, gi) => (
                    <div key={gi} className={gi > 0 ? 'mt-3' : ''}>
                      {group.type === 'buttons' ? (
                        <div className="flex flex-nowrap items-center gap-3">
                          {group.buttons.map((block, bi) => (
                            <HeroBlock key={block.id || bi} block={block} />
                          ))}
                        </div>
                      ) : (
                        <HeroBlock block={group.block} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Slide counter badge — "01 / 05" bottom-right, progress transparency */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none rounded-full bg-black/45 backdrop-blur-sm text-white text-[11px] font-semibold tracking-wider px-2.5 py-1 tabular-nums">
          {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
        </div>
      )}
      </div>
      )}
    </section>
  );
}
