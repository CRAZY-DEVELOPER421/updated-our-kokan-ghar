'use client';

import Link from 'next/link';
import { ArrowRight, ShoppingBag, Shield, Leaf, Zap, Truck, Users, RefreshCw, Lock } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/I18nProvider';

const trustBadges = [
  { icon: Truck, titleKey: 'Free Delivery', subtitleKey: 'Above ₹499' },
  { icon: Leaf, titleKey: '100% Natural', subtitleKey: 'No preservatives' },
  { icon: Users, titleKey: 'Direct from Farmers', subtitleKey: 'No middlemen' },
  { icon: RefreshCw, titleKey: 'Easy Returns', subtitleKey: 'Within 7 days' },
  { icon: Lock, titleKey: 'Secure Payments', subtitleKey: 'Razorpay protected' },
];

const whyChooseUs = [
  { icon: ShoppingBag, titleKey: 'Direct from Farm', descKey: 'Sourced directly from local farmers and artisans in Konkan villages.' },
  { icon: Shield, titleKey: 'No Preservatives', descKey: 'Pure, natural products with no artificial additives or chemicals.' },
  { icon: Leaf, titleKey: 'Certified Organic', descKey: 'Many of our products are certified organic by recognized bodies.' },
  { icon: Zap, titleKey: 'Fast Delivery', descKey: 'Carefully packed and delivered across India within 3-5 days.' },
];

const blogPosts = [
  {
    slug: 'alphonso-mango-season-guide',
    titleKey: 'The Journey of Alphonso: From Devgad to Your Plate',
    excerptKey: 'Discover how the King of Mangoes travels from the orchards of Devgad to mango lovers across the world.',
    date: 'Mar 15, 2024',
    readTime: '5 min read',
    category: 'Mangoes',
    gradient: 'from-konkan-saffron/20 to-amber-900/20',
    icon: 'mango',
  },
  {
    slug: 'traditional-konkan-recipes',
    titleKey: '5 Traditional Konkan Monsoon Snacks You Must Try',
    excerptKey: 'From crispy bhajjis to steaming masala chai, here are the essential Konkan snacks for rainy days.',
    date: 'Jun 10, 2024',
    readTime: '4 min read',
    category: 'Food & Culture',
    gradient: 'from-konkan-ocean/20 to-blue-900/20',
    icon: 'coffee',
  },
  {
    slug: 'goan-cashew-shopping-guide',
    titleKey: 'How to Choose the Best Goan Cashews: W180 vs W320 vs W450',
    excerptKey: 'Not all cashews are created equal. Learn the difference between cashew grades and which one is perfect for your kitchen.',
    date: 'Apr 22, 2024',
    readTime: '6 min read',
    category: 'Cashews',
    gradient: 'from-konkan-green-primary/20 to-green-900/20',
    icon: 'rice',
  },
];

export function TrustBadges() {
  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Mobile: horizontal scroll with snap — Desktop: 5-column grid */}
      <div className="flex md:grid gap-3 md:gap-4 overflow-x-auto md:overflow-visible md:grid-cols-5 snap-x snap-mandatory scrollbar-hide pb-1 md:pb-0">
        {trustBadges.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <div key={idx} className="flex items-center gap-3 rounded-2xl p-3 md:p-4 card border border-konkan-sand/30 flex-shrink-0 snap-start min-w-[155px] md:min-w-0">
              <div className="w-10 h-10 rounded-xl bg-konkan-green-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-konkan-green-primary" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-konkan-text-primary">{badge.titleKey}</h3>
                <p className="text-[10px] md:text-xs text-konkan-text-secondary">{badge.subtitleKey}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function WhyChooseUs() {
  const { t } = useTranslation();

  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h2 className="section-title">Why Kokan Ghar?</h2>
        <p className="section-subtitle">We bring the authentic taste of Konkan to your doorstep</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {whyChooseUs.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="text-center p-6 rounded-2xl card hover:shadow-card-hover transition-all duration-300 border border-konkan-sand/30">
              <div className="w-12 h-12 rounded-xl bg-konkan-green-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon className="w-6 h-6 text-konkan-green-primary" />
              </div>
              <h3 className="font-display font-bold text-konkan-text-primary mb-2">{item.titleKey}</h3>
              <p className="text-xs md:text-sm text-konkan-text-secondary">{item.descKey}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function BlogPreview() {
  const { t } = useTranslation();

  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="section-title">From the Konkan Blog</h2>
          <p className="section-subtitle">Stories, recipes, and traditions from the coast</p>
        </div>
        <Link href="/blog" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-konkan-green-primary hover:text-konkan-green-secondary transition-colors">
          {t('common.view_all')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {blogPosts.map((post, idx) => (
          <Link
            key={idx}
            href={`/blog/${post.slug}`}
            className="rounded-2xl overflow-hidden card hover:shadow-card-hover transition-all duration-300 group border border-konkan-sand/30"
          >
            <div className={`h-48 bg-gradient-to-br ${post.gradient} flex items-center justify-center`}>
              {post.icon === 'mango' ? (
                <ShoppingBag className="w-12 h-12 text-konkan-saffron opacity-60" />
              ) : post.icon === 'coffee' ? (
                <svg className="w-12 h-12 text-konkan-ocean opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm4-6v3m4-3v3m4-3v3" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-konkan-gold opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 text-xs text-[#8A8A8A] mb-2">
                <span className="px-2 py-0.5 bg-konkan-cream rounded-full font-medium text-konkan-green-primary">
                  {post.category}
                </span>
                <span>{post.date}</span>
                <span>·</span>
                <span>{post.readTime}</span>
              </div>
              <h3 className="font-display font-bold text-konkan-text-primary mb-2 group-hover:text-konkan-green-primary transition-colors line-clamp-2">
                {post.titleKey}
              </h3>
              <p className="text-sm text-konkan-text-secondary line-clamp-2">{post.excerptKey}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-6 md:hidden">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-konkan-green-primary hover:text-konkan-green-secondary transition-colors">
          {t('common.view_all')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

export default function HomeContent() {
  return (
    <>
      <TrustBadges />
      <WhyChooseUs />
      <BlogPreview />
    </>
  );
}
