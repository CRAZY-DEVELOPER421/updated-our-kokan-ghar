'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function ActiveFilterChips() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const chips = [];
  if (searchParams.get('category')) chips.push({ label: `Category: ${searchParams.get('category')}`, key: 'category' });
  if (searchParams.get('rating')) chips.push({ label: `${searchParams.get('rating')}★ & above`, key: 'rating' });
  if (searchParams.get('min_price') || searchParams.get('max_price')) chips.push({ label: `₹${searchParams.get('min_price') || 0} – ₹${searchParams.get('max_price') || 5000}`, key: 'range' });
  if (searchParams.get('discount')) chips.push({ label: `${searchParams.get('discount')}%+ off`, key: 'discount' });
  if (searchParams.get('organic') === 'true') chips.push({ label: 'Organic', key: 'organic' });
  if (searchParams.get('seasonal') === 'true') chips.push({ label: 'Seasonal', key: 'seasonal' });
  if (searchParams.get('bestseller') === 'true') chips.push({ label: 'Bestseller', key: 'bestseller' });

  const removeChip = (key) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'range') {
      params.delete('min_price');
      params.delete('max_price');
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const clearAll = () => {
    router.push('/products');
  };

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-konkan-text-secondary">Active filters:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={() => removeChip(chip.key)}
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
