'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Camera, Mic, ChevronRight, Truck, RefreshCw, Shield, Star } from 'lucide-react';
import { useCategories } from '@/lib/hooks/useProducts';
import { useFeaturedProducts } from '@/lib/hooks/useProducts';

import { getImageUrl } from '@/lib/utils';

/* ─── Const Data ────────────────────────────────────── */

const CATEGORY_SHORTCUTS = [
  { label: 'Fresh Mangoes', slug: 'konkan-mangoes-fruits', bg: 'from-amber-100 to-orange-50', icon: '🥭', color: '#E87722' },
  { label: 'Seafood', slug: 'coastal-seafood', bg: 'from-blue-100 to-cyan-50', icon: '🐟', color: '#1A6B8A' },
  { label: 'Cashews', slug: 'cashew-dry-fruits', bg: 'from-yellow-100 to-amber-50', icon: '🥜', color: '#B8860B' },
  { label: 'Spices', slug: 'natural-spices', bg: 'from-red-100 to-rose-50', icon: '🌶️', color: '#DC2626' },
  { label: 'Offers', slug: 'offers', bg: 'from-green-100 to-emerald-50', icon: '🏷️', color: '#2D6A4F' },
];

const HERO_SLIDES = [
  {
    badge: 'Seasonal',
    title: 'Fresh Alphonso Mangoes',
    subtitle: 'Direct from Devgad & Ratnagiri orchards',
    cta: 'Shop Now',
    href: '/categories/konkan-mangoes-fruits',
    bg: 'from-konkan-green-dark to-konkan-green-primary',
    accent: '#E87722',
  },
  {
    badge: 'Monsoon Special',
    title: 'Monsoon Delicacies',
    subtitle: 'Crispy bhajjis, dried fish & Konkan chai',
    cta: 'Explore',
    href: '/categories/coastal-seafood',
    bg: 'from-konkan-ocean to-blue-800',
    accent: '#F4A261',
  },
  {
    badge: 'Best Price',
    title: 'Premium Goan Cashews',
    subtitle: 'W180 Grade — roasted & salted',
    cta: 'Shop Cashews',
    href: '/categories/cashew-dry-fruits',
    bg: 'from-konkan-earth to-amber-800',
    accent: '#F4A261',
  },
  {
    badge: 'Free Shipping',
    title: 'Konkan Rice Collection',
    subtitle: 'Indrayani, Ambemohar & Red Rice',
    cta: 'Browse Rice',
    href: '/categories/konkan-rice-varieties',
    bg: 'from-amber-800 to-konkan-earth',
    accent: '#E87722',
  },
];

const FEATURES = [
  { icon: Truck, label: 'Free Delivery', sub: 'Above ₹499' },
  { icon: RefreshCw, label: 'Easy Returns', sub: 'Within 7 days' },
  { icon: Shield, label: '100% Authentic', sub: 'Direct from farms' },
];

/* ─── Section 1: Category Shortcuts (horiz scroll) ─── */

