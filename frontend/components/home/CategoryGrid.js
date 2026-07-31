'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCategories } from '@/lib/hooks/useProducts';
import { getImageUrl } from '@/lib/utils';
import Skeleton from '@/components/ui/Skeleton';

const fallbackCategories = [
  { id: 1, name: 'Mangoes & Fruits', slug: 'konkan-mangoes-fruits', product_count: 25 },
  { id: 2, name: 'Coastal Seafood', slug: 'coastal-seafood', product_count: 25 },
  { id: 3, name: 'Coconut Products', slug: 'coconut-products', product_count: 15 },
  { id: 4, name: 'Konkan Rice', slug: 'konkan-rice-varieties', product_count: 20 },
  { id: 5, name: 'Kokum & Beverages', slug: 'kokum-beverages', product_count: 15 },
  { id: 6, name: 'Pickles & Chutneys', slug: 'pickles-chutneys', product_count: 15 },
  { id: 7, name: 'Cashew & Dry Fruits', slug: 'cashew-dry-fruits', product_count: 15 },
  { id: 8, name: 'Natural Spices', slug: 'natural-spices', product_count: 20 },
];

function CategoryCard({ cat }) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link
      href={`/categories/${cat.slug}`}
      className="group block rounded-2xl bg-white overflow-hidden border border-konkan-sand/40 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* Image Area */}
      <div className="relative max-[768px]:h-[70px] h-[180px] md:h-[200px] overflow-hidden bg-gradient-to-br from-konkan-green-primary/10 to-konkan-cream">
        {cat.image_url && !imgError ? (
          <>
            <Image
              src={getImageUrl(cat.image_url)}
              alt={cat.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
              onError={() => setImgError(true)}
            />
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-konkan-green-primary/5 to-konkan-cream">
            <div className="w-14 h-14 rounded-2xl bg-konkan-green-primary/10 flex items-center justify-center mb-2">
              <svg className="w-7 h-7 text-konkan-green-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-konkan-text-secondary/60">No image</span>
          </div>
        )}
      </div>

      {/* Text Area */}
      <div className="max-[768px]:p-1.5 p-4 md:p-5">
        <h3 className="font-display max-[768px]:text-[10px] leading-[1.2] text-sm md:text-base font-bold text-konkan-text-primary group-hover:text-konkan-green-primary transition-colors duration-200 line-clamp-2">
          {cat.name}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-medium text-konkan-green-primary bg-konkan-green-primary/10 px-2.5 py-1 rounded-full max-[768px]:hidden">
            {cat.product_count || 0} Products
          </span>
          <span className="text-xs text-konkan-text-secondary group-hover:translate-x-1 transition-transform duration-200 max-[768px]:hidden">
            Shop now →
          </span>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white overflow-hidden border border-konkan-sand/40">
      <div className="skeleton max-[768px]:!h-[70px] !h-[180px] md:!h-[200px] !rounded-none" />
      <div className="max-[768px]:!p-1.5 !p-4 md:!p-5 space-y-2">
        <Skeleton variant="title" className="!w-3/4 max-[768px]:!h-2.5 !h-4" />
        <div className="flex items-center gap-2 max-[768px]:hidden">
          <Skeleton variant="badge" className="!w-20 !h-6 !rounded-full" />
          <Skeleton variant="title" className="!w-16 !h-3" />
        </div>
      </div>
    </div>
  );
}

export default function CategoryGrid() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useCategories();

  useEffect(() => { setMounted(true); }, []);

  const categories = (!mounted || isLoading)
    ? fallbackCategories
    : (data?.categories?.filter(c => !c.parent_id) || fallbackCategories).slice(0, 8);

  return (
    <section>
      <div className="text-center mb-8 md:mb-10">
        <h2 className="section-title">Shop by Category</h2>
        <p className="section-subtitle">Explore authentic Konkan products from our curated categories</p>
      </div>

      {!mounted || isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 max-[768px]:gap-2 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 max-[768px]:gap-2 gap-4 md:gap-6">
          {categories.slice(0, 8).map((cat) => (
            <CategoryCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}
    </section>
  );
}
