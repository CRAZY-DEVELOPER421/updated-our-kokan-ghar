'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import CountdownTimer from '@/components/ui/CountdownTimer';
import ProductCarouselCard, { ProductCarouselCardSkeleton } from '@/components/product/ProductCarouselCard';

// ── Desktop Flash Sale section ─────────────────────────────────────────
// Every value is REAL data: the countdown runs from the DB's ends_at, the
// discount % is computed from (original_price − sale_price), and the cards
// reuse the shared ProductCarouselCard design (same as Bestsellers, Deals
// Under ₹999, New Arrivals and Discover For You).
export default function FlashSaleTimer() {
  // Real active flash sales from the DB (incl. ends_at for the countdown)
  const { data: flashSales, isLoading: loadingSales } = useQuery({
    queryKey: ['flash-sales'],
    queryFn: async () => {
      const res = await api.get('/flash-sales');
      return res.data.data?.flashSales || [];
    },
    staleTime: 60000,
  });

  // Full product details (real average_rating / review_count) for each
  // flash-sale product — merged below without touching the backend.
  const { data: productDetails } = useQuery({
    queryKey: ['flash-sale-products', (flashSales || []).map((f) => f.product_id).join(',')],
    enabled: (flashSales || []).length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        flashSales.map((f) =>
          api.get(`/products/${f.product_slug}`).then((r) => r.data.data?.product).catch(() => null)
        )
      );
      return results;
    },
    staleTime: 60000,
  });

  const loadingCards = loadingSales || ((flashSales || []).length > 0 && !productDetails);

  if (loadingCards) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-[220px] md:w-[260px] shrink-0">
            <ProductCarouselCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  // No active flash sales in the DB → hide the section (real data only)
  if (!flashSales || flashSales.length === 0) return null;

  // Merge flash-sale pricing with the full product records (shared card shape)
  const cards = flashSales.slice(0, 8).map((f, i) => {
    const p = productDetails?.[i];
    return {
      id: f.product_id,
      slug: f.product_slug,
      name: p?.name || f.product_name,
      image: p?.primary_image || f.primary_image,
      price: Number(f.sale_price),
      mrp: Number(f.original_price),
      rating: parseFloat(p?.average_rating) || 0,
      review_count: p?.review_count || 0,
      short_description: p?.short_description || '',
      total_sold: Number(p?.total_sold) || 0,
      free_delivery: p?.free_delivery ?? 1,
      delivery_estimate: p?.delivery_estimate || '3-5 days',
    };
  });

  // Real countdown target — the soonest-ending active flash sale
  const endTimes = flashSales.map((f) => new Date(f.ends_at).getTime()).filter((t) => !isNaN(t));
  const targetDate = endTimes.length ? new Date(Math.min(...endTimes)).toISOString() : null;

  return (
    <section>
      {/* ══ Header row: title + subtext (left) | live countdown (right) ══ */}
      <div className="flex items-center justify-between gap-6 mb-7">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-display text-[22px] lg:text-2xl font-bold" style={{ color: '#1B3B2F' }}>
              Flash Sale
            </h2>
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#E87722" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span
              className="px-2 py-0.5 rounded text-xs font-bold text-white uppercase tracking-wider animate-blink"
              style={{ backgroundColor: '#E53935' }}
            >
              Live
            </span>
          </div>
          <p className="text-[13px]" style={{ color: '#8B6914' }}>
            Limited stock at unbeatable Konkan prices
          </p>
        </div>

        {targetDate && (
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-medium" style={{ color: '#1B3B2F' }}>Ends in:</span>
            <CountdownTimer targetDate={targetDate} />
          </div>
        )}
      </div>

      {/* ══ Product cards — horizontal scroll row: ~5–6 visible, all cards on one line (scroll left-right) ══ */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {cards.map((sale) => (
          <div key={sale.id} className="w-[220px] md:w-[260px] shrink-0">
            <ProductCarouselCard product={sale} />
          </div>
        ))}
      </div>
    </section>
  );
}
