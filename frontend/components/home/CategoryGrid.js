'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCategories } from '@/lib/hooks/useProducts';
import { getImageUrl } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

// Loading fallback — real category slugs so links work even if the API is down
const fallbackCategories = [
  { id: 1, name: 'Fresh Fruits', slug: 'kokan-meva-fresh-fruits', product_count: 23 },
  { id: 2, name: 'Mango Products', slug: 'mango-aamba-products', product_count: 26 },
  { id: 3, name: 'Kokum & Aamsul', slug: 'kokum-aamsul-products', product_count: 15 },
  { id: 4, name: 'Jambhul & Jamun', slug: 'jambhul-jamun-products', product_count: 10 },
  { id: 5, name: 'Karvanda Products', slug: 'karvanda-products', product_count: 10 },
  { id: 6, name: 'Ambada Products', slug: 'ambada-products', product_count: 8 },
  { id: 7, name: 'Jackfruit Products', slug: 'fanas-jackfruit-products', product_count: 13 },
  { id: 8, name: 'Cashew & Kaju', slug: 'kokan-cashew-kaju', product_count: 12 },
  { id: 9, name: 'Coconut Products', slug: 'coconut-products', product_count: 11 },
  { id: 10, name: 'Konkan Rice', slug: 'kokan-rice-tandul', product_count: 13 },
  { id: 11, name: 'Poha & Chivda', slug: 'poha-chivda-products', product_count: 10 },
  { id: 12, name: 'Flours', slug: 'peeth-flours', product_count: 12 },
];

function CategoryCard({ cat }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/categories/${cat.slug}`}
      className="group flex flex-col items-center text-center bg-white rounded-xl border border-konkan-sand/40 px-2 py-4 hover:shadow-lg hover:border-konkan-green-primary/30 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Circular image container */}
      <div className="w-20 h-20 rounded-full bg-konkan-green-primary/10 flex items-center justify-center mb-3 group-hover:bg-konkan-green-primary/15 transition-colors duration-200">
        {cat.image_url && !imgError ? (
          <Image
            src={getImageUrl(cat.image_url)}
            alt={cat.name}
            width={52}
            height={52}
            sizes="52px"
            className="w-[52px] h-[52px] object-contain group-hover:scale-110 transition-transform duration-200"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <svg className="w-8 h-8 text-konkan-green-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.5 0-4.5-4-4.5-9S9.5 3 12 3s4.5 4 4.5 9-2 9-4.5 9zm0 0c-2.5 0-4.5-4-4.5-9S9.5 3 12 3s4.5 4 4.5 9-2 9-4.5 9z" />
          </svg>
        )}
      </div>

      {/* Category name — single line with ellipsis */}
      <h3 className="text-sm font-semibold text-konkan-text-primary leading-snug truncate w-full px-1 group-hover:text-konkan-green-primary transition-colors duration-200">
        {cat.name}
      </h3>

      {/* Real product count from DB */}
      <p className="text-xs font-normal text-konkan-text-secondary mt-0.5">
        {cat.product_count || 0}+ Products
      </p>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col items-center rounded-xl border border-konkan-sand/40 bg-white px-2 py-4">
      <div className="w-20 h-20 rounded-full bg-konkan-green-primary/10 mb-3 skeleton !rounded-full" />
      <Skeleton variant="text" className="!w-3/4 !h-3" />
      <Skeleton variant="text" className="!w-16 !h-2.5 mt-1" />
    </div>
  );
}

export default function CategoryGrid() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useCategories();

  useEffect(() => { setMounted(true); }, []);

  const categories = (!mounted || isLoading)
    ? fallbackCategories
    : (data?.categories?.filter(c => !c.parent_id) || fallbackCategories).slice(0, 12);

  return (
    <section>
      {/* Section header — left aligned, icon + title + subtext, View All right */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <svg className="w-[18px] h-[18px] text-konkan-green-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c-2.5 0-4.5-4-4.5-9S9.5 3 12 3s4.5 4 4.5 9-2 9-4.5 9zm0 0c-2.5 0-4.5-4-4.5-9S9.5 3 12 3s4.5 4 4.5 9-2 9-4.5 9z" />
            </svg>
            <h2 className="text-[22px] lg:text-2xl font-bold text-konkan-text-primary leading-none">
              Shop by Category
            </h2>
          </div>
          <p className="text-[13px] lg:text-sm font-normal text-konkan-text-secondary mt-1.5">
            Explore authentic Konkan products from our curated categories
          </p>
        </div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-konkan-green-primary hover:text-konkan-green-dark transition-colors shrink-0"
        >
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      {/* 6 columns on desktop (2 rows = up to 12 categories) */}
      {!mounted || isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-5">
          {categories.slice(0, 12).map((cat) => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </section>
  );
}
