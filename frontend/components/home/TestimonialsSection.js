'use client';

import { useState, useEffect } from 'react';
import { Star, Quote } from 'lucide-react';
import api from '@/lib/api';

// Avatar gradient palette — cycled for real reviews (which have no preset bg)
const AVATAR_BGS = [
  'from-konkan-green-primary/10 to-konkan-cream',
  'from-konkan-ocean/10 to-blue-50',
  'from-konkan-gold/10 to-amber-50',
  'from-konkan-saffron/10 to-orange-50',
  'from-amber-100/50 to-konkan-cream',
  'from-emerald-100/50 to-teal-50',
];

const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase() || 'C';

function TestimonialCard({ t }) {
  return (
    <div
      className="w-[300px] sm:w-[360px] md:w-[400px] shrink-0 bg-white rounded-2xl shadow-card border border-konkan-sand/30 p-6 flex flex-col h-full transition-shadow duration-300 hover:shadow-card-hover"
    >
      <Quote className="w-7 h-7 text-konkan-green-primary/20 mb-3" fill="currentColor" />

      <p className="text-[15px] leading-relaxed text-konkan-text-primary mb-5 flex-1 line-clamp-4">
        &ldquo;{t.text}&rdquo;
      </p>

      <div className="flex items-center gap-3 pt-4 border-t border-konkan-sand/30">
        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.bg} flex items-center justify-center font-display font-bold text-konkan-green-primary text-base shrink-0`}>
          {t.avatar}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-display font-bold text-konkan-text-primary text-sm leading-tight truncate">{t.name}</h4>
          <p className="text-xs text-konkan-text-secondary truncate">{t.location}</p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${i < t.rating ? 'text-konkan-gold fill-konkan-gold' : 'text-konkan-sand fill-konkan-sand'}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-konkan-green-primary shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 14.22l-3-3a.75.75 0 111.06-1.06l2.47 2.47 5.66-5.66a.75.75 0 111.06 1.06l-6.25 6.19z" clipRule="evenodd" />
        </svg>
        <span className="text-[11px] font-medium text-konkan-green-primary">
          Verified Purchase · {t.product}
        </span>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [paused, setPaused] = useState(false);
  const [reviews, setReviews] = useState(null);

  // Real customer reviews from the backend (admin picks them via "Add to
  // Home" in the admin Reviews page). Falls back to the curated list below.
  useEffect(() => {
    let mounted = true;
    api
      .get('/reviews/home?limit=8')
      .then((res) => {
        if (mounted && res.data?.data?.reviews?.length) {
          setReviews(res.data.data.reviews.map((r, idx) => ({
            name: r.user_name || 'Customer',
            location: '',
            rating: Number(r.rating) || 5,
            text: r.body || r.title || '',
            product: r.product_name,
            avatar: initials(r.user_name),
            bg: AVATAR_BGS[idx % AVATAR_BGS.length],
          })));
        }
      })
      .catch(() => { /* keep fallback */ });
    return () => { mounted = false; };
  }, []);

  // No featured reviews yet → hide the whole section instead of showing fakes.
  if (!reviews || reviews.length === 0) return null;

  // Duplicate once → seamless infinite loop (translateX -50% of the doubled track)
  const marqueeItems = [...reviews, ...reviews];

  return (
    <section className="overflow-hidden">
      {/* ── Section Header ── */}
      <div className="text-center mb-10">
        <h2 className="section-title">What Our Customers Say</h2>
        <p className="section-subtitle">Real stories from people who love Kokan Ghar</p>
      </div>

      {/* ── Infinite Marquee — right-to-left, pauses on hover ── */}
      <div
        className="relative group"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Edge fade masks */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 md:w-28 z-10 bg-gradient-to-r from-konkan-cream to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 md:w-28 z-10 bg-gradient-to-l from-konkan-cream to-transparent" />

        <div className="overflow-hidden">
          <div
            className="flex w-max marquee-track"
            style={{
              animationPlayState: paused ? 'paused' : 'running',
            }}
          >
            {marqueeItems.map((t, idx) => (
              // Per-item trailing padding (not flex gap) keeps the -50% loop seamless
              <div key={idx} className="h-auto pr-5 md:pr-6">
                <TestimonialCard t={t} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track {
          animation: marquee-scroll 32s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
            overflow-x: auto;
          }
        }
      `}</style>
    </section>
  );
}
