'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { SlidersHorizontal, ArrowUpDown, ChevronDown } from 'lucide-react';

const SORT_OPTIONS = [
  { label: 'Name: A to Z', value: 'relevance' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Avg. Rating', value: 'rating' },
  { label: 'Newest First', value: 'newest' },
];

export default function MobileFilterToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get('sort') || 'relevance';
  const activeCategory = searchParams.get('category') || '';
  const [sortOpen, setSortOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef(null);

  // Fetch categories
  const { data: catData } = useQuery({
    queryKey: ['mobile-filter-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data?.all || [];
    },
    staleTime: 300000,
  });
  const categories = catData || [];
  // Alphabetical (A–Z) so the category picker is easy to scan — display-only.
  const parentCategories = categories
    .filter(c => !c.parent_id)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }));

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleCategoryChange = (slug) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('category', slug);
    else params.delete('category');
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
    setCatOpen(false);
  };

  const selectedCatName = activeCategory
    ? categories.find(c => c.slug === activeCategory)?.name || activeCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'Category';

  // Count active filters for badge
  const activeFilterCount = [
    activeCategory,
    searchParams.get('rating'),
    searchParams.get('min_price') || searchParams.get('max_price') ? 'price' : '',
    searchParams.get('discount'),
    ...['organic', 'seasonal', 'bestseller', 'new'].filter(k => searchParams.get(k) === 'true'),
  ].filter(Boolean).length;

  const handleSortChange = (value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'relevance') params.set('sort', value);
    else params.delete('sort');
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
    setSortOpen(false);
  };

  const openFilters = () => {
    window.dispatchEvent(new CustomEvent('open-mobile-filters'));
  };

  const currentSortLabel = SORT_OPTIONS.find(o => o.value === activeSort)?.label || 'Name: A to Z';

  return (
    <div className="lg:hidden flex items-center gap-2 mb-3 sticky top-[56px] z-30 bg-white py-2 -mx-4 px-4 border-b border-gray-100 shadow-sm">
      {/* Filters button */}
      <button
        onClick={openFilters}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97]"
        style={{
          backgroundColor: activeFilterCount > 0 ? '#1B3B2F' : '#F0F0F0',
          color: activeFilterCount > 0 ? '#FFFFFF' : '#1A1A1A',
        }}
      >
        <SlidersHorizontal className="w-4 h-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span
            className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1B3B2F',
            }}
          >
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Sort dropdown */}
      <div className="relative">
        <button
          onClick={() => setSortOpen(!sortOpen)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium bg-[#F0F0F0] transition-colors active:scale-[0.97]"
          style={{ color: '#1A1A1A' }}
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span className="max-w-[80px] truncate">{currentSortLabel}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
        </button>

        {sortOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[180px]">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSortChange(opt.value)}
                  className="block w-full text-left px-4 py-2.5 text-sm transition-colors"
                  style={{
                    color: activeSort === opt.value ? '#1B3B2F' : '#4A4A4A',
                    fontWeight: activeSort === opt.value ? 600 : 400,
                    backgroundColor: activeSort === opt.value ? '#F0F7F3' : 'transparent',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Category dropdown */}
      <div className="relative" ref={catRef}>
        <button
          onClick={() => setCatOpen(!catOpen)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors active:scale-[0.97]"
          style={{
            color: activeCategory ? '#FFFFFF' : '#1A1A1A',
            backgroundColor: activeCategory ? '#1B3B2F' : '#F0F0F0',
          }}
        >
          <span className="max-w-[60px] truncate">{selectedCatName}</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${catOpen ? 'rotate-180' : ''}`} />
        </button>

        {catOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setCatOpen(false)} />
            <div
              className="absolute top-full right-0 mt-1 z-50 bg-white rounded-xl shadow-lg border overflow-hidden"
              style={{ borderColor: '#E8E8E8', minWidth: '160px', maxHeight: '240px', overflowY: 'auto' }}
            >
              <button
                onClick={() => handleCategoryChange('')}
                className="block w-full text-left px-3.5 py-2.5 text-sm transition-colors"
                style={{
                  color: !activeCategory ? '#1B3B2F' : '#4A4A4A',
                  fontWeight: !activeCategory ? 600 : 400,
                  backgroundColor: !activeCategory ? '#F0F7F3' : 'transparent',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#F5F5F5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = !activeCategory ? '#F0F7F3' : 'transparent'}
              >
                All Categories
              </button>
              <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '0 8px' }} />
              {parentCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className="block w-full text-left px-3.5 py-2.5 text-sm transition-colors"
                  style={{
                    color: activeCategory === cat.slug ? '#1B3B2F' : '#4A4A4A',
                    fontWeight: activeCategory === cat.slug ? 600 : 400,
                    backgroundColor: activeCategory === cat.slug ? '#F0F7F3' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (activeCategory !== cat.slug) e.target.style.backgroundColor = '#F5F5F5';
                  }}
                  onMouseLeave={(e) => {
                    if (activeCategory !== cat.slug) e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
