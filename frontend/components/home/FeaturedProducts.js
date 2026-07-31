'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useFeaturedProducts } from '@/lib/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import Skeleton from '@/components/ui/Skeleton';

export default function FeaturedProducts({ title = 'Featured Products', subtitle = 'Handpicked favourites from the Konkan coast' }) {
  const { data: products, isLoading } = useFeaturedProducts();
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const rafRef = useRef(null);

  const checkScroll = () => {
    // Throttle with requestAnimationFrame to prevent layout thrashing
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      // Batch all DOM reads first, then set state
      const left = el.scrollLeft > 0;
      const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 10;
      setCanScrollLeft(left);
      setCanScrollRight(right);
    });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => {
      el.removeEventListener('scroll', checkScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [products]);

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  return (
    <section className="py-10 md:py-14">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-6">
          <div><h2 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary">{title}</h2><p className="text-konkan-text-secondary mt-1 text-sm">{subtitle}</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => scroll(-1)} disabled={!canScrollLeft} className="min-w-[44px] min-h-[44px] rounded-full border border-konkan-sand flex items-center justify-center hover:bg-konkan-cream transition-colors disabled:opacity-30" aria-label="Scroll left"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <button onClick={() => scroll(1)} disabled={!canScrollRight} className="min-w-[44px] min-h-[44px] rounded-full border border-konkan-sand flex items-center justify-center hover:bg-konkan-cream transition-colors disabled:opacity-30" aria-label="Scroll right"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
          </div>
        </div>
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 snap-x snap-mandatory">
          {isLoading ? Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[220px] md:w-[260px] shrink-0 snap-start"><div className="space-y-2"><Skeleton variant="image" /><Skeleton variant="title" /><Skeleton variant="price" /><Skeleton variant="button" /></div></div>
          )) : (products || []).map((product) => (
            <div key={product.id} className="w-[220px] md:w-[260px] shrink-0 snap-start"><ProductCard product={product} /></div>
          ))}
        </div>
      </div>
    </section>
  );
}