function CategoryShortcuts() {
  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide px-4 py-3 -mx-4 snap-x snap-mandatory">
      {CATEGORY_SHORTCUTS.map((cat) => (
        <Link
          key={cat.slug}
          href={`/${cat.slug === 'offers' ? 'offers' : `categories/${cat.slug}`}`}
          className="flex flex-col items-center gap-1.5 shrink-0 snap-start"
        >
          <div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${cat.bg} flex items-center justify-center shadow-sm`}
          >
            <span className="text-2xl">{cat.icon}</span>
          </div>
          <span className="text-[10px] font-medium text-konkan-text-primary text-center leading-tight max-w-[64px]">
            {cat.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ─── Section 2: Search Bar ─────────────────────────── */

function MobileSearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="px-4 pb-2">
      <div className="relative flex items-center bg-gray-100 rounded-xl border border-gray-200 focus-within:border-konkan-green-primary focus-within:ring-2 focus-within:ring-konkan-green-primary/20 transition-all">
        <div className="pl-3 pr-2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search mangoes, cashews, spices..."
          className="flex-1 bg-transparent py-2.5 pr-2 text-sm text-konkan-text-primary placeholder:text-gray-400 focus:outline-none"
        />
        <div className="flex items-center gap-1 pr-2">
          <button type="button" className="p-1.5 text-gray-400 hover:text-konkan-green-primary transition-colors" aria-label="Search by image">
            <Camera className="w-4 h-4" />
          </button>
          <button type="button" className="p-1.5 text-gray-400 hover:text-konkan-green-primary transition-colors" aria-label="Voice search">
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </form>
  );
}

/* ─── Section 3: Location / Delivery Bar ────────────── */

function DeliveryBar() {
  return (
    <Link
      href="/account/addresses"
      className="flex items-center justify-between px-4 py-2 bg-konkan-cream/60 border-t border-b border-konkan-sand/30"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm">📍</span>
        <span className="text-xs text-konkan-text-secondary truncate">
          Delivering to <strong className="text-konkan-text-primary">416701</strong>
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[11px] font-medium text-konkan-green-primary">Change</span>
        <ChevronRight className="w-3.5 h-3.5 text-konkan-green-primary" />
      </div>
    </Link>
  );
}

/* ─── Section 4: Hero Banner Carousel ────────────────── */

function MobileHeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);

  const totalSlides = HERO_SLIDES.length;

  const goTo = useCallback((idx) => {
    setCurrent(((idx % totalSlides) + totalSlides) % totalSlides);
  }, [totalSlides]);

  const nextSlide = useCallback(() => goTo(current + 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(nextSlide, 4000);
    return () => clearInterval(intervalRef.current);
  }, [isPaused, nextSlide]);

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    const diff = Math.abs(e.touches[0].clientX - touchStartX.current);
    if (diff > 10) e.preventDefault();
  };
  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(current + 1);
      else goTo(current - 1);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden mx-4 rounded-xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slide track — CSS Grid ensures each column is exactly 100% of container width */}
      <div
        className="grid grid-flow-col auto-cols-[100%]"
        style={{ transform: `translateX(-${current * 100}%)`, transition: 'transform 400ms ease-out' }}
      >
        {HERO_SLIDES.map((slide, idx) => (
          <Link
            key={idx}
            href={slide.href}
            className={`relative h-36 bg-gradient-to-r ${slide.bg} flex items-center px-5`}
          >
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-2 left-8 w-16 h-16 bg-white/5 rounded-full blur-xl" />

            <div className="relative z-10">
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold text-white mb-1.5"
                style={{ backgroundColor: slide.accent }}
              >
                {slide.badge}
              </span>
              <h3 className="text-white font-bold text-sm leading-tight mb-0.5">{slide.title}</h3>
              <p className="text-white/70 text-[10px] mb-2 max-w-[200px]">{slide.subtitle}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                {slide.cta} →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {Array.from({ length: totalSlides }).map((_, idx) => (
          <button
            key={idx}
            onClick={(e) => { e.preventDefault(); goTo(idx); }}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              idx === current ? 'bg-white w-4' : 'bg-white/50'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
        <button
          onClick={(e) => { e.preventDefault(); setIsPaused(!isPaused); }}
          className="ml-2 w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center"
          aria-label={isPaused ? 'Play' : 'Pause'}
        >
          {isPaused ? (
            <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          ) : (
            <svg className="w-2 h-2 text-white" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Section 5: Feature Strip ──────────────────────── */

function FeatureStrip() {
  return (
    <div className="bg-gradient-to-r from-konkan-green-primary to-konkan-green-dark mx-4 rounded-xl px-4 py-3">
      <div className="grid grid-cols-3 gap-2">
        {FEATURES.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div key={idx} className="flex flex-col items-center text-center gap-1">
              <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                <Icon className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[10px] font-semibold text-white leading-tight">{feat.label}</span>
              <span className="text-[8px] text-white/60">{feat.sub}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Section 6: Horizontal Category Thumbnails ─────── */

function HorizontalCategoryScroll() {
  const { data, isLoading } = useCategories();
  const categories = data?.categories?.filter(c => !c.parent_id)?.slice(0, 8) || [];

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-konkan-text-primary">Shop by Category</h3>
        <Link href="/categories" className="text-[11px] font-medium text-konkan-green-primary flex items-center gap-0.5">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 snap-x snap-mandatory">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0 snap-start">
              <div className="w-[72px] h-[72px] rounded-xl skeleton" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
          ))
        ) : (
          categories.slice(0, 8).map((cat, idx) => {
            const colors = [
              'from-amber-100 to-orange-50',
              'from-blue-100 to-cyan-50',
              'from-green-100 to-emerald-50',
              'from-red-100 to-rose-50',
              'from-purple-100 to-violet-50',
              'from-yellow-100 to-amber-50',
              'from-pink-100 to-fuchsia-50',
              'from-teal-100 to-cyan-50',
            ];
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-1.5 shrink-0 snap-start"
              >
                <div className={`w-[72px] h-[72px] rounded-xl bg-gradient-to-br ${colors[idx % colors.length]} flex items-center justify-center shadow-sm border border-white/50`}>
                  {cat.image_url ? (
                    <Image
                      src={getImageUrl(cat.image_url)}
                      alt={cat.name}
                      width={56}
                      height={56}
                      className="w-12 h-12 object-cover rounded-lg"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-2xl">🛍️</span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-konkan-text-primary text-center leading-tight max-w-[72px] truncate">
                  {cat.name}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── Section 7: Featured Products Row ──────────────── */

function FeaturedProductsRow({ title = 'Featured Products' }) {
  const { data: products, isLoading } = useFeaturedProducts();

  return (
    <div className="px-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-konkan-text-primary">{title}</h3>
        <Link href="/products" className="text-[11px] font-medium text-konkan-green-primary flex items-center gap-0.5">
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1 snap-x snap-mandatory">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[130px] shrink-0 snap-start space-y-2">
              <div className="skeleton w-[130px] h-[130px] rounded-xl" />
              <div className="skeleton h-3 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))
        ) : (
          (products || []).slice(0, 10).map((product) => (
            <div key={product.id} className="w-[130px] shrink-0 snap-start">
              <div className="flex flex-col">
                <Link href={`/products/${product.slug}`} className="block">
                  <div className="relative w-[130px] h-[130px] rounded-xl overflow-hidden bg-[#f5f0eb] mb-2">
                    {product.primary_image ? (
                      <Image
                        src={getImageUrl(product.primary_image)}
                        alt={product.name}
                        fill
                        sizes="130px"
                        className="object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {product.discount_percent > 0 && (
                      <span className="absolute top-1 left-1 text-[8px] font-bold bg-gradient-to-r from-[#E87722] to-[#d95f0e] text-white px-1.5 py-0.5 rounded-sm">
                        -{Math.round(product.discount_percent)}%
                      </span>
                    )}
                  </div>
                </Link>
                <Link href={`/products/${product.slug}`}>
                  <h4 className="text-[11px] font-semibold text-konkan-text-primary line-clamp-2 leading-snug mb-1">
                    {product.name}
                  </h4>
                </Link>
                <div className="flex items-center gap-0.5 mb-0.5">
                  <Star className="w-2.5 h-2.5 fill-[#F4A261] text-[#F4A261]" />
                  <span className="text-[9px] text-konkan-text-secondary">
                    {parseFloat(product.average_rating || 0).toFixed(1)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#E87722]">₹{product.price}</span>
                  {product.mrp > product.price && (
                    <span className="text-[9px] text-gray-400 line-through">₹{product.mrp}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── Section 8: Offers Banner ──────────────────────── */

function OffersBanner() {
  return (
    <div className="px-4">
      <Link
        href="/offers"
        className="block bg-gradient-to-r from-konkan-saffron to-amber-500 rounded-xl p-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-white/80 uppercase tracking-wider">Limited Time</span>
            <h3 className="text-white font-bold text-base leading-tight mt-0.5">Up to 40% Off</h3>
            <p className="text-white/70 text-[10px] mt-0.5">On seasonal favorites</p>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-white/90 px-3.5 py-1.5 rounded-full shadow-sm">
            Grab Now →
          </span>
        </div>
      </Link>
    </div>
  );
}

/* ─── Main Mobile Home Page ──────────────────────────── */

export default function MobileHomePage() {
  return (
    <div className="lg:hidden min-h-screen bg-white pb-20">
      {/* Section 1: Category Shortcuts */}
      <CategoryShortcuts />

      {/* Section 2: Search Bar */}
      <MobileSearchBar />

      {/* Section 3: Delivery Bar */}
      <DeliveryBar />

      {/* Spacing */}
      <div className="h-3" />

      {/* Section 4: Hero Carousel */}
      <MobileHeroCarousel />

      {/* Spacing */}
      <div className="h-3" />

      {/* Section 5: Feature Strip */}
      <FeatureStrip />

      {/* Spacing */}
      <div className="h-4" />

      {/* Section 6: Horizontal Category Thumbnails */}
      <HorizontalCategoryScroll />

      {/* Spacing */}
      <div className="h-5" />

      {/* Section 7: Featured Products Row */}
      <FeaturedProductsRow title="Featured Products" />

      {/* Spacing */}
      <div className="h-4" />

      {/* Section 8: Offers Banner */}
      <OffersBanner />

      {/* Spacing */}
      <div className="h-4" />
    </div>
  );
}
