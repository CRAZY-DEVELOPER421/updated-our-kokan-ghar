'use client';

import { useState, useEffect, useRef } from 'react';
import { getImageUrl } from '@/lib/utils';

/* ─────────────────────────────────────────────────────────────
   Live mini preview of the storefront campaign page, rendered
   straight from the admin form state — updates as you type/add.
   Desktop: real 1024px layout scaled down (~0.37×).
   Mobile: 360px phone frame (products switch to 2-per-row).
   ───────────────────────────────────────────────────────────── */

// Accepts section (bg_*), page (page_bg_*) or pre-normalized ({type,...}) shapes
const toBg = (o) => {
  const src = o || {};
  return {
    type: src.bg_type || src.page_bg_type || src.type || 'transparent',
    color: src.bg_color || src.page_bg_color || src.color || null,
    image: src.bg_image || src.page_bg_image || src.image || null,
    video: src.bg_video || src.page_bg_video || src.video || null,
  };
};

function Background({ bg }) {
  if (!bg || bg.type === 'transparent') return null;
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

function MiniCountdown({ endTime, themeColor }) {
  if (!endTime) return null;
  const diff = Math.max(0, new Date(endTime).getTime() - Date.now());
  const units = [
    Math.floor(diff / 86400000),
    Math.floor((diff % 86400000) / 3600000),
    Math.floor((diff % 3600000) / 60000),
    Math.floor((diff % 60000) / 1000),
  ].map(n => String(n).padStart(2, '0'));
  return (
    <div className="flex items-center gap-1 mt-1.5">
      {units.map((u, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="w-8 h-7 rounded flex items-center justify-center font-mono text-[11px] font-bold text-white" style={{ backgroundColor: themeColor }}>
            {u}
          </div>
          {i < 3 && <span className="text-[10px] font-bold text-white/70">:</span>}
        </div>
      ))}
    </div>
  );
}

// Mini product card — mirrors the real ProductCard look (image top, name,
// price with strikethrough MRP) and fills its grid cell fully.
function MiniProductCard({ product, device }) {
  const price = Number(product.price || 0);
  const mrp = Number(product.mrp || 0);
  const isMobile = device === 'mobile';
  return (
    <div className="bg-white rounded-lg border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className={`${isMobile ? 'h-16' : 'h-20 sm:h-24'} bg-slate-100 overflow-hidden shrink-0`}>
        {product.primary_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getImageUrl(product.primary_image)} alt={product.name || ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
        )}
      </div>
      <div className="p-1.5 flex-1 flex flex-col min-w-0">
        <p className={`text-slate-800 font-semibold truncate ${isMobile ? 'text-[9px]' : 'text-[10px]'}`}>
          {product.name || `Product #${product.product_id}`}
        </p>
        <div className="mt-auto pt-1">
          <p className="text-orange-600 font-bold text-[10px] leading-tight">
            ₹{price.toLocaleString('en-IN')}
            {mrp > price && <span className="text-slate-400 font-normal line-through ml-1 text-[8px]">₹{mrp.toLocaleString('en-IN')}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniBlogCard({ blog, themeColor }) {
  return (
    <div className="bg-white rounded-lg border border-slate-100 overflow-hidden">
      <div className="h-16 sm:h-24 bg-slate-100 flex items-center justify-center overflow-hidden">
        {blog.hero_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getImageUrl(blog.hero_image)} alt={blog.title || ''} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold" style={{ color: themeColor }}>{(blog.title || 'B').charAt(0)}</span>
        )}
      </div>
      <div className="p-1.5">
        <p className="text-[9px] font-semibold text-slate-800 truncate">{blog.title || 'Untitled blog'}</p>
        {blog.excerpt && <p className="text-[8px] text-slate-400 truncate mt-0.5">{blog.excerpt}</p>}
      </div>
    </div>
  );
}

function SectionBlock({ section, themeColor, device }) {
  const bg = toBg(section);
  const isMobile = device === 'mobile';
  const products = section.products || [];
  const blogs = section.blogs || [];

  return (
    <div className="relative">
      <Background bg={bg} />
      <div className="relative px-3 sm:px-5 py-3 sm:py-4">
        {(section.title || section.subtitle) && (
          <div className="mb-2">
            {section.title && (
              <p className="font-display font-bold text-slate-900" style={{ fontSize: isMobile ? 13 : 16 }}>
                {section.title}
              </p>
            )}
            {section.subtitle && (
              <p className="text-slate-500 mt-0.5" style={{ fontSize: isMobile ? 9 : 10 }}>
                {section.subtitle}
              </p>
            )}
          </div>
        )}

        {section.section_type === 'products' && products.length > 0 && (
          section.layout === 'scroll' ? (
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
              {products.map((p, i) => (
                <div key={p.product_id || i} className="w-28 sm:w-40 shrink-0">
                  <MiniProductCard product={p} device={device} />
                </div>
              ))}
            </div>
          ) : (
            <div className={`grid gap-1 ${isMobile ? 'grid-cols-2' : 'grid-cols-5'}`}>
              {products.map((p, i) => (
                <MiniProductCard key={p.product_id || i} product={p} device={device} />
              ))}
            </div>
          )
        )}

        {section.section_type === 'blog' && blogs.length > 0 && (
          <div className={`grid gap-1.5 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {blogs.map((b, i) => (
              <MiniBlogCard key={b.blog_id || i} blog={b} themeColor={themeColor} />
            ))}
          </div>
        )}

        {(section.section_type === 'story' || section.section_type === 'overview') && section.content && (
          <div
            className={section.section_type === 'overview' ? 'bg-white rounded-lg p-2.5 border-t-4' : ''}
            style={section.section_type === 'overview' ? { borderTopColor: themeColor } : undefined}
          >
            {/<[a-z][\s\S]*>/i.test(section.content) ? (
              <div
                className="text-slate-700 leading-snug [&_p]:my-1 [&_h2]:font-bold [&_h2]:my-1.5 [&_ul]:list-disc [&_ul]:pl-4 [&_li]:my-0.5 [&_img]:rounded [&_img]:max-w-full [&_img]:h-auto [&_strong]:font-bold"
                style={{ fontSize: isMobile ? 10 : 11 }}
                dangerouslySetInnerHTML={{ __html: section.content }}
              />
            ) : (
              <p className="text-slate-700 whitespace-pre-line leading-snug" style={{ fontSize: isMobile ? 10 : 11 }}>
                {section.content}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PagePreviewContent({ form, sections, device }) {
  const themeColor = form.theme_color || '#2D6A4F';
  const isMobile = device === 'mobile';
  const pageBg = toBg(form);
  const hasPageBg = pageBg.type !== 'transparent';
  const hasBanner = !!(form.banner_image_url || form.mobile_banner_image_url);
  const totalProducts = sections.reduce(
    (sum, s) => sum + (s.section_type === 'products' ? (s.products?.length || 0) : 0), 0
  );

  return (
    <div className={`relative min-h-[400px] ${hasPageBg ? '' : 'bg-white'}`}>
      <Background bg={pageBg} />

      {/* Hero */}
      <div className="relative overflow-hidden">
        {hasBanner ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getImageUrl(form.banner_image_url || form.mobile_banner_image_url)}
              alt={form.name || 'Campaign'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}99 55%, #1B3B2F 100%)` }} />
        )}
        <div className="relative px-3 sm:px-6 pb-3 pt-5" style={{ minHeight: isMobile ? 170 : 200 }}>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] sm:text-[8px] font-bold uppercase tracking-widest text-white" style={{ backgroundColor: themeColor }}>
            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1l2.4 7.6L22 11l-7.6 2.4L12 21l-2.4-7.6L2 11l7.6-2.4L12 1z" /></svg>
            Festive Collection
          </span>
          <p className="font-display font-bold text-white mt-1 drop-shadow leading-tight" style={{ fontSize: isMobile ? 18 : 24 }}>
            {form.name || 'Campaign Name'}
          </p>
          {form.tagline && (
            <p className="text-white/90 mt-0.5 leading-snug" style={{ fontSize: isMobile ? 9 : 11 }}>
              {form.tagline}
            </p>
          )}
          <div className="flex items-end justify-between gap-2 mt-2">
            {form.ends_at ? (
              <div>
                <p className="text-[7px] sm:text-[8px] font-semibold uppercase tracking-widest text-white/80">Offer ends in</p>
                <MiniCountdown endTime={form.ends_at} themeColor={themeColor} />
              </div>
            ) : (
              <span className="text-[9px] text-white/70">Open-ended campaign</span>
            )}
            {totalProducts > 0 && (
              <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur px-2 py-1 rounded-full">
                <span className="text-white font-bold text-[10px]">{totalProducts}</span>
                <span className="text-white/85 text-[8px]">products</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {form.description && (
        <div className="bg-konkan-cream/40 border-b border-konkan-sand/50 px-3 sm:px-6 py-1.5">
          <p className="text-slate-600 line-clamp-2" style={{ fontSize: isMobile ? 8 : 10 }}>
            {form.description}
          </p>
        </div>
      )}

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="px-3 sm:px-6 py-6 text-center">
          <p className="text-slate-400" style={{ fontSize: isMobile ? 9 : 11 }}>
            No sections yet — add one from the form →
          </p>
        </div>
      ) : (
        sections.map((section, idx) => (
          <SectionBlock key={`${section.id || 'new'}-${idx}`} section={section} themeColor={themeColor} device={device} />
        ))
      )}

      {/* Bottom CTA */}
      <div className="px-3 sm:px-6 pb-4 pt-1">
        <div className="rounded-lg px-3 py-3 text-center" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}cc 60%, #1B3B2F 100%)` }}>
          <p className="font-display font-bold text-white" style={{ fontSize: isMobile ? 11 : 13 }}>
            Celebrate with authentic Konkan flavours
          </p>
          <span className="inline-block mt-1.5 px-3 py-1 rounded bg-white font-bold" style={{ color: themeColor, fontSize: isMobile ? 9 : 10 }}>
            Shop All Products
          </span>
        </div>
      </div>
    </div>
  );
}

