'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/lib/store/authStore';
import useCartStore from '@/lib/store/cartStore';
import { getImageUrl } from '@/lib/utils';
import StarRating from '@/components/ui/StarRating';
import { CouponCard, CouponSkeleton, useCopyCoupon } from '@/components/coupon/CouponCard';

/* ─────────────────────────────────────────────────────────────
   DATA SOURCES (all DB-driven):
   1. "People used today" counter — GET /api/coupons returns `used_today`.
   2. Flash-sale countdown end-time — GET /api/flash-sales returns ends_at.
   3. Bank offers — GET /api/bank-offers.
   4. Recently-used offers — GET /api/orders (list, auth-gated).
   5. Bundle deals — GET /api/bundles (bundles + bundle_products tables).
   ───────────────────────────────────────────────────────────── */

/* ── Shared helpers ────────────────────────────────────────── */

function formatUsedOn(dateStr) {
  if (!dateStr) return null;
  try {
    return `Used on ${new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } catch {
    return null;
  }
}

function SectionHeader({ title, href, hrefLabel = 'View All' }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display text-lg font-bold text-konkan-text-primary">{title}</h2>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-konkan-green-primary hover:text-konkan-green-dark transition-colors shrink-0">
          {hrefLabel}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}

/* ── 1. Hero banner ───────────────────────────────────────── */

/* Hero background product image — a single cohesive "Konkan spread" photo (both URLs verified 200;
   same asset approach as lib/heroSlides.js which also uses fixed Unsplash images). */
const HERO_SPREAD_IMAGE = 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=500&q=80';
const HERO_SPREAD_FALLBACK = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80';

/* Consistent stat-pill icons — all 16px (w-4), strokeWidth 2, currentColor (spec: same size,
   same stroke-width, consistent color). */
function HeroTagIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function HeroStarIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function HeroCheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function HeroBanner({ coupons, products }) {
  const activeCount = coupons?.length ?? 0;

  const topSavings = useMemo(() => {
    if (coupons?.length) {
      const pct = coupons.find((c) => c.type === 'percentage');
      const flat = coupons.find((c) => c.type === 'flat');
      if (pct) return `Up to ${Math.round(Number(pct.value) || 0)}% OFF`;
      if (flat) return `Up to ₹${(Number(flat.value) || 0).toLocaleString('en-IN')} OFF`;
    }
    if (products?.length) {
      const maxDiscount = Math.max(...products.map((p) => Number(p.discount_percent) || 0));
      if (maxDiscount > 0) return `Up to ${Math.round(maxDiscount)}% OFF`;
    }
    return 'Top Savings';
  }, [coupons, products]);

  // Single cohesive background image (with onError fallback to a second verified URL)
  const [heroImg, setHeroImg] = useState(HERO_SPREAD_IMAGE);

  return (
    <section className="px-4">
      <div
        className="relative aspect-[16/9] rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FFF4E6 0%, #FFD9A0 100%)' }}
      >
        {/* Background product image — single cohesive spread, bottom-right, fades into the card edge */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 z-0 w-[42%] h-[80%]"
          style={{
            maskImage: 'linear-gradient(to left, black 55%, transparent 95%)',
            WebkitMaskImage: 'linear-gradient(to left, black 55%, transparent 95%)',
          }}
        >
          {heroImg && (
            <Image
              src={heroImg}
              alt=""
              fill
              priority
              sizes="200px"
              className="object-contain object-bottom"
              onError={() => setHeroImg((cur) => (cur !== HERO_SPREAD_FALLBACK ? HERO_SPREAD_FALLBACK : null))}
            />
          )}
        </div>

        {/* Content — left-aligned, vertically centered, z-above the image */}
        <div className="relative z-10 flex flex-col justify-center h-full p-5">
          {/* Top badge — white pill, orange text, clock icon */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 shadow-sm self-start">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: '#E87722' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: '#C2410C' }}>Limited Time Offers</span>
          </div>

          {/* Heading + subtext */}
          <h1 className="font-display text-[28px] leading-[1.15] font-bold mt-3" style={{ color: '#3D2B1F' }}>Offers &amp; Deals</h1>
          <p className="text-[13px] mt-1" style={{ color: '#8A6642' }}>Save more on authentic Konkan products</p>

          {/* Bottom stat badges — single row, no wrap, consistent 16px SVG icons */}
          <div className="mt-auto pt-3 flex items-center gap-1.5 flex-nowrap overflow-hidden">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1.5 text-[9.5px] sm:text-[10.5px] font-semibold whitespace-nowrap shadow-sm" style={{ color: '#6B4423' }}>
              <HeroTagIcon />
              {activeCount > 0 ? `${activeCount} Active Offers` : 'Active Offers'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1.5 text-[9.5px] sm:text-[10.5px] font-semibold whitespace-nowrap shadow-sm" style={{ color: '#6B4423' }}>
              <HeroStarIcon />
              {topSavings.replace(/^Up to\s+/i, '')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1.5 text-[9.5px] sm:text-[10.5px] font-semibold whitespace-nowrap shadow-sm" style={{ color: '#6B4423' }}>
              <HeroCheckIcon />
              100% Genuine
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 2. Category filter pills ─────────────────────────────── */

const FILTER_PILLS = [
  { id: 'all', label: 'All Offers' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'free_shipping', label: 'Free Delivery' },
  { id: 'bank', label: 'Bank Offers' },
  { id: 'combo', label: 'Combo Deals' },
  { id: 'festive', label: 'Festive' },
  { id: 'more', label: 'More ▾' },
];

function FilterPills({ active, onSelect }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 pt-4 pb-1">
      {FILTER_PILLS.map((pill) => {
        const isActive = active === pill.id;
        // suppressHydrationWarning: browser extensions inject fdprocessedid onto buttons before
        // hydration, which otherwise triggers a harmless attribute-mismatch warning (see React docs)
        return (
          <button
            key={pill.id}
            onClick={() => onSelect(pill.id)}
            aria-pressed={isActive}
            suppressHydrationWarning
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
              isActive
                ? 'bg-konkan-green-primary text-white shadow-sm'
                : 'bg-white border border-konkan-sand text-konkan-text-secondary hover:border-konkan-green-primary hover:text-konkan-green-primary'
            }`}
          >
            {pill.id === 'all' && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            )}
            {pill.id === 'free_shipping' && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14v8a1 1 0 01-1 1H6a1 1 0 01-1-1V8zm0 0V6a1 1 0 011-1h6l3 3" />
              </svg>
            )}
            {pill.id === 'bank' && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4 10h16M6 10V7m4 3V7m4 3V7m4 3V7M3 14h18M5 10l-1 10m15-10l1 10" />
              </svg>
            )}
            {pill.id === 'combo' && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
            {pill.id === 'festive' && (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            )}
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── 3. Active Coupons — CouponCard/CouponSkeleton now shared in @/components/coupon/CouponCard ── */

/* ── 4. Flash sale banner ─────────────────────────────────── */

function FlashCountdown({ endTime }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(null);
      return;
    }
    const calculate = () => {
      const now = Date.now();
      const target = new Date(endTime).getTime();
      const diff = Math.max(0, target - now);
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
  }, [endTime]);

  if (!endTime || !timeLeft) return null;

  const pad = (num) => String(num).padStart(2, '0');
  const units = [
    { label: 'Hours', value: pad(timeLeft.hours) },
    { label: 'Mins', value: pad(timeLeft.minutes) },
    { label: 'Secs', value: pad(timeLeft.seconds) },
  ];

  return (
    <div className="flex items-center gap-1.5 mt-3">
      {units.map((unit, idx) => (
        <div key={unit.label} className="flex items-center gap-1.5">
          <div className="flex flex-col items-center">
            <div className="w-11 h-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold" style={{ backgroundColor: '#1B4332', color: '#FFFFFF' }}>
              {unit.value}
            </div>
            <span className="text-[9px] uppercase tracking-wide mt-0.5" style={{ color: '#1B4332' }}>{unit.label}</span>
          </div>
          {idx < units.length - 1 && <span className="font-bold text-sm mt-0" style={{ color: '#1B4332' }}>:</span>}
        </div>
      ))}
    </div>
  );
}

