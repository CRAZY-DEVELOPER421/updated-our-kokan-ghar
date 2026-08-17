import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import Breadcrumb from '@/components/ui/Breadcrumb';
import FlashSaleProgressBar from '@/components/ui/FlashSaleProgressBar';

const ProductImages = dynamic(() => import('@/components/product/ProductImages'));
const ProductReviews = dynamic(() => import('@/components/product/ProductReviews'), {
  loading: () => <div className="skeleton h-64 rounded-xl" />,
});
const BestsellerRow = dynamic(() => import('@/components/home/BestsellerRow'), {
  loading: () => <div className="skeleton h-64 rounded-xl" />,
});
const ProductTabs = dynamic(() => import('@/components/product/ProductDetailClient').then(m => m.ProductTabs));
const ProductActions = dynamic(() => import('@/components/product/ProductActions'), {
  loading: () => <div className="skeleton h-12 w-full rounded-xl" />,
});
const PincodeChecker = dynamic(() => import('@/components/product/ProductDetailClient').then(m => m.PincodeChecker));
const RecentlyViewed = dynamic(() => import('@/components/product/ProductDetailClient').then(m => m.RecentlyViewed));

async function getProduct(slug) {
  try {
    const res = await api.get(`/products/${slug}`);
    if (res.data?.data?.product) return res.data.data.product;
    return null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: `${product.name} | Buy Online`,
    description: product.meta_description || product.short_description?.slice(0, 160) || `Buy ${product.name} online from Konkan Bazaar. Authentic Konkan region product.`,

    openGraph: {
      title: `${product.name}`,
      description: product.short_description?.slice(0, 160),
      images: product.images?.[0]?.image_url ? [{ url: product.images[0].image_url }] : [],
      url: `https://www.kokanghar.in/products/${slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name}`,
      description: product.short_description?.slice(0, 160),
    },
    alternates: { canonical: `https://www.kokanghar.in/products/${slug}` },
  };
}

export default async function ProductDetailPage({ params }) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return (
      <div className="container-custom py-16 text-center">
        <div className="mb-4 flex justify-center">
          <svg className="w-12 h-12 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-konkan-text-primary mb-2">Product Not Found</h1>
        <p className="text-konkan-text-secondary">The product you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description,
    image: product.images?.[0]?.image_url,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand || 'Konkan Bazaar' },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'INR',
      availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      url: `https://www.kokanghar.in/products/${slug}`,
    },
    aggregateRating: product.review_count > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.average_rating,
      reviewCount: product.review_count,
    } : undefined,
  };

  return (
    <div className="container-custom py-6 md:py-8 animate-fade-in">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      <Breadcrumb items={[
        { label: 'Products', href: '/products' },
        { label: product.category_name, href: `/categories/${product.category_slug}` },
        { label: product.name },
      ]} />

      {/* Product Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 mb-10 items-start">
        {/* Left: Image Gallery — sticky on desktop */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<div className="aspect-square skeleton rounded-2xl" />}>
            <ProductImages images={product.images || []} name={product.name} />
          </Suspense>
        </div>

        {/* Right: Product Info */}
        <div className="space-y-5">
          <div>
            {product.brand && (
              <span className="text-xs font-medium text-konkan-green-primary uppercase tracking-wider">{product.brand}</span>
            )}
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-konkan-text-primary mt-1">
              {product.name}
            </h1>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <Suspense fallback={<div className="skeleton h-5 w-32" />}>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className={`w-4 h-4 ${star <= Math.round(product.average_rating || 0) ? 'text-konkan-gold' : 'text-konkan-sand'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </Suspense>
            <span className="text-sm font-medium text-konkan-text-primary">{parseFloat(product.average_rating || 0).toFixed(1)}</span>
            <span className="text-sm text-konkan-text-secondary">({product.review_count || 0} reviews)</span>
            <span className="text-sm text-konkan-text-secondary">|</span>
            <span className="text-sm text-konkan-success">{product.total_sold || 0} sold</span>
          </div>

          {/* Short Description */}
          {product.short_description && (
            <p className="text-konkan-text-secondary leading-relaxed">{product.short_description}</p>
          )}

          {/* Flash sale scarcity bar — "X% sold — Only Y left" (real data) */}
          {product.flash_sale && Number(product.flash_sale.quantity_limit) > 0 && (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 mb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-red-600 mb-1.5">
                ⚡ Flash Sale — limited stock
              </p>
              <FlashSaleProgressBar
                soldCount={product.flash_sale.sold_count}
                quantityLimit={product.flash_sale.quantity_limit}
              />
            </div>
          )}

          {/* Buy box: dynamic price (incl. selected variant) + variant selector +
              quantity + Add to Cart / Buy Now — one connected component */}
          <Suspense fallback={<div className="skeleton h-40 w-full rounded-xl" />}>
            <ProductActions
              product={product}
              stockQuantity={product.stock_quantity}
              variants={product.variants || []}
            />
          </Suspense>

          {/* Delivery Info */}
          <div className="border-t border-konkan-sand/50 pt-4 space-y-3">
            <Suspense fallback={<div className="skeleton h-10 w-full rounded-lg" />}>
              <PincodeChecker />
            </Suspense>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-konkan-text-secondary">
                <svg className="w-4 h-4 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {product.free_delivery ? 'Free delivery' : 'Delivery charges apply'}
              </div>
              <div className="flex items-center gap-2 text-konkan-text-secondary">
                <svg className="w-4 h-4 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                100% Authentic
              </div>
              <div className="flex items-center gap-2 text-konkan-text-secondary">
                <svg className="w-4 h-4 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                7-day returns
              </div>
              <div className="flex items-center gap-2 text-konkan-text-secondary">
                <svg className="w-4 h-4 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Est. delivery:{' '}
                {product.delivery_estimate === 'today' ? 'Today'
                  : product.delivery_estimate === 'tomorrow' ? 'Tomorrow'
                  : product.delivery_estimate || '3-5 days'}
              </div>
            </div>
          </div>

          {/* Tabs — inside right column on desktop */}
          <div className="border-t border-konkan-sand/50 pt-6">
            <ProductTabs product={product} />
          </div>

          {/* Reviews — inside right column on desktop */}
          <div id="reviews" className="border-t border-konkan-sand/50 pt-6">
            <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
              <ProductReviews productId={product.id} ratingStats={product.rating_stats} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mb-10">
        <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
          <BestsellerRow title="Customers Also Bought" subtitle="Products related to this item" />
        </Suspense>
      </div>

      {/* Recently Viewed */}
      <RecentlyViewed />
    </div>
  );
}