export default function CampaignPreview({ form, sections }) {
  // Most shoppers are on mobile — start on the iPhone 12 view.
  const [device, setDevice] = useState('mobile');
  // Measure the viewport so the desktop preview scales to fill its width
  // exactly — no empty side space, cards at real-site density (5 per row).
  const viewportRef = useRef(null);
  const [panelWidth, setPanelWidth] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setPanelWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const desktopScale = panelWidth > 0 ? Math.min(0.62, Math.max(0.2, panelWidth / 1024)) : 0.36;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          Live Preview
        </p>
        <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${device === 'desktop' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Desktop
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${device === 'mobile' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Mobile
          </button>
        </div>
      </div>

      {/* Scrollable viewport — CSS zoom scales layout too, so native scrolling works.
          scrollbar-hide: the bar on the right is hidden, scrolling still works. */}
      <div
        ref={viewportRef}
        className={`rounded-lg border border-slate-200 bg-slate-100 overflow-y-auto overflow-x-hidden scrollbar-hide ${device === 'desktop' ? 'h-[480px]' : 'h-[680px]'}`}
      >
        {device === 'desktop' ? (
          <div className="w-[1024px]" style={{ zoom: desktopScale }}>
            <PagePreviewContent form={form} sections={sections} device="desktop" />
          </div>
        ) : (
          /* iPhone 12 — real 390 × 844 device at 72%. The WHOLE phone is shown at
             once (taller preview viewport), no scrolling inside the phone — the
             screen grows with the full page content like a full-page screenshot. */
          <div className="flex flex-col items-center py-5 min-h-full gap-2">
            <div style={{ zoom: 0.72 }}>
              <div className="relative w-[390px] min-h-[844px] rounded-[44px] bg-slate-900 p-[10px] shadow-2xl">
                {/* Side buttons */}
                <div className="absolute -left-[2px] top-24 w-[3px] h-8 rounded-l-md bg-slate-700" />
                <div className="absolute -left-[2px] top-36 w-[3px] h-12 rounded-l-md bg-slate-700" />
                <div className="absolute -right-[2px] top-32 w-[3px] h-16 rounded-r-md bg-slate-700" />
                {/* Screen — grows with content, no internal scroll */}
                <div className="relative w-full min-h-[824px] rounded-[34px] bg-white overflow-hidden flex flex-col">
                  {/* Dynamic island */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[110px] h-[26px] bg-slate-900 rounded-full z-30" />
                  <div className="flex-1">
                    <PagePreviewContent form={form} sections={sections} device="mobile" />
                  </div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">iPhone 12 · 390 × 844 @ 72%</p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
        Auto-updates as you type · Scroll to view the full page.
      </p>
    </div>
  );
}
