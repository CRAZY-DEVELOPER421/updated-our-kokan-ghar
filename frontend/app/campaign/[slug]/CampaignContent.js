'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductCard from '@/components/product/ProductCard';
import { getImageUrl } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   Festive Campaign landing page — rendered at /campaign/[slug].
   Fully admin-built: page background, unlimited sections
   (products / story / blog / overview), each with its own
   background (color / image / video / transparent). Products
   render 5-per-row in a grid, or as a horizontal scroll row —
   both chosen per section from the admin panel.
   ───────────────────────────────────────────────────────────── */

// Normalize the flat background fields from the API into one object.
// Sections use bg_*; the campaign page uses page_bg_* — accept both.
const toBg = (o) => ({
  type: o?.bg_type || o?.page_bg_type || 'transparent',
  color: o?.bg_color || o?.page_bg_color || null,
  image: o?.bg_image || o?.page_bg_image || null,
  video: o?.bg_video || o?.page_bg_video || null,
});

/* ── Backgrounds ─────────────────────────────────────────── */

// Full-page background (absolute, covers the whole page start→end)
function PageBackground({ bg }) {
  if (!bg || bg.type === 'transparent' || !bg.type) return null;
  if (bg.type === 'color' && bg.color) {
    return <div className="absolute inset-0" style={{ backgroundColor: bg.color }} />;
  }
  if (bg.type === 'image' && bg.image) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${getImageUrl(bg.image)})` }}
      />
    );
  }
  if (bg.type === 'video' && bg.video) {
    return (
      <video
        className="absolute inset-0 w-full h-full object-cover"
        style={{ backgroundColor: '#111827' }}
        src={bg.video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    );
  }
  return null;
}

// Per-section background (absolute inside the section wrapper)
function SectionBackground({ bg }) {
  if (!bg || bg.type === 'transparent' || !bg.type) return null;
  if (bg.type === 'color' && bg.color) {
    return <div className="absolute inset-0" style={{ backgroundColor: bg.color }} />;
  }
  if (bg.type === 'image' && bg.image) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${getImageUrl(bg.image)})` }}
      />
    );
  }
  if (bg.type === 'video' && bg.video) {
    return (
      <video
        className="absolute inset-0 w-full h-full object-cover"
        style={{ backgroundColor: '#111827' }}
        src={bg.video}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    );
  }
  return null;
}

/* ── Countdown ───────────────────────────────────────────── */

