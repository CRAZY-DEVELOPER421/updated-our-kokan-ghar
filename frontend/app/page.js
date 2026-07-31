import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Above-fold components
import CategoryGrid from '@/components/home/CategoryGrid';
import { TrustBadges, BlogPreview } from '@/components/home/HomeContent';
import MobileHero from '@/components/home/MobileHero';
import MobileCategoryGrid from '@/components/home/MobileCategoryGrid';
import MobileFlashSale from '@/components/home/MobileFlashSale';
import DealsUnder999 from '@/components/home/DealsUnder999';
import AllUnder499 from '@/components/home/AllUnder499';
import MobileProductRow from '@/components/home/MobileProductRow';
import DiscoverForYou from '@/components/home/DiscoverForYou';
import MobilePromoBanner from '@/components/home/MobilePromoBanner';
import MobileTestimonials from '@/components/home/MobileTestimonials';
import MobileBlogSection from '@/components/home/MobileBlogSection';
import MobileHelpContact from '@/components/home/MobileHelpContact';
import MobileNewsletter from '@/components/home/MobileNewsletter';

// HeroSlider — dynamically imported (desktop only) to avoid swiper CSS render-blocking
const HeroSlider = dynamic(() => import('@/components/home/HeroSlider'), {
  loading: () => <div className="skeleton h-[250px] lg:h-[500px] w-full rounded-2xl" />,
});

// Dynamic imports for below-fold components
const FlashSaleTimer = dynamic(() => import('@/components/home/FlashSaleTimer'), {
  loading: () => <div className="skeleton h-80 rounded-2xl" />,
});

const DealsUnder999Desktop = dynamic(() => import('@/components/home/DealsUnder999Desktop'), {
  loading: () => <div className="skeleton h-64 rounded-2xl" />,
});

const AllUnder499Desktop = dynamic(() => import('@/components/home/AllUnder499Desktop'), {
  loading: () => <div className="skeleton h-80 rounded-2xl" />,
});

const BestsellerRow = dynamic(() => import('@/components/home/BestsellerRow'), {
  loading: () => <div className="skeleton h-64 rounded-2xl" />,
});

const OfferBanners = dynamic(() => import('@/components/home/OfferBanners'), {
  loading: () => <div className="skeleton h-40 rounded-2xl" />,
});

const TestimonialsSection = dynamic(() => import('@/components/home/TestimonialsSection'), {
  loading: () => <div className="skeleton h-64 rounded-2xl" />,
});

const NewsletterSection = dynamic(() => import('@/components/home/NewsletterSection'), {
  loading: () => <div className="skeleton h-48 rounded-2xl" />,
});

const DiscoverForYouDesktop = dynamic(() => import('@/components/home/DiscoverForYouDesktop'), {
  loading: () => <div className="skeleton h-80 rounded-2xl" />,
});

