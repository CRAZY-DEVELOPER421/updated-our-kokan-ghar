'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';

const seasons = [
  { key: 'all', label: 'All Seasonal' },
  { key: 'monsoon', label: 'Monsoon' },
  { key: 'summer', label: 'Summer' },
  { key: 'winter', label: 'Winter' },
  { key: 'diwali', label: 'Diwali Special' },
];

export default function SeasonalSection() {
  const [activeSeason, setActiveSeason] = useState('all');

  const { data: products, isLoading } = useQuery({
    queryKey: ['seasonal-products'],
    queryFn: async () => {
      const res = await api.get('/products/seasonal');
      return res.data.data.products || [];
    },
    staleTime: 120000,
  });

  // Season keyword mapping for client-side filtering
  const SEASON_FILTERS = {
    monsoon: ['monsoon', 'bhajji', 'chai', 'rasam', 'bhel', 'bhutta', 'pakora', 'soup', 'fried'],
    summer: ['mango', 'kokum', 'coconut water', 'sol kadhi', 'watermelon', 'tender coconut', 'kesar'],
    winter: ['jaggery', 'chikki', 'til', 'gud', 'date', 'dry fruit', 'peanut', 'sesame', 'winter'],
    diwali: ['kaju katli', 'barfi', 'laddu', 'gift hamper', 'diwali', 'handicraft', 'sweet', 'puran', 'chakli', 'chivda'],
  };

  // Filter products based on active season tab
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (activeSeason === 'all') return products.slice(0, 8);

    const keywords = SEASON_FILTERS[activeSeason] || [];
    if (keywords.length === 0) return products.slice(0, 8);

    const filtered = products.filter((p) => {
      const searchText = [
        p.name,
        p.short_description || '',
        p.category_name || '',
        p.region_origin || '',
        p.ingredients || '',
      ].join(' ').toLowerCase();
      return keywords.some((kw) => searchText.includes(kw));
    });

    return filtered.length > 0 ? filtered.slice(0, 8) : products.slice(0, 8);
  }, [products, activeSeason]);

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="section-title">Seasonal Picks</h2>
        <p className="section-subtitle">Discover what's in season across the Konkan coast</p>
      </div>

      {/* Season Tabs */}
      <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto scrollbar-hide">
        {seasons.map((season) => (
          <button
            key={season.key}
            onClick={() => setActiveSeason(season.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeSeason === season.key
                ? 'bg-konkan-green-primary text-white shadow-md'
                : 'bg-white text-konkan-text-secondary hover:text-konkan-green-primary hover:bg-konkan-cream border border-konkan-sand'
            }`}
          >
            {season.label}
          </button>
        ))}
      </div>

      {/* Products — horizontal scroll with fixed-width cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-[220px] md:w-[260px] shrink-0 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <ProductCardSkeleton />
            </div>
          ))
        ) : (
          filteredProducts.map((product, idx) => (
            <div key={product.id} className="w-[220px] md:w-[260px] shrink-0 animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }}>
              <ProductCard product={product} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