function CampaignCountdown({ endTime, themeColor }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endTime) {
      setTimeLeft(null);
      return;
    }
    const calculate = () => {
      const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };
    setTimeLeft(calculate());
    const interval = setInterval(() => {
      const remaining = calculate();
      setTimeLeft(remaining);
      if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime || !timeLeft) return null;

  const pad = (num) => String(num).padStart(2, '0');
  const units = [
    { label: 'Days', value: pad(timeLeft.days) },
    { label: 'Hrs', value: pad(timeLeft.hours) },
    { label: 'Mins', value: pad(timeLeft.minutes) },
    { label: 'Secs', value: pad(timeLeft.seconds) },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {units.map((unit, idx) => (
        <div key={unit.label} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex flex-col items-center">
            <div
              className="min-w-[44px] sm:min-w-[52px] h-10 sm:h-11 rounded-lg flex items-center justify-center font-mono text-sm sm:text-base font-bold text-white shadow-md"
              style={{ backgroundColor: themeColor }}
            >
              {unit.value}
            </div>
            <span className="text-[9px] uppercase tracking-wide mt-1 text-white/80">{unit.label}</span>
          </div>
          {idx < units.length - 1 && (
            <span className="font-bold text-white/70 text-sm sm:text-base" style={{ color: `${themeColor}` }}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Section blocks ──────────────────────────────────────── */

function SectionHeader({ title, subtitle, themeColor, countLabel }) {
  if (!title && !subtitle && !countLabel) return null;
  return (
    <div className="mb-5 md:mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        {title && (
          <h2 className="font-display text-xl md:text-3xl font-bold text-konkan-text-primary">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-sm md:text-base text-konkan-text-secondary mt-1.5 max-w-2xl">{subtitle}</p>
        )}
      </div>
      {countLabel && (
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold"
          style={{ backgroundColor: `${themeColor}14`, color: themeColor }}
        >
          {countLabel}
        </span>
      )}
    </div>
  );
}

function ProductsBlock({ section, themeColor }) {
  const products = section.products || [];
  const isScroll = section.layout === 'scroll';

  if (products.length === 0) {
    return (
      <div className="bg-white/90 rounded-2xl card border border-dashed border-konkan-sand px-4 py-10 text-center">
        <p className="text-xs text-konkan-text-secondary">No products added to this section yet.</p>
      </div>
    );
  }

  if (isScroll) {
    return (
      <div>
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 -mx-4 px-4 lg:mx-0 lg:px-0 scrollbar-hide snap-x snap-mandatory">
          {products.map((product) => (
            <div key={product.id} className="min-w-[46%] sm:min-w-[230px] md:min-w-[250px] lg:min-w-[275px] snap-start shrink-0">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-konkan-text-secondary/70 mt-1 lg:hidden">
          ← Swipe to see more products →
        </p>
      </div>
    );
  }

  // Grid — 5 per row on desktop, extra products wrap below (no horizontal scroll)
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function BlogBlock({ section, themeColor }) {
  const blogs = section.blogs || [];
  if (blogs.length === 0) {
    return (
      <div className="bg-white/90 rounded-2xl card border border-dashed border-konkan-sand px-4 py-10 text-center">
        <p className="text-xs text-konkan-text-secondary">No blog posts linked to this section yet.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {blogs.map((blog) => (
        <Link
          key={blog.id}
          href={`/blog/${blog.slug}`}
          className="group bg-white rounded-2xl card overflow-hidden hover:shadow-card-hover transition-all"
        >
          {blog.hero_image ? (
            <div className="relative w-full h-44 overflow-hidden">
              <Image
                src={getImageUrl(blog.hero_image)}
                alt={blog.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
          ) : (
            <div
              className="h-24 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${themeColor}22, ${themeColor}0d)` }}
            >
              <span className="font-display text-4xl font-bold" style={{ color: themeColor }}>
                {(blog.category_name || 'B').charAt(0)}
              </span>
            </div>
          )}
          <div className="p-4">
            {blog.category_name && (
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: themeColor }}>
                {blog.category_name}
              </span>
            )}
            <h3 className="font-display text-base font-bold text-konkan-text-primary mt-1 group-hover:text-konkan-green-primary transition-colors line-clamp-2">
              {blog.title}
            </h3>
            {blog.excerpt && (
              <p className="text-xs text-konkan-text-secondary mt-1.5 line-clamp-2">{blog.excerpt}</p>
            )}
            <div className="flex items-center gap-3 mt-3 text-[10px] text-konkan-text-secondary">
              {blog.published_at && (
                <span>{new Date(blog.published_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              )}
              <span>{blog.view_count || 0} views</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ContentBlock({ section, themeColor }) {
  const content = section.content;
  if (!content || !content.trim()) {
    return (
      <div className="bg-white/90 rounded-2xl card border border-dashed border-konkan-sand px-4 py-10 text-center">
        <p className="text-xs text-konkan-text-secondary">This section has no content yet.</p>
      </div>
    );
  }

  const hasHtml = /<[a-z][\s\S]*>/i.test(content);
  const body = hasHtml ? (
    <div className="campaign-prose" dangerouslySetInnerHTML={{ __html: content }} />
  ) : (
    <p className="campaign-prose whitespace-pre-line">{content}</p>
  );

  // Overview sections get a highlighted card treatment; story is plain.
  if (section.section_type === 'overview') {
    return (
      <div
        className="rounded-2xl card bg-white p-6 md:p-8"
        style={{ borderTop: `4px solid ${themeColor}` }}
      >
        {body}
      </div>
    );
  }
  return body;
}

function SectionRenderer({ section, themeColor }) {
  const bg = toBg(section);
  return (
    <section className="relative overflow-hidden">
      <SectionBackground bg={bg} />
      <div className="relative container-custom py-8 md:py-12">
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          themeColor={themeColor}
          countLabel={
            section.section_type === 'products' && (section.products?.length || 0) > 0
              ? `${section.products.length} ${section.products.length === 1 ? 'product' : 'products'}`
              : section.section_type === 'blog' && (section.blogs?.length || 0) > 0
                ? `${section.blogs.length} ${section.blogs.length === 1 ? 'post' : 'posts'}`
                : null
          }
        />
        {section.section_type === 'products' && <ProductsBlock section={section} themeColor={themeColor} />}
        {section.section_type === 'blog' && <BlogBlock section={section} themeColor={themeColor} />}
        {(section.section_type === 'story' || section.section_type === 'overview') && (
          <ContentBlock section={section} themeColor={themeColor} />
        )}
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────── */

export default function CampaignContent({ campaign }) {
  const [bannerImg, setBannerImg] = useState(null);

  const themeColor = campaign.theme_color || '#2D6A4F';
  const sections = campaign.sections && campaign.sections.length ? campaign.sections : [];
  const pageBg = toBg(campaign);
  const hasPageBg = pageBg.type !== 'transparent';
  const hasBanner = !!(campaign.banner_image_url || campaign.mobile_banner_image_url);
  const endTime = campaign.ends_at;
  const isLive = useMemo(() => {
    if (!endTime) return true; // no end date → open-ended campaign
    return new Date(endTime).getTime() > Date.now();
  }, [endTime]);

  // Total products across all products sections
  const totalProducts = useMemo(
    () => sections.reduce((sum, s) => sum + (s.section_type === 'products' ? (s.products?.length || 0) : 0), 0),
    [sections]
  );

  // Desktop banner first, mobile banner as the fallback
  useEffect(() => {
    setBannerImg(getImageUrl(campaign.banner_image_url || campaign.mobile_banner_image_url));
  }, [campaign.banner_image_url, campaign.mobile_banner_image_url]);

  return (
    <div className={`relative min-h-screen animate-fade-in ${hasPageBg ? '' : 'bg-white'}`}>
      <PageBackground bg={pageBg} />

      <div className="relative">
        {/* ══ Hero ══ */}
        <section className="relative overflow-hidden">
          {/* Background: banner image, or theme-color gradient fallback */}
          <div
            className="absolute inset-0"
            style={
              hasBanner
                ? undefined
                : { background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}99 55%, #1B3B2F 100%)` }
            }
          >
            {hasBanner && bannerImg && (
              <Image
                src={bannerImg}
                alt={campaign.name}
                fill
                priority
                sizes="100vw"
                className="object-cover"
                onError={() => setBannerImg(getImageUrl(campaign.mobile_banner_image_url))}
              />
            )}
          </div>
          {/* Readability overlay on top of images */}
          {hasBanner && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />}
          {/* Festive glow circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="container-custom relative flex flex-col justify-end min-h-[320px] sm:min-h-[380px] md:min-h-[440px] pb-8 md:pb-12 pt-10">
            <Breadcrumb
              light
              items={[
                { label: 'Offers & Deals', href: '/offers' },
                { label: campaign.name },
              ]}
            />

            {/* Festive badge */}
            <span
              className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white shadow-sm mt-4"
              style={{ backgroundColor: themeColor }}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1l2.4 7.6L22 11l-7.6 2.4L12 21l-2.4-7.6L2 11l7.6-2.4L12 1z" />
              </svg>
              Festive Collection
            </span>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-3 leading-tight drop-shadow-md">
              {campaign.name}
            </h1>

            {campaign.tagline && (
              <p className="text-sm sm:text-base text-white/90 mt-2 max-w-2xl leading-relaxed drop-shadow">
                {campaign.tagline}
              </p>
            )}

            {/* Countdown + product count row */}
            <div className="flex flex-wrap items-end justify-between gap-4 mt-6">
              {isLive && endTime ? (
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-white/80 mb-2">
                    Offer ends in
                  </p>
                  <CampaignCountdown endTime={endTime} themeColor={themeColor} />
                </div>
              ) : (
                !isLive && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    This campaign has ended
                  </span>
                )
              )}

              {totalProducts > 0 && (
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur px-3.5 py-2 rounded-full">
                  <span className="text-white font-bold text-sm">{totalProducts}</span>
                  <span className="text-white/85 text-xs">curated {totalProducts === 1 ? 'product' : 'products'}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ══ Description strip ══ */}
        {campaign.description && (
          <div className="border-b border-konkan-sand/50 bg-konkan-cream/40">
            <div className="container-custom py-4 md:py-5">
              <p className="text-sm md:text-[15px] text-konkan-text-secondary leading-relaxed max-w-4xl">
                {campaign.description}
              </p>
            </div>
          </div>
        )}

        {/* ══ Admin-built sections ══ */}
        {sections.length === 0 ? (
          <section className="container-custom py-12">
            <div className="bg-white rounded-2xl card border border-dashed border-konkan-sand px-4 py-14 text-center">
              <div className="w-12 h-12 rounded-xl mx-auto flex items-center justify-center" style={{ backgroundColor: `${themeColor}1A`, color: themeColor }}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-konkan-text-primary mt-3">Products coming soon</h3>
              <p className="text-xs text-konkan-text-secondary mt-1 max-w-sm mx-auto">
                The admin is curating this festive collection. Check back shortly!
              </p>
            </div>
          </section>
        ) : (
          sections.map((section, idx) => (
            <SectionRenderer key={section.id || `legacy-${idx}`} section={section} themeColor={themeColor} />
          ))
        )}

        {/* ══ Bottom CTA ══ */}
        <section className="container-custom pb-10 pt-2">
          <div
            className="rounded-2xl px-5 py-8 text-center overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 60%, #1B3B2F 100%)` }}
          >
            <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <h2 className="font-display text-xl md:text-2xl font-bold text-white">
              Celebrate with authentic Konkan flavours
            </h2>
            <p className="text-sm text-white/85 mt-2 max-w-xl mx-auto">
              From {campaign.name.toLowerCase()} essentials to everyday pantry staples — explore the full range.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-sm font-bold shadow-lg active:scale-95 transition-transform mt-5"
              style={{ color: themeColor }}
            >
              Shop All Products
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