export const metadata = {
  title: 'Kokan Ghar - Authentic Konkan Products Online',
  description: 'Shop authentic Konkan region products including Alphonso mangoes, cashews, spices, seafood, and traditional delicacies. Direct from farmers and artisans of the Konkan coast.',
  openGraph: {
    title: 'Kokan Ghar - Authentic Konkan Products Online',
    description: 'Shop authentic Konkan region products. Direct from farmers and artisans of the Konkan coast.',
    url: 'https://www.kokanghar.in',
    siteName: 'Kokan Ghar',
    images: [{ url: '/images/og-home.jpg', width: 1200, height: 630 }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kokan Ghar - Authentic Konkan Products Online',
    description: 'Shop authentic Konkan region products. Direct from farmers and artisans.',
  },
};

export default function HomePage() {
  return (
    <div className="space-y-3 md:space-y-6 pb-3 md:pb-6">
      {/* Section 1: Hero Slider — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 md:pt-6">
        <HeroSlider />
      </section>

      {/* ── MOBILE SECTIONS ── */}

      {/* Section 3: Mobile Hero */}
      <section className="lg:hidden">
        <MobileHero />
      </section>

      {/* Section 4: Shop by Category (mobile) */}
      <div className="lg:hidden">
        <MobileCategoryGrid />
      </div>

      {/* Trust Badges — desktop only (hidden on mobile) */}
      <div className="hidden lg:block">
        <TrustBadges />
      </div>

      {/* Section 5: Flash Sale (mobile) */}
      <div className="lg:hidden">
        <MobileFlashSale />
      </div>

      {/* 🆕 Section 6: Deals Under ₹999 (mobile) */}
      <div className="lg:hidden">
        <DealsUnder999 />
      </div>

      {/* Section 7: Bestsellers (mobile) */}
      <div className="lg:hidden">
        <MobileProductRow
          title="Bestsellers"
          viewAllHref="/products?sort=bestseller"
          queryKey={['bestsellers', 'mobile']}
          apiEndpoint="/products/bestsellers"
        />
      </div>

      {/* 🆕 All Under ₹499 (mobile) */}
      <div className="lg:hidden">
        <AllUnder499 />
      </div>

      {/* Section 9: Promo Banner (mobile) */}
      <div className="lg:hidden">
        <MobilePromoBanner />
      </div>

      {/* Section 8: New Arrivals (mobile) */}
      <div className="lg:hidden">
        <MobileProductRow
          title="New Arrivals"
          viewAllHref="/products?sort=new"
          queryKey={['new-arrivals', 'mobile']}
          apiEndpoint="/products/new-arrivals"
        />
      </div>

      {/* 🆕 Discover Products For You (mobile) */}
      <div className="lg:hidden">
        <DiscoverForYou />
      </div>

      {/* Section 10: Testimonials (mobile) */}
      <div className="lg:hidden">
        <MobileTestimonials />
      </div>

      {/* Section 11: Blog (mobile) */}
      <div className="lg:hidden">
        <MobileBlogSection />
      </div>

      {/* Section 12: Newsletter (mobile) */}
      <div className="lg:hidden">
        <MobileNewsletter />
      </div>

      {/* Section 13: Help/Contact (mobile) */}
      <div className="lg:hidden">
        <MobileHelpContact />
      </div>

      {/* ── DESKTOP & SHARED SECTIONS ── */}

      {/* Categories Grid — desktop only (mobile has its own CategoryGrid above) */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 max-[768px]:hidden">
        <CategoryGrid />
      </section>

      {/* Flash Sale — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-80 rounded-2xl" />}>
          <FlashSaleTimer />
        </Suspense>
      </section>

      {/* 🆕 Deals Under ₹999 — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
          <DealsUnder999Desktop />
        </Suspense>
      </section>

      {/* Bestsellers — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
          <BestsellerRow />
        </Suspense>
      </section>

      {/* 🆕 All Under ₹499 — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-80 rounded-2xl" />}>
          <AllUnder499Desktop />
        </Suspense>
      </section>

      {/* Promotional Banners — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-40 rounded-2xl" />}>
          <OfferBanners />
        </Suspense>
      </section>

      {/* Seasonal Picks — HIDDEN (not in reference design) */}
      {/* <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-96 rounded-2xl" />}>
          <SeasonalSection />
        </Suspense>
      </section> */}

      {/* New Arrivals — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
          <BestsellerRow
            title="New Arrivals"
            subtitle="Freshly stocked — the latest from Konkan"
          />
        </Suspense>
      </section>

      {/* 🆕 Discover Products For You — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-80 rounded-2xl" />}>
          <DiscoverForYouDesktop />
        </Suspense>
      </section>

      {/* Why Choose Us — HIDDEN (not in reference design) */}
      {/* <WhyChooseUs /> */}

      {/* Testimonials — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
          <TestimonialsSection />
        </Suspense>
      </section>

      {/* Blog Preview — desktop only */}
      <div className="hidden lg:block">
        <BlogPreview />
      </div>

      {/* Newsletter — desktop only */}
      <section className="hidden lg:block max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="skeleton h-48 rounded-2xl" />}>
          <NewsletterSection />
        </Suspense>
      </section>
    </div>
  );
}