function FlashSaleBanner({ flashSales, products }) {
  const maxDiscount = useMemo(() => {
    if (flashSales?.length) {
      const max = Math.max(...flashSales.map((f) => {
        const orig = Number(f.original_price) || 0;
        const sale = Number(f.sale_price) || 0;
        if (orig > 0 && sale > 0) return Math.round(((orig - sale) / orig) * 100);
        return 0;
      }));
      if (max > 0) return max;
    }
    if (products?.length) {
      const max = Math.max(...products.map((p) => Number(p.discount_percent) || 0));
      return max > 0 ? Math.round(max) : null;
    }
    return null;
  }, [flashSales, products]);

  // DB-driven end-time from GET /api/flash-sales — countdown only renders with a real value
  const flashEndsAt = flashSales?.length ? flashSales[0].ends_at : null;

  const decorative = (flashSales && flashSales.find((f) => f.primary_image))
    || (products || []).find((p) => p.primary_image);

  return (
    <section id="flash-sale" className="px-4">
      <div className="relative overflow-hidden rounded-2xl px-4 py-5" style={{ backgroundColor: '#E8F6EC' }}>
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/40 blur-xl" />

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase" style={{ color: '#166534' }}>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
            Flash Sale
          </span>
          <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full animate-blink" style={{ backgroundColor: '#DC2626' }}>LIVE</span>
        </div>

        <h3 className="font-display text-lg font-bold mt-2 leading-snug" style={{ color: '#1B4332' }}>
          {maxDiscount ? `Up to ${maxDiscount}% OFF on selected combos!` : 'Big savings on selected combos!'}
        </h3>

        {/* Countdown — only renders when a DB-driven end-time exists */}
        <FlashCountdown endTime={flashEndsAt} />

        {!flashEndsAt && (
          <p className="text-[11px] font-medium mt-2" style={{ color: '#166534' }}>
            Limited stock — grab your favourites before they&apos;re gone
          </p>
        )}

        <div className="flex items-center gap-3 mt-3">
          <Link
            href="/products?sort=discount"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white active:scale-95 transition-transform shadow-sm"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            Shop Now
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          {decorative && (
            <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/80 shadow-sm ml-auto">
              {decorative.primary_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getImageUrl(decorative.primary_image)} alt={decorative.name} className="w-full h-full object-cover" loading="lazy" />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── 4b. Bundle Deals (combo deals) ────────────────────────── */

function BundleCard({ bundle, onAddToCart }) {
  const [added, setAdded] = useState(false);
  const products = bundle.products || [];
  const cover = products.find((p) => p.primary_image) || products[0];
  const savingsPct = Number(bundle.savings_percent) || 0;
  // Aggregate rating from member products (averaged)
  const rated = products.filter((p) => Number(p.average_rating) > 0);
  const avgRating = rated.length
    ? rated.reduce((sum, p) => sum + Number(p.average_rating), 0) / rated.length
    : 0;
  const reviewTotal = products.reduce((sum, p) => sum + (Number(p.review_count) || 0), 0);

  const handleAdd = async () => {
    if (!cover) return;
    const result = await onAddToCart(cover.product_id);
    if (result?.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl card overflow-hidden w-[210px] shrink-0 flex flex-col">
      {/* Cover image with discount badge overlay (top-left, ON the image) */}
      <Link href={cover ? `/products/${cover.slug}` : '/products?sort=discount'} className="relative block h-28 overflow-hidden bg-konkan-cream">
        {cover?.primary_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getImageUrl(cover.primary_image)} alt={bundle.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-8 h-8 text-konkan-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        )}
        {savingsPct > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: '#E87722' }}>
            {savingsPct}% OFF
          </span>
        )}
      </Link>

      <div className="p-3 flex flex-col flex-1">
        {/* Name + member count */}
        <h3 className="text-sm font-bold text-konkan-text-primary leading-tight">{bundle.name}</h3>
        {bundle.description && (
          <p className="text-[10px] text-konkan-text-secondary mt-1 leading-snug line-clamp-2">{bundle.description}</p>
        )}

        {/* Star rating + review count */}
        <div className="mt-1.5">
          <StarRating rating={avgRating} size="xs" count={reviewTotal || undefined} />
        </div>

        {/* Price row: bold current + strikethrough original + green % chip */}
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-sm font-bold text-konkan-text-primary">₹{Number(bundle.bundle_price).toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-konkan-text-secondary line-through">₹{Number(bundle.original_price).toLocaleString('en-IN')}</span>
          {savingsPct > 0 && (
            <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(21,128,61,0.10)', color: '#15803B' }}>
              {savingsPct}% OFF
            </span>
          )}
        </div>

        {/* Action row: compact Shop Now + square cart icon */}
        <div className="flex items-center gap-2 mt-3">
          <Link
            href={cover ? `/products/${cover.slug}` : '/products?sort=discount'}
            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-[11px] font-semibold text-white active:scale-95 transition-transform"
            style={{ backgroundColor: '#2D6A4F' }}
          >
            Shop Now
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <button
            onClick={handleAdd}
            disabled={!cover}
            aria-label={`Add ${bundle.name} to cart`}
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all active:scale-95 disabled:opacity-40"
            style={added ? { backgroundColor: '#2D6A4F', color: '#FFFFFF', borderColor: '#2D6A4F' } : { borderColor: '#2D6A4F', color: '#2D6A4F' }}
          >
            {added ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function BundleDeals() {
  const addToCart = useCartStore((s) => s.addToCart);

  const { data: bundlesData, isLoading: bundlesLoading } = useQuery({
    queryKey: ['offers-bundles'],
    queryFn: async () => {
      const res = await api.get('/bundles');
      return res.data.data;
    },
    staleTime: 60000,
  });
  const bundles = bundlesData?.bundles || [];

  return (
    <section id="bundle-deals" className="px-4 mt-6">
      <SectionHeader title="Bundle Deals" href="/products?sort=discount" />
      {bundlesLoading ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[210px] shrink-0 skeleton h-60 rounded-2xl" />
          ))}
        </div>
      ) : bundles.length === 0 ? (
        <div className="bg-white rounded-2xl card border border-dashed border-konkan-sand px-4 py-8 text-center">
          <div className="w-11 h-11 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'rgba(45,106,79,0.10)', color: '#2D6A4F' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-konkan-text-primary mt-3">Combo deals coming soon</h3>
          <p className="text-xs text-konkan-text-secondary mt-1">Curated Konkan combos at special bundle prices.</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {bundles.map((bundle) => (
            <BundleCard key={bundle.id} bundle={bundle} onAddToCart={addToCart} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── 5. More Ways to Save ─────────────────────────────────── */

const MORE_WAYS = [
  {
    title: 'Buy More Save More',
    subtext: 'Up to 20% off on bulk orders',
    href: '/products',
    color: '#2D6A4F',
    bg: 'rgba(45,106,79,0.10)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    title: 'Konkan Coins',
    subtext: 'Earn coins on every purchase & save',
    href: '/account/loyalty',
    color: '#B8860B',
    bg: 'rgba(184,134,11,0.10)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Refer & Earn',
    subtext: 'Invite friends & both get 50 Konkan Coins',
    href: '/account/referrals',
    color: '#1A6B8A',
    bg: 'rgba(26,107,138,0.10)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4m4 4a4 4 0 10-4-4m4 4H8m4 0V9" />
      </svg>
    ),
  },
  {
    title: 'Daily Check-in',
    subtext: 'Check in daily & earn exciting rewards',
    href: '/account/loyalty',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.10)',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
];

function MoreWaysToSave() {
  return (
    <section id="more-ways-to-save" className="px-4 mt-6">
      <SectionHeader title="More Ways to Save" />
      <div className="grid grid-cols-2 gap-3">
        {MORE_WAYS.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="bg-white rounded-2xl card p-3.5 hover:shadow-card-hover transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.bg, color: item.color }}>
              {item.icon}
            </div>
            <h3 className="text-xs font-bold text-konkan-text-primary mt-2.5 leading-tight">{item.title}</h3>
            <p className="text-[10px] text-konkan-text-secondary mt-1 leading-snug">{item.subtext}</p>
            <span className="inline-flex items-center text-[10px] font-semibold mt-2" style={{ color: item.color }}>
              {item.title === 'Daily Check-in' ? 'Check in' : 'Explore'}
              <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ── 6. Exclusive Bank Offers ─────────────────────────────── */

const BANK_DISCOUNT_LABELS = {
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  upi: 'UPI',
  emi: 'EMI',
  netbanking: 'Net Banking',
};

function BankOfferCard({ offer }) {
  const discountLabel = BANK_DISCOUNT_LABELS[offer.discount_type] || 'Bank Offer';
  return (
    <div className="bg-white rounded-2xl card p-3.5 w-[220px] shrink-0">
      <div className="flex items-center gap-2.5">
        {/* Bank logo / icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(26,107,138,0.10)', color: '#1A6B8A' }}
        >
          {offer.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getImageUrl(offer.logo_url)} alt={offer.bank_name} className="w-6 h-6 object-contain" loading="lazy" />
          ) : (
            <span className="text-xs font-bold">{offer.bank_code || offer.bank_name.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-konkan-text-primary truncate">{offer.bank_name}</h3>
          <p className="text-[10px] font-medium" style={{ color: '#1A6B8A' }}>{discountLabel}</p>
        </div>
      </div>

      <p className="text-sm font-bold text-konkan-text-primary mt-2.5 leading-snug">{offer.offer_title}</p>
      {offer.offer_description && (
        <p className="text-[10px] text-konkan-text-secondary mt-1 leading-snug">{offer.offer_description}</p>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-[10px] text-konkan-text-secondary">
          {Number(offer.min_order_amount) > 0 ? `Min order ₹${Number(offer.min_order_amount).toLocaleString('en-IN')}` : 'No min order'}
        </span>
        <span className="text-[10px] font-medium text-konkan-text-secondary underline decoration-dotted">T&amp;C Apply</span>
      </div>
    </div>
  );
}

function BankOffers() {
  const { data: bankData, isLoading: bankLoading } = useQuery({
    queryKey: ['offers-bank'],
    queryFn: async () => {
      const res = await api.get('/bank-offers');
      return res.data.data;
    },
    staleTime: 60000,
  });
  const bankOffers = bankData?.bankOffers || [];

  return (
    <section id="bank-offers" className="px-4 mt-6">
      <SectionHeader title="Exclusive Bank Offers" href="/contact" />
      {bankLoading ? (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[220px] shrink-0 skeleton h-36 rounded-2xl" />
          ))}
        </div>
      ) : bankOffers.length === 0 ? (
        <div className="bg-white rounded-2xl card border border-dashed border-konkan-sand px-4 py-8 text-center">
          <div className="w-11 h-11 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: 'rgba(26,107,138,0.10)', color: '#1A6B8A' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M4 10h16M6 10V7m4 3V7m4 3V7m4 3V7M3 14h18M5 10l-1 10m15-10l1 10" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-konkan-text-primary mt-3">Bank offers coming soon</h3>
          <p className="text-xs text-konkan-text-secondary mt-1">
            Exclusive card discounts &amp; EMI deals are on their way.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {bankOffers.slice(0, 6).map((offer) => (
            <BankOfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </section>
  );
}

/* ── 7. Recently Used Offers ──────────────────────────────── */

function RecentlyUsedOffers() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: ordersData } = useQuery({
    queryKey: ['offers-recent-orders'],
    queryFn: async () => {
      const res = await api.get('/orders?limit=10');
      return res.data.data;
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 60000,
  });

  const usedOffers = useMemo(() => {
    const orders = ordersData?.orders || [];
    return orders
      .filter((o) => o.coupon_code)
      .slice(0, 5)
      .map((o) => ({
        code: o.coupon_code,
        discount: o.coupon_discount ? `-₹${Number(o.coupon_discount).toLocaleString('en-IN')}` : null,
        usedOn: formatUsedOn(o.created_at),
      }));
  }, [ordersData]);

  return (
    <section id="recently-used" className="px-4 mt-6">
      <SectionHeader title="Recently Used Offers" href="/account/orders" hrefLabel="View All" />
      {!isAuthenticated ? (
        <div className="bg-white rounded-2xl card border border-dashed border-konkan-sand px-4 py-6 text-center">
          <p className="text-xs text-konkan-text-secondary">Sign in to see offers you&apos;ve used recently.</p>
          <Link href="/login" className="inline-flex items-center gap-1 text-xs font-semibold mt-2 text-konkan-green-primary hover:text-konkan-green-dark">
            Login
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ) : usedOffers.length === 0 ? (
        <div className="bg-white rounded-2xl card border border-dashed border-konkan-sand px-4 py-6 text-center">
          <p className="text-xs text-konkan-text-secondary">No recently used offers yet. Your coupon history will show up here.</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {usedOffers.map((offer, idx) => (
            <div key={`${offer.code}-${idx}`} className="bg-white rounded-2xl card p-3.5 min-w-[160px] shrink-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-konkan-text-primary">{offer.code}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: '#15803B' }}>
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Used
                </span>
              </div>
              {offer.discount && <p className="text-xs font-semibold mt-1.5" style={{ color: '#15803B' }}>{offer.discount}</p>}
              {offer.usedOn && <p className="text-[10px] text-konkan-text-secondary mt-1">{offer.usedOn}</p>}
            </div>
          ))}
          <Link href="/account/orders" className="min-w-[120px] shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-konkan-sand text-konkan-green-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[11px] font-semibold">View All</span>
          </Link>
        </div>
      )}
    </section>
  );
}

/* ── 8. Buy More, Save More ───────────────────────────────── */

// Fallback tiers used only when the DB setting is missing/unparseable.
const DEFAULT_SAVE_TIERS = [
  { spend: '₹1,000+', save: '5% Off' },
  { spend: '₹2,000+', save: '10% Off' },
  { spend: '₹3,000+', save: '15% Off' },
  { spend: '₹5,000+', save: '20% Off' },
];

function BuyMoreSaveMore() {
  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // DB-driven tiers — site_settings.bulk_discount_tiers = JSON [{ min_order, discount_percent }, ...]
  const tiers = useMemo(() => {
    const raw = settingsData?.settings?.bulk_discount_tiers;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.map((t) => ({
            spend: `₹${Number(t.min_order).toLocaleString('en-IN')}+`,
            save: `${Math.round(Number(t.discount_percent) || 0)}% Off`,
          }));
        }
      } catch {
        // fall through to defaults
      }
    }
    return DEFAULT_SAVE_TIERS;
  }, [settingsData]);

  return (
    <section className="px-4 mt-6">
      <div className="bg-konkan-cream/60 rounded-2xl p-5 text-center">
        <h2 className="font-display text-lg font-bold text-konkan-text-primary">Buy More, Save More</h2>
        <p className="text-xs text-konkan-text-secondary mt-1">
          Automatic discounts applied at checkout — no coupon needed!
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4 max-w-md mx-auto">
          {tiers.map((tier) => (
            <div key={tier.spend} className="bg-white rounded-xl border border-konkan-sand/60 px-3 py-3">
              <p className="text-[11px] text-konkan-text-secondary">Spend {tier.spend}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: '#2D6A4F' }}>Save {tier.save}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 9. Why Shop with Konkan Ghar? ────────────────────────── */

const TRUST_ITEMS = [
  {
    label: '100% Authentic',
    sub: 'Direct from Konkan farms',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: 'Natural & Fresh',
    sub: 'No preservatives added',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 19c-1.5-6 2-10 7-11-1 5-2 8-7 11zm0 0c5-3 9-4 13-3-2 4-6 6-13 3zm4-8c1-4 3-6 7-7-1 4-3 6-7 7z" />
      </svg>
    ),
  },
  {
    label: 'Secure Packaging',
    sub: 'Freshness guaranteed',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'Fast Delivery',
    sub: '3-5 day nationwide',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: 'Customer Support',
    sub: 'We reply within 24h',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 10a6 6 0 10-12 0M4 16v-2a2 2 0 012-2h1a1 1 0 011 1v4a1 1 0 01-1 1H6a2 2 0 01-2-2v-2zm16 0v-2a2 2 0 00-2-2h-1a1 1 0 00-1 1v4a1 1 0 001 1h1a2 2 0 002-2v-2z" />
      </svg>
    ),
  },
];

function WhyShopWithUs() {
  return (
    <section className="mt-6">
      <div className="px-4 mb-3">
        <h2 className="font-display text-lg font-bold text-konkan-text-primary">Why Shop with Konkan Ghar?</h2>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-1">
        {TRUST_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5 bg-white rounded-2xl card px-3.5 py-3 min-w-[168px] shrink-0">
            <div className="w-10 h-10 rounded-xl bg-konkan-green-primary/10 flex items-center justify-center shrink-0 text-konkan-green-primary">
              {item.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-konkan-text-primary leading-tight">{item.label}</h3>
              <p className="text-[10px] text-konkan-text-secondary mt-0.5">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── 10. Need Help? ───────────────────────────────────────── */

function NeedHelp() {
  const { data: settingsData } = useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const s = settingsData?.settings || {};
  const whatsapp = s.social_whatsapp || 'https://wa.me/919876543210';
  const phone = s.phone_primary || '+919876543210';

  const options = [
    {
      label: 'WhatsApp',
      href: whatsapp,
      external: true,
      color: '#15803B',
      bg: 'rgba(21,128,61,0.10)',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
    {
      label: 'Call Us',
      href: `tel:${phone.replace(/\D/g, '')}`,
      external: false,
      color: '#1A6B8A',
      bg: 'rgba(26,107,138,0.10)',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      label: 'Live Chat',
      href: '/contact',
      external: false,
      color: '#E87722',
      bg: 'rgba(232,119,34,0.10)',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="px-4 mt-6">
      <div className="rounded-2xl p-5" style={{ backgroundColor: '#E8F0EC' }}>
        <h2 className="font-display text-base font-bold text-konkan-text-primary text-center">Need Help? We&apos;re here for you</h2>
        <div className="grid grid-cols-3 gap-2.5 mt-4">
          {options.map((opt) => {
            const inner = (
              <div className="flex flex-col items-center gap-1.5 bg-white rounded-xl px-2 py-3 hover:shadow-card-hover transition-shadow">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: opt.bg, color: opt.color }}>
                  {opt.icon}
                </div>
                <span className="text-[11px] font-semibold text-konkan-text-primary">{opt.label}</span>
                {opt.label === 'Live Chat' && (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </div>
            );
            return opt.external ? (
              <a key={opt.label} href={opt.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <Link key={opt.label} href={opt.href}>
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Main page composition ────────────────────────────────── */

export default function OffersContent() {
  const { copiedCode, copyToClipboard } = useCopyCoupon();
  const [activeFilter, setActiveFilter] = useState('all');

  // Active coupons — DB-driven
  const { data: couponsData, isLoading: couponsLoading } = useQuery({
    queryKey: ['offers-coupons'],
    queryFn: async () => {
      const res = await api.get('/coupons');
      return res.data.data;
    },
    staleTime: 60000,
  });
  const coupons = couponsData?.coupons || [];

  // Products for hero collage + flash sale max discount — DB-driven
  const { data: productsData } = useQuery({
    queryKey: ['offers-products'],
    queryFn: async () => {
      const res = await api.get('/products?sort=bestseller&limit=8');
      return res.data.data;
    },
    staleTime: 60000,
  });
  const products = productsData?.products || [];

  // Active flash sales — DB-driven ends_at for the countdown
  const { data: flashData } = useQuery({
    queryKey: ['offers-flash-sales'],
    queryFn: async () => {
      const res = await api.get('/flash-sales');
      return res.data.data;
    },
    staleTime: 60000,
  });
  const flashSales = flashData?.flashSales || [];


  // Filter logic: pills that map to a coupon type filter; others just scroll to sections
  const handleFilterSelect = useCallback((id) => {
    const scrollTargets = { bank: 'bank-offers', combo: 'bundle-deals', festive: 'more-ways-to-save', more: 'more-ways-to-save' };
    if (scrollTargets[id]) {
      // Navigation-only pill — don't mark it active (the coupon list is unchanged)
      setActiveFilter('all');
      document.getElementById(scrollTargets[id])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setActiveFilter(id);
    document.getElementById('active-coupons')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const visibleCoupons = useMemo(() => {
    if (activeFilter === 'free_shipping') {
      return coupons.filter((c) => c.type === 'free_shipping');
    }
    return coupons;
  }, [activeFilter, coupons]);

  return (
    <div className="animate-fade-in bg-white">
      {/* 1. Hero */}
      <HeroBanner coupons={coupons} products={products} />

      {/* 2. Filter pills */}
      <FilterPills active={activeFilter} onSelect={handleFilterSelect} />

      {/* 3. Active Coupons */}
      <section id="active-coupons" className="px-4 mt-5">
        <SectionHeader title="Active Coupons" href="/coupons" />
        <div className="space-y-3">
          {couponsLoading ? (
            <>
              <CouponSkeleton />
              <CouponSkeleton />
              <CouponSkeleton />
            </>
          ) : visibleCoupons.length === 0 ? (
            <div className="bg-white rounded-2xl card border border-dashed border-konkan-sand px-4 py-8 text-center">
              <p className="text-xs text-konkan-text-secondary">No active coupons right now — check back soon!</p>
            </div>
          ) : (
            visibleCoupons.slice(0, 3).map((coupon) => (
              <CouponCard key={coupon.code} coupon={coupon} copiedCode={copiedCode} onCopy={copyToClipboard} />
            ))
          )}
        </div>
      </section>

      {/* 4. Flash Sale */}
      <div className="mt-6">
        <FlashSaleBanner flashSales={flashSales} products={products} />
      </div>

      {/* 4b. Bundle Deals (combo deals) */}
      <BundleDeals />

      {/* 5. More Ways to Save */}
      <MoreWaysToSave />

      {/* 6. Bank Offers */}
      <BankOffers />

      {/* 7. Recently Used Offers */}
      <RecentlyUsedOffers />

      {/* 8. Buy More, Save More */}
      <BuyMoreSaveMore />

      {/* 9. Why Shop with Konkan Ghar? */}
      <WhyShopWithUs />

      {/* 10. Need Help? */}
      <NeedHelp />

      <div className="h-6" />
    </div>
  );
}
