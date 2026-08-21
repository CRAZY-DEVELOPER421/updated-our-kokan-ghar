'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import ProductCarouselCard from '@/components/product/ProductCarouselCard';

/**
 * SimilarProducts — shows products from the same category and similar
 * price range. Fetches from GET /products/:id/related which now considers
 * both category AND price proximity.
 *
 * Displayed as a horizontal scroll row (same card shape as Flash Sale,
 * Bestsellers, Deals Under ₹999).
 */
export default function SimilarProducts({ productId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['similar-products', productId],
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/related`);
      return res.data.data?.products || [];
    },
    enabled: !!productId,
    staleTime: 300000, // 5 min — catalog doesn't change fast
  });

  const products = data || [];

  // Don't render anything if no similar products found
  if (!isLoading && products.length === 0) return null;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-bold text-konkan-text-primary">
            Similar Products
          </h2>
          <p className="text-sm text-konkan-text-secondary mt-0.5">
            You might also like these
          </p>
        </div>
        {products.length > 0 && (
          <Link
            href={`/categories/${products[0]?.category_slug || ''}`}
            className="text-sm font-medium text-konkan-green-primary hover:text-konkan-green-dark transition-colors shrink-0"
          >
            View All →
          </Link>
        )}
      </div>

      {/* Cards — horizontal scroll */}
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-[220px] md:w-[260px] shrink-0">
              <div className="skeleton h-72 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {products.map((p) => (
            <div key={p.id} className="w-[220px] md:w-[260px] shrink-0">
              <ProductCarouselCard product={{
                id: p.id,
                slug: p.slug,
                name: p.name,
                image: p.primary_image,
                price: Number(p.price),
                mrp: Number(p.mrp),
                rating: parseFloat(p.average_rating) || 0,
                review_count: p.review_count || 0,
                total_sold: p.total_sold || 0,
                short_description: p.short_description || '',
              }} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
