import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Breadcrumb from '@/components/ui/Breadcrumb';

const ProductFilters = dynamic(() => import('@/components/product/ProductFilters'), {
  loading: () => <div className="w-64 skeleton h-96 rounded-xl shrink-0" />,
});

const SearchResultsInner = dynamic(() => import('@/components/search/SearchResultsInner'), {
  loading: () => (
    <div className="flex-1">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-72 rounded-xl" />
        ))}
      </div>
    </div>
  ),
});

const SortDropdown = dynamic(() => import('@/components/product/SortDropdown'));

const ActiveFilterChips = dynamic(() => import('@/components/product/ActiveFilterChips'));

const TRENDING_TERMS = [
  'Alphonso Mangoes', 'Cashews', 'Spices', 'Coconut Oil', 'Seafood',
  'Organic Rice', 'Honey', 'Banana Chips', 'Pickles', 'Tea',
];

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const q = sp?.q || '';
  const title = q
    ? `Search results for "${q}"`
    : 'Search';
  const description = q
    ? `Browse search results for "${q}" at Konkan Bazaar. Shop authentic Konkan region products including Alphonso mangoes, cashews, spices, and more.`
    : 'Search for authentic Konkan region products including Alphonso mangoes, premium cashews, coastal seafood, spices, and organic rice.';

  return {
    title,
    description,
    keywords: [q, 'Konkan products', 'Alphonso mangoes', 'Goan cashews', 'search', 'buy online'].filter(Boolean),
    openGraph: {
      title,
      description,
      url: q ? `https://www.kokanghar.in/search?q=${encodeURIComponent(q)}` : 'https://www.kokanghar.in/search',
      siteName: 'Konkan Bazaar',
      locale: 'en_IN',
      type: 'website',
    },
    alternates: {
      canonical: q ? `https://www.kokanghar.in/search?q=${encodeURIComponent(q)}` : 'https://www.kokanghar.in/search',
    },
  };
}

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const query = sp?.q || '';

  return (
    <div className="container-custom py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[{ label: query ? `Search: "${query}"` : 'Search' }]} />

      {/* Trending / No Query State */}
      {!query && (
        <div className="text-center mb-8">
          <h2 className="font-display text-xl font-bold text-konkan-text-primary mb-4">
            Trending Searches
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {TRENDING_TERMS.map((term) => (
              <a
                key={term}
                href={`/search?q=${encodeURIComponent(term.toLowerCase())}`}
                className="px-4 py-2 bg-white rounded-full border border-konkan-sand text-sm text-konkan-text-secondary hover:border-konkan-green-primary hover:text-konkan-green-primary hover:bg-konkan-cream transition-all hover-lift"
              >
                {term}
              </a>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'Fresh Mangoes', href: '/search?q=mango' },
              { label: 'Premium Cashews', href: '/search?q=cashew' },
              { label: 'Konkan Spices', href: '/search?q=spice' },
              { label: 'Coastal Seafood', href: '/search?q=seafood' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="bg-white rounded-2xl card p-6 text-center hover-lift"
              >
                <p className="font-medium text-sm text-konkan-text-primary">{item.label}</p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {query && (
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <Suspense fallback={<div className="w-64 skeleton h-96 rounded-xl shrink-0 hidden lg:block" />}>
            <ProductFilters />
          </Suspense>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h1 className="font-display text-xl md:text-2xl font-bold text-konkan-text-primary">
                Results for &ldquo;{query}&rdquo;
              </h1>
              <Suspense fallback={<div className="skeleton h-10 w-48 rounded-lg" />}>
                <SortDropdown />
              </Suspense>
            </div>

            {/* Active Filter Chips */}
            <Suspense fallback={null}>
              <ActiveFilterChips />
            </Suspense>

            {/* Results Grid + Pagination */}
            <Suspense
              fallback={
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="skeleton h-72 rounded-xl" />
                  ))}
                </div>
              }
            >
              <SearchResultsInner />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
