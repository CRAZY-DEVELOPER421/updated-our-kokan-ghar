'use client';

import { useRef, useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import Skeleton from '@/components/ui/Skeleton';

export default function ProductCarousel({ title = 'You May Also Like', products = [], loading = false }) {
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
    window.addEventListener('resize', checkScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [products]);

  const scroll = (dir) => { scrollRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' }); };

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <h3 className="font-display text-xl font-bold text-konkan-text-primary">{title}</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => scroll(-1)} disabled={!canScrollLeft} className="min-w-[44px] min-h-[44px] rounded-full border border-konkan-sand flex items-center justify-center hover:bg-konkan-cream transition-colors disabled:opacity-30" aria-label="Previous"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
          <button onClick={() => scroll(1)} disabled={!canScrollRight} className="min-w-[44px] min-h-[44px] rounded-full border border-konkan-sand flex items-center justify-center hover:bg-konkan-cream transition-colors disabled:opacity-30" aria-label="Next"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
        {loading ? Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="min-w-[200px] md:min-w-[230px] space-y-2"><Skeleton variant="image" /><Skeleton variant="title" /><Skeleton variant="price" /></div>
        )) : (products || []).map((product) => (
          <div key={product.id} className="min-w-[200px] md:min-w-[230px]"><ProductCard product={product} /></div>
        ))}
      </div>
    </div>
  );
}
