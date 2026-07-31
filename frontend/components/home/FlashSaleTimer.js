'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';

export default function FlashSaleTimer() {
  const { data: flashProducts, isLoading } = useQuery({
    queryKey: ['flash-sales'],
    queryFn: async () => {
      const [flashRes] = await Promise.all([
        api.get('/products?sort=bestseller&limit=8'),
      ]);
      return flashRes.data.data?.products || [];
    },
    staleTime: 60000,
  });

  const endDate = new Date();
  endDate.setHours(endDate.getHours() + 8, endDate.getMinutes() + 45, 0, 0);

  return (
    <section className="relative overflow-hidden rounded-2xl p-6 md:p-8" style={{ backgroundColor: '#FFF3E0' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-display text-2xl md:text-3xl font-bold" style={{ color: '#1B3B2F' }}>Flash Sale</h2>
            <span className="px-2 py-0.5 rounded text-xs font-bold text-white uppercase tracking-wider animate-blink" style={{ backgroundColor: '#E53935' }}>
              Live
            </span>
          </div>
          <p className="text-sm" style={{ color: '#8B6914' }}>Limited stock at unbeatable Konkan prices</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: '#1B3B2F' }}>Ends in:</span>
          <CountdownTimer targetDate={endDate.toISOString()} />
        </div>
      </div>

      {/* Scrollable Product Cards */}
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[220px] md:w-[240px] shrink-0">
              <ProductCardSkeleton />
            </div>
          ))
        ) : (
          (flashProducts || []).slice(0, 8).map((product) => (
            <div key={product.id} className="w-[220px] md:w-[260px] shrink-0">
              <ProductCard product={product} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
