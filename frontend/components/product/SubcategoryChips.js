'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Horizontal subcategory quick-filter chips for category / PLP pages.
 *
 * Props:
 *   categorySlug — the parent category slug (e.g. "konkan-mangoes-fruits")
 *
 * Behaviour:
 *   • Fetches children from GET /categories/:slug
 *   • Renders a scrollable row:  [All] [Alphonso] [Kesar] [Pairi] …
 *   • Active chip is highlighted; clicking toggles ?sub=slug in the URL.
 *   • "All" chip removes ?sub entirely (shows all products in the parent).
 *   • No children → renders nothing.
 */
export default function SubcategoryChips({ categorySlug }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSub = searchParams.get('sub') || '';

  const { data: category, isLoading } = useQuery({
    queryKey: ['subcategory-chips', categorySlug],
    queryFn: async () => {
      const res = await api.get(`/categories/${categorySlug}`);
      return res.data.data?.category || null;
    },
    staleTime: 300000, // 5 min
    enabled: !!categorySlug,
  });

  const children = category?.children || [];

  // Don't render if no subcategories or still loading
  if (!isLoading && children.length === 0) return null;

  const buildUrl = (subSlug) => {
    const params = new URLSearchParams(searchParams.toString());
    if (subSlug) {
      params.set('sub', subSlug);
    } else {
      params.delete('sub');
    }
    params.delete('page'); // reset to page 1 on filter change
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const handleClick = (subSlug) => {
    router.push(buildUrl(subSlug), { scroll: false });
  };

  return (
    <div className="mb-4">
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Loading skeleton */}
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="shrink-0 h-9 w-24 rounded-full bg-konkan-sand/50 animate-pulse"
            />
          ))}

        {/* "All" chip */}
        {!isLoading && (
          <button
            onClick={() => handleClick('')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
              !activeSub
                ? 'bg-konkan-green-primary text-white border-konkan-green-primary shadow-sm'
                : 'bg-white text-konkan-text-primary border-konkan-sand hover:border-konkan-green-primary/40 hover:text-konkan-green-primary'
            }`}
          >
            All
          </button>
        )}

        {/* Subcategory chips */}
        {!isLoading &&
          children.map((child) => {
            const isActive = activeSub === child.slug;
            return (
              <button
                key={child.id}
                onClick={() => handleClick(child.slug)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  isActive
                    ? 'bg-konkan-green-primary text-white border-konkan-green-primary shadow-sm'
                    : 'bg-white text-konkan-text-primary border-konkan-sand hover:border-konkan-green-primary/40 hover:text-konkan-green-primary'
                }`}
              >
                {child.name}
                {child.product_count > 0 && (
                  <span
                    className={`ml-1.5 text-xs ${
                      isActive ? 'text-white/70' : 'text-konkan-text-secondary/50'
                    }`}
                  >
                    ({child.product_count})
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}
