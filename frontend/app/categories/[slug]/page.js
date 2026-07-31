import { Suspense } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';

const ProductFilters = dynamic(() => import('@/components/product/ProductFilters'), {
  loading: () => <div className="w-64 skeleton h-96 rounded-xl shrink-0" />,
});

const ProductGridInner = dynamic(() => import('@/components/product/ProductGridInner'), {
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getCategory(slug) {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, {
      next: { revalidate: 300 }, // cache for 5 minutes
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.category || data.data || null;
  } catch {
    return null;
  }
}

const FALLBACK_DESCRIPTIONS = {
  'konkan-mangoes-fruits': {
    name: 'Konkan Mangoes & Fruits',
    description: 'Discover the world-famous Alphonso (Hapus) mangoes from the Ratnagiri and Devgad regions of the Konkan coast. Our collection also includes seasonal local fruits like jackfruit, Kokum, and Jamun, all sourced directly from family-run orchards.',
    image: null,
  },
  'cashew-dry-fruits': {
    name: 'Cashews & Dry Fruits',
    description: 'Premium Goan cashews — W180, W240, W320, and W450 grades — roasted or raw, salted or honey-glazed. Also explore our selection of dried coconut, dates, and traditional Konkan dry fruit mixes.',
    image: null,
  },
  'coastal-seafood': {
    name: 'Coastal Seafood',
    description: 'Fresh and dried seafood delicacies from the Arabian Sea coast. Choose from dried Bombay duck (Bombil), prawns, mackerel, squid, and traditional Konkan fish curry masalas that bring the taste of the coast to your kitchen.',
    image: null,
  },
  'traditional-spices': {
    name: 'Traditional Spices & Masalas',
    description: 'Aromatic spices grown in the Konkan region — black pepper from the Western Ghats, turmeric from Goa, and traditional spice blends like Goda Masala, Kolhapuri Masala, and Malvani Masala. Pure, unadulterated, and full of flavour.',
    image: null,
  },
  'organic-rice-grains': {
    name: 'Organic Rice & Grains',
    description: 'Traditional Konkan rice varieties including Govindbhog, Ambemohar, and brown rice grown using organic farming methods. Also explore local grains, pulses, and millets that form the staple diet of the Konkan region.',
    image: null,
  },
  'konkan-rice-varieties': {
    name: 'Konkan Rice',
    description: 'Traditional Konkan rice varieties including Govindbhog, Ambemohar, and brown rice grown using organic farming methods. Also explore local grains, pulses, and millets that form the staple diet of the Konkan region.',
    image: null,
  },
  'coconut-products': {
    name: 'Coconut Products',
    description: 'Pure cold-pressed coconut oil, virgin coconut oil, dried coconut (kopra), and traditional coconut-based products from the coconut groves of the Konkan coast. Known for their purity and traditional extraction methods.',
    image: null,
  },
  'traditional-sweets': {
    name: 'Traditional Sweets & Snacks',
    description: 'Authentic Konkani sweets and snacks made using traditional family recipes. Choose from Kaju Katli, Bebinca, Chiroti, banana chips, jackfruit chips, and other traditional treats that capture the essence of Konkan cuisine.',
    image: null,
  },
  'honey-health-foods': {
    name: 'Honey & Health Foods',
    description: 'Pure, raw honey sourced from the Western Ghats, including wild forest honey and multi-floral honey. Also explore Ayurvedic superfoods, herbal powders, and traditional health supplements unique to the Konkan region.',
    image: null,
  },
  'handicrafts-textiles': {
    name: 'Konkan Handicrafts & Textiles',
    description: 'Handcrafted products from the artisans of the Konkan region. Explore Chitari woodwork, bamboo crafts, traditional Goan pottery, and unique handloom textiles that showcase the rich cultural heritage of the Konkan coast.',
    image: null,
  },
  'beverages': {
    name: 'Beverages & Drinks',
    description: 'Traditional Konkan beverages including tender coconut water, Kokum sharbat, Sol Kadhi mix, and herbal teas from the Western Ghats. Refresh yourself with the authentic tastes of the Konkan coast.',
    image: null,
  },
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);
  const fallback = FALLBACK_DESCRIPTIONS[slug];

  const name = category?.name || fallback?.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const description = category?.description || fallback?.description || `Browse our collection of ${name} at Konkan Bazaar. Shop authentic Konkan region products sourced directly from farmers and artisans.`;
  return {
    title: `${name}`,
    description,
    openGraph: {
      title: `${name}`,
      description,
      url: `https://www.kokanghar.in/categories/${slug}`,
      siteName: 'Konkan Bazaar',
      images: category?.image ? [{ url: category.image, width: 1200, height: 630 }] : undefined,
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name}`,
      description,
    },
    alternates: { canonical: `https://www.kokanghar.in/categories/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.page) || 1;
  const sort = sp.sort || 'relevance';
  const minPrice = sp.min_price || '';
  const maxPrice = sp.max_price || '';
  const rating = sp.rating || '';
  const organic = sp.organic || '';
  const seasonal = sp.seasonal || '';
  const bestseller = sp.bestseller || '';
  const discount = sp.discount || '';

  // Fetch category data from API (with fallback)
  const category = await getCategory(slug);
  const fallback = FALLBACK_DESCRIPTIONS[slug];

  const categoryName = category?.name || fallback?.name || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const categoryDescription = category?.description || fallback?.description || '';
  const categoryImage = category?.image || null;
  const productCount = category?.product_count || null;

  // If category doesn't exist on API and no fallback, show 404-like state
  const notFound = !category && !fallback;

  if (notFound) {
    return (
      <div className="container-custom py-16 text-center animate-fade-in">
        <div className="mb-4 flex justify-center">
          <svg className="w-12 h-12 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-konkan-text-primary mb-2">Category not found</h1>
        <p className="text-konkan-text-secondary mb-6">The category you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/products" className="btn-primary inline-flex">Browse All Products</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className={`relative ${categoryImage ? 'h-48 md:h-64' : 'bg-gradient-to-r from-konkan-green-dark via-konkan-green-primary to-konkan-green-secondary'}`}>
        {categoryImage && (
          <Image src={categoryImage} alt={categoryName} fill sizes="100vw" className="object-cover" />
        )}
        <div className={`absolute inset-0 ${categoryImage ? 'bg-gradient-to-t from-black/70 via-black/40 to-transparent' : ''}`} />
        <div className="container-custom relative h-full flex flex-col justify-end pb-6 md:pb-8">
          <Breadcrumb
            light
            items={[
              { label: 'Products', href: '/products' },
              { label: categoryName },
            ]}
          />
          <h1 className="font-display text-2xl md:text-4xl font-bold text-white mt-2">
            {categoryName}
          </h1>
          {productCount !== null && (
            <p className="text-sm text-white/80 mt-1">{productCount} products</p>
          )}
        </div>
      </div>

      {/* Description */}
      {categoryDescription && (
        <div className="bg-white border-b border-konkan-sand/50">
          <div className="container-custom py-4 md:py-6">
            <p className="text-sm md:text-base text-konkan-text-secondary leading-relaxed max-w-4xl">
              {categoryDescription}
            </p>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="container-custom py-6 md:py-8">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <Suspense fallback={<div className="w-64 skeleton h-96 rounded-xl shrink-0 hidden lg:block" />}>
            <ProductFilters />
          </Suspense>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-konkan-text-primary">
                  {categoryName}
                </h2>
                <p className="text-sm text-konkan-text-secondary mt-1">
                  {productCount ? `${productCount} products available` : 'Authentic Konkan products, delivered to your doorstep'}
                </p>
              </div>
              <Suspense fallback={<div className="skeleton h-10 w-48 rounded-lg" />}>
                <SortDropdown />
              </Suspense>
            </div>

            {/* Active Filter Chips */}
            <Suspense fallback={null}>
              <ActiveFilterChips />
            </Suspense>

            {/* Product Grid + Pagination */}
            <Suspense fallback={
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton h-72 rounded-xl" />
                ))}
              </div>
            }>
              <ProductGridInner
                page={page}
                sort={sort}
                category={slug}
                q=""
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
    </div>
  );
}
