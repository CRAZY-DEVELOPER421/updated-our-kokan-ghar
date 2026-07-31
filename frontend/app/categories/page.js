'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Breadcrumb from '@/components/ui/Breadcrumb';

/* ─── Static Data ─────────────────────────────────────── */

const SHOP_BY_NEEDS = [
  {
    label: 'Daily Essentials',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    label: 'Festival Special',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    label: 'Traditional Recipes',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    label: 'Gift Hampers',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    label: 'New Arrivals',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Best Sellers',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const TRUST_BADGES = [
  {
    label: '100% Authentic',
    subtext: 'Direct from source',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    label: 'Fresh & Natural',
    subtext: 'No preservatives',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      </svg>
    ),
  },
  {
    label: 'Secure Packaging',
    subtext: 'Carefully packed',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
  },
  {
    label: 'Fast Delivery',
    subtext: 'Pan India shipping',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
  {
    label: 'Customer Support',
    subtext: 'We\'re here to help',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
];

/* ─── Helpers ──────────────────────────────────────────── */

const COLORS = ['#F5821F', '#3B82F6', '#2D5F4C', '#7C3AED', '#EC4899', '#059669'];

function getColor(index) {
  return COLORS[index % COLORS.length];
}

function getPriceWithDiscount(product) {
  const price = Number(product.price) || 0;
  const discount = Number(product.discount_percent) || 0;
  if (discount > 0) {
    const original = Math.round(price / (1 - discount / 100));
    return { current: price, original, discount };
  }
  return { current: price, original: null, discount: 0 };
}

/* ─── Component ────────────────────────────────────────── */

export default function CategoriesPage() {
  // ── Fetch all categories ──
  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
    staleTime: 300000,
  });

  const allCategories = catData?.all || [];
  const parentCategories = allCategories.filter((c) => !c.parent_id);

  // ── Fetch featured products for "Top Picks" ──
  const { data: topPicks = [] } = useQuery({
    queryKey: ['top-picks-categories'],
    queryFn: async () => {
      const res = await api.get('/products/featured');
      return res.data.data?.products || [];
    },
    staleTime: 300000,
  });

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      {/* ── 1. Breadcrumb ── */}
      <div style={{ padding: '12px 16px 0' }}>
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Categories' }]} />
      </div>

      {/* ── 2. Page Title ── */}
      <div style={{ padding: '16px 16px 20px' }}>
        <h1
          className="font-bold"
          style={{
            fontSize: '24px',
            color: '#1A1A1A',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          All Categories
        </h1>
        <p style={{ fontSize: '13px', color: '#8A8A8A', marginTop: '4px' }}>
          Explore our wide range of authentic Konkan products
        </p>
      </div>

      {/* ── 3. Category Grid (from DB) ── */}
      <section style={{ padding: '0 16px 24px' }}>
        {catLoading ? (
          <div className="grid grid-cols-4" style={{ gap: '16px 8px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full" style={{ backgroundColor: '#E8F0EC' }} />
                <div className="h-3 w-16 rounded" style={{ backgroundColor: '#E8F0EC' }} />
              </div>
            ))}
          </div>
        ) : parentCategories.length > 0 ? (
          <div className="grid grid-cols-4" style={{ gap: '16px 8px' }}>
            {parentCategories.map((cat, idx) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="flex flex-col items-center gap-0 group"
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden group-hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: '#E8F0EC' }}
                >
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className="font-bold text-sm"
                      style={{ color: '#1B3B2F' }}
                    >
                      {cat.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span
                  className="text-center leading-tight line-clamp-2 mt-2"
                  style={{ fontSize: '11px', color: '#4A4A4A', maxWidth: '72px' }}
                >
                  {cat.name}
                </span>
                {cat.product_count > 0 && (
                  <span style={{ fontSize: '9px', color: '#8A8A8A', marginTop: '2px' }}>
                    {cat.product_count}+
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#8A8A8A', textAlign: 'center', padding: '20px 0' }}>
            No categories available yet.
          </p>
        )}
      </section>

      {/* ── 4. Promo Banner ── */}
      <section
        style={{
          backgroundColor: '#1B3B2F',
          margin: '0 16px 24px',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ padding: '24px 20px', position: 'relative', zIndex: 1 }}>
          <h2
            className="font-bold"
            style={{
              fontSize: '20px',
              color: '#FFFFFF',
              fontFamily: "'Poppins', sans-serif",
              lineHeight: 1.3,
            }}
          >
            Authentic Konkan Flavors,{' '}
            <span style={{ color: '#F5821F' }}>Delivered</span> to Your Home
          </h2>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '8px', maxWidth: '240px' }}>
            Fresh from the coast — seafood, spices, pickles & more. Straight from local farmers and artisans.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 font-semibold mt-4"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1B3B2F',
              padding: '10px 24px',
              borderRadius: '10px',
              fontSize: '13px',
            }}
          >
            Shop Now →
          </Link>
        </div>
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            right: '-30px',
            top: '-20px',
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '10px',
            bottom: '-30px',
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255,133,31,0.15)',
          }}
        />
      </section>

      {/* ── 5. Shop by Need ── */}
      <section style={{ padding: '0 0 24px' }}>
        <div
          className="flex items-center justify-between"
          style={{ padding: '0 16px 12px' }}
        >
          <h2
            className="font-bold"
            style={{
              fontSize: '20px',
              color: '#1A1A1A',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Shop by Need
          </h2>
          <Link
            href="/products"
            className="font-semibold"
            style={{ fontSize: '13px', color: '#2D5F4C' }}
          >
            View All →
          </Link>
        </div>
        <div
          className="flex gap-3 overflow-x-auto"
          style={{
            paddingLeft: '16px',
            paddingBottom: '8px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {SHOP_BY_NEEDS.map((need, idx) => (
            <Link
              key={idx}
              href="/products"
              className="shrink-0 flex flex-col items-center gap-2.5 rounded-xl"
              style={{
                width: '100px',
                padding: '16px 12px',
                backgroundColor: '#F8FAF9',
                border: '1px solid #E8F0EC',
              }}
            >
              <div style={{ color: getColor(idx) }}>{need.icon}</div>
              <span
                className="text-center leading-tight"
                style={{ fontSize: '12px', color: '#4A4A4A', fontWeight: 500 }}
              >
                {need.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 6. Popular Categories (parent categories from DB) ── */}
      <section style={{ padding: '0 0 24px' }}>
        <div
          className="flex items-center justify-between"
          style={{ padding: '0 16px 12px' }}
        >
          <h2
            className="font-bold"
            style={{
              fontSize: '20px',
              color: '#1A1A1A',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Popular Categories
          </h2>
          <Link
            href="/categories"
            className="font-semibold"
            style={{ fontSize: '13px', color: '#2D5F4C' }}
          >
            View All →
          </Link>
        </div>
        {parentCategories.length > 0 ? (
          <div
            className="flex gap-3 overflow-x-auto"
            style={{
              paddingLeft: '16px',
              paddingBottom: '8px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {parentCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="shrink-0 block overflow-hidden rounded-xl bg-white"
                style={{
                  width: '140px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div className="relative" style={{ height: '120px', backgroundColor: '#E8F0EC' }}>
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="font-bold"
                        style={{ fontSize: '32px', color: '#1B3B2F', opacity: 0.3 }}
                      >
                        {cat.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 12px 12px' }}>
                  <span
                    className="font-semibold leading-snug line-clamp-1"
                    style={{ fontSize: '13px', color: '#1A1A1A' }}
                  >
                    {cat.name}
                  </span>
                  {cat.product_count > 0 && (
                    <p style={{ fontSize: '10px', color: '#8A8A8A', marginTop: '2px' }}>
                      {cat.product_count} Products
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p
            style={{
              fontSize: '13px',
              color: '#8A8A8A',
              textAlign: 'center',
              padding: '20px 0',
            }}
          >
            Loading categories...
          </p>
        )}
      </section>

      {/* ── 7. Top Picks for You ── */}
      <section style={{ padding: '0 0 24px' }}>
        <div
          className="flex items-center justify-between"
          style={{ padding: '0 16px 12px' }}
        >
          <h2
            className="font-bold"
            style={{
              fontSize: '20px',
              color: '#1A1A1A',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Top Picks for You
          </h2>
          <Link
            href="/products"
            className="font-semibold"
            style={{ fontSize: '13px', color: '#2D5F4C' }}
          >
            View All →
          </Link>
        </div>
        {topPicks.length > 0 ? (
          <div
            className="flex gap-3 overflow-x-auto"
            style={{
              paddingLeft: '16px',
              paddingBottom: '8px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {topPicks.slice(0, 10).map((product) => {
              const pricing = getPriceWithDiscount(product);
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="shrink-0 block overflow-hidden rounded-xl bg-white"
                  style={{
                    width: '150px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  {/* Image */}
                  <div
                    className="relative"
                    style={{
                      height: '150px',
                      backgroundColor: '#F5F5F5',
                    }}
                  >
                    {product.primary_image ? (
                      <img
                        src={product.primary_image}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="w-10 h-10"
                          style={{ color: '#CCCCCC' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Discount badge */}
                    {pricing.discount > 0 && (
                      <span
                        className="absolute top-2 left-2 text-[10px] font-bold text-white px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: '#E53935' }}
                      >
                        {pricing.discount}% OFF
                      </span>
                    )}
                  </div>
                  {/* Content */}
                  <div style={{ padding: '8px 10px 10px' }}>
                    <h3
                      className="font-medium leading-snug line-clamp-2"
                      style={{ fontSize: '12px', color: '#1A1A1A' }}
                    >
                      {product.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span
                        className="font-bold"
                        style={{ fontSize: '14px', color: '#1B3B2F' }}
                      >
                        ₹{pricing.current}
                      </span>
                      {pricing.original && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#8A8A8A',
                            textDecoration: 'line-through',
                          }}
                        >
                          ₹{pricing.original}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p
            style={{
              fontSize: '13px',
              color: '#8A8A8A',
              textAlign: 'center',
              padding: '20px 0',
            }}
          >
            Loading top picks...
          </p>
        )}
      </section>

      {/* ── 8. Why Choose Konkan Ghar? ── */}
      <section
        style={{
          padding: '20px 16px 24px',
          backgroundColor: '#F8FAF9',
        }}
      >
        <h2
          className="font-bold text-center mb-4"
          style={{
            fontSize: '18px',
            color: '#1A1A1A',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Why Choose Konkan Ghar?
        </h2>
        <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {TRUST_BADGES.map((badge, idx) => (
            <div
              key={idx}
              className="shrink-0 flex flex-col items-center gap-1.5 rounded-xl bg-white"
              style={{
                width: '120px',
                padding: '16px 12px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ color: '#2D5F4C' }}>{badge.icon}</div>
              <span
                className="text-center font-semibold leading-tight"
                style={{ fontSize: '11px', color: '#1A1A1A' }}
              >
                {badge.label}
              </span>
              <span style={{ fontSize: '9px', color: '#8A8A8A', textAlign: 'center' }}>
                {badge.subtext}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
