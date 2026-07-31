import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Breadcrumb from '@/components/ui/Breadcrumb';

const ProductFilters = dynamic(() => import('@/components/product/ProductFilters'), {
  loading: () => <div className="w-64 skeleton h-96 rounded-xl shrink-0" />,
});

const ProductGridInner = dynamic(() => import('@/components/product/ProductGridInner'), {
  loading: () => (
    <div className="flex-1">
      <div className="skeleton h-96 rounded-xl" />
    </div>
  ),
});

const SortDropdown = dynamic(() => import('@/components/product/SortDropdown'));

const ActiveFilterChips = dynamic(() => import('@/components/product/ActiveFilterChips'));

const MobileFilterToolbar = dynamic(() => import('@/components/product/MobileFilterToolbar'), {
  loading: () => <div className="lg:hidden skeleton h-10 rounded-xl mb-3" />,
});

export const metadata = {
  title: 'Shop All Products',
  description: 'Browse our complete collection of authentic Konkan region products including Alphonso mangoes, premium cashews, coastal seafood, traditional spices, and organic rice. Direct from farmers and artisans.',
  keywords: ['Konkan products', 'Alphonso mangoes', 'Goan cashews', 'Konkan spices', 'organic', 'buy online', 'Kokan Ghar'],
  openGraph: {
    title: 'Shop All Products',
    description: 'Browse authentic Konkan region products. Direct from farmers and artisans.',
    url: 'https://www.kokanghar.in/products',
    siteName: 'Kokan Ghar',
    images: [{ url: '/images/og-products.jpg', width: 1200, height: 630 }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shop All Products',
    description: 'Browse authentic Konkan region products.',
  },
  alternates: { canonical: 'https://www.kokanghar.in/products' },
};

export default async function ProductsPage({ searchParams }) {
  const sp = await searchParams;
  const page = parseInt(sp.page) || 1;
  const sort = sp.sort || 'relevance';
  const category = sp.category || '';
  const q = sp.q || '';
  const minPrice = sp.min_price || '';
  const maxPrice = sp.max_price || '';
  const rating = sp.rating || '';
  const organic = sp.organic || '';
  const seasonal = sp.seasonal || '';
  const bestseller = sp.bestseller || '';
  const discount = sp.discount || '';

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[{ label: 'All Products', href: '/products' }]} />

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <Suspense fallback={<div className="w-[300px] skeleton h-96 rounded-2xl shrink-0" />}>
          <ProductFilters />
        </Suspense>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile Filters + Sort Toolbar */}
          <Suspense fallback={<div className="lg:hidden skeleton h-10 rounded-xl mb-3" />}>
            <MobileFilterToolbar />
          </Suspense>

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="section-title">
                {category
                  ? category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
                  : 'All Products'}
              </h1>
              <p className="section-subtitle">
                Authentic Konkan products, delivered to your doorstep
              </p>
            </div>
            <div className="hidden lg:block">
              <Suspense fallback={<div className="skeleton h-10 w-48 rounded-xl" />}>
                <SortDropdown />
              </Suspense>
            </div>
          </div>

          {/* Active Filter Chips */}
          <Suspense fallback={null}>
            <ActiveFilterChips />
          </Suspense>

          {/* Product Grid + Pagination */}
          <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
            <ProductGridInner
              page={page}
              sort={sort}
              category={category}
              q={q}
              minPrice={minPrice}
              maxPrice={maxPrice}
              rating={rating}
              organic={organic}
              seasonal={seasonal}
              bestseller={bestseller}
              discount={discount}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
