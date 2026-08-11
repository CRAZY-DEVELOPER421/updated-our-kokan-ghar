'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ProductCarouselCard, { ProductCarouselCardSkeleton } from '@/components/product/ProductCarouselCard';

export default function BestsellerRow({
  title = 'Bestsellers',
  subtitle = 'Most loved Konkan products by our customers',
  apiEndpoint = '/products/bestsellers',
  queryKey = ['bestsellers'],
  viewAllHref = '/products?sort=bestseller',
}) {
  const { data: products, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get(apiEndpoint);
      return res.data.data.products || [];
    },
    staleTime: 120000,
  });

  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <Link
          href={viewAllHref}
          className="hidden md:flex items-center gap-1 text-sm font-medium text-konkan-green-primary hover:text-konkan-green-dark transition-colors"
        >
          View All
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[220px] md:w-[260px] shrink-0">
              <ProductCarouselCardSkeleton />
            </div>
          ))
        ) : (
          (products || []).slice(0, 10).map((product) => (
            <div key={product.id} className="w-[220px] md:w-[260px] shrink-0">
              <ProductCarouselCard product={product} />
            </div>
          ))
        )}
      </div>

      <div className="text-center mt-4 md:hidden">
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-konkan-green-primary"
        >
          View All Bestsellers
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
