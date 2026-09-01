'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export default function ActiveFilterChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Same dynamic price range as the slider (real DB max, rounded up)
  const { data: filterOptions } = useQuery({
    queryKey: ['product-filters-options'],
    queryFn: async () => {
      const res = await api.get('/products/filters');
      return res.data.data || { price_range: { min: 0, max: 5000 } };
    },
    staleTime: 300000,
  });
  const priceRange = filterOptions?.price_range || { min: 0, max: 5000 };
  const PRICE_MAX = priceRange.max || 5000;

  const chips = [];
  if (searchParams.get('category')) chips.push({ label: `Category: ${searchParams.get('category')}`, key: 'category' });
  if (searchParams.get('sub')) chips.push({ label: `Sub: ${searchParams.get('sub')}`, key: 'sub' });
  if (searchParams.get('rating')) chips.push({ label: `${searchParams.get('rating')}★ & above`, key: 'rating' });
  if (searchParams.get('min_price') || searchParams.get('max_price')) chips.push({ label: `₹${searchParams.get('min_price') || 0} – ₹${searchParams.get('max_price') || PRICE_MAX}`, key: 'range' });
  if (searchParams.get('discount')) chips.push({ label: `${searchParams.get('discount')}%+ off`, key: 'discount' });
  if (searchParams.get('organic') === 'true') chips.push({ label: 'Organic', key: 'organic' });
  if (searchParams.get('seasonal') === 'true') chips.push({ label: 'Seasonal', key: 'seasonal' });
  if (searchParams.get('bestseller') === 'true') chips.push({ label: 'Bestseller', key: 'bestseller' });
  if (searchParams.get('in_stock') === 'true') chips.push({ label: 'In stock', key: 'in_stock' });
  // Multi-select brand / region — ek chip per selected value (click → wo value hat jaye)
  const brands = (searchParams.get('brand') || '').split(',').filter(Boolean);
  brands.forEach((b) => chips.push({ label: `Brand: ${b}`, key: 'brand', value: b }));
  const regions = (searchParams.get('region') || '').split(',').filter(Boolean);
  regions.forEach((r) => chips.push({ label: `Region: ${r}`, key: 'region', value: r }));

  const removeChip = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'range') {
      params.delete('min_price');
      params.delete('max_price');
    } else if (key === 'brand' || key === 'region') {
      // Remove only the clicked value from the comma-separated list
      const list = (params.get(key) || '').split(',').filter(Boolean);
      params.set(key, list.filter((v) => v !== value).join(','));
      if (!params.get(key)) params.delete(key);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const clearAll = () => {
    router.push(pathname, { scroll: false });
  };

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-konkan-text-secondary">Active filters:</span>
      {chips.map((chip) => (
        <button
          key={chip.key + (chip.value || '')}
          onClick={() => removeChip(chip.key, chip.value)}
          className="inline-flex items-center gap-1 px-3 py-1 bg-konkan-cream rounded-full text-xs font-medium text-konkan-text-primary hover:bg-konkan-sand transition-colors"
        >
          {chip.label}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      <button
        onClick={clearAll}
        className="text-xs font-medium text-konkan-saffron hover:underline ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
