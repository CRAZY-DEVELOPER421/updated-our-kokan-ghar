'use client';

import Link from 'next/link';

// ── SVG line icons for each category (28px, color #1B3B2F) ──
const categoryIcons = {
  seafood: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6 6 2.686 6 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20h6" />
    </svg>
  ),
  pickles: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.5 0-3 .5-3 2v2h6V5c0-1.5-1.5-2-3-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 7v10a3 3 0 106 0V7H9z" />
    </svg>
  ),
  dryfish: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0-2 4-7 9-7s9 5 9 7-4 7-9 7-9-5-9-7z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  spices: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L5 9v8l7 4 7-4V9l-7-6z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  ),
  rice: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a7 7 0 0114 0M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 5l1 3M12 4l1 3M16 5l-1 3" />
    </svg>
  ),
  snacks: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7c-4 0-7 2-7 5s3 5 7 5 7-2 7-5-3-5-7-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 3l1 3M16 3l-1 3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19h14" />
    </svg>
  ),
  oils: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8 6 6 10 6 14a6 6 0 0012 0c0-4-2-8-6-12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14a2 2 0 104 0" />
    </svg>
  ),
  beverages: (
    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 1v3M10 1v3M14 1v3" />
    </svg>
  ),
};

const categories = [
  { label: 'Seafood', slug: 'coastal-seafood', icon: 'seafood' },
  { label: 'Pickles', slug: 'pickles-chutneys', icon: 'pickles' },
  { label: 'Dry Fish', slug: 'coastal-seafood', icon: 'dryfish' },
  { label: 'Spices', slug: 'natural-spices', icon: 'spices' },
  { label: 'Rice & Flours', slug: 'konkan-rice-varieties', icon: 'rice' },
  { label: 'Snacks', slug: 'products?category=snacks', icon: 'snacks' },
  { label: 'Oils & Coconut', slug: 'coconut-products', icon: 'oils' },
  { label: 'Beverages', slug: 'kokum-beverages', icon: 'beverages' },
];

export default function MobileCategoryGrid() {
  return (
    <section>
      {/* Section header — padding: 24px 16px 12px */}
      <div className="flex items-center justify-between px-4" style={{ paddingTop: '24px', paddingBottom: '12px' }}>
        <h2
          className="font-bold"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '20px',
            color: '#1A1A1A',
          }}
        >
          Shop by Category
        </h2>
        <Link
          href="/categories"
          className="font-semibold"
          style={{ fontSize: '13px', color: '#2D5F4C' }}
        >
          View All →
        </Link>
      </div>

      {/* 4×2 grid — padding 0 16px, gap 16px 8px */}
      <div
        className="grid grid-cols-4 px-4"
        style={{ gap: '16px 8px' }}
      >
        {categories.map((cat, idx) => (
          <Link
            key={idx}
            href={`/categories/${cat.slug}`}
            className="flex flex-col items-center gap-0 group"
          >
            {/* 56px circle with light green bg */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center group-hover:opacity-80 transition-opacity"
              style={{ backgroundColor: '#E8F0EC', color: '#1B3B2F' }}
            >
              {categoryIcons[cat.icon]}
            </div>
            {/* 12px label, 8px margin-top, max 2 lines */}
            <span
              className="text-center leading-tight line-clamp-2 mt-2 max-w-[72px]"
              style={{ fontSize: '12px', color: '#4A4A4A' }}
            >
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
