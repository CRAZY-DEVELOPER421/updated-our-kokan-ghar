'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { SlidersHorizontal, X, ChevronDown, Star } from 'lucide-react';

export default function ProductFilters({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('category') || '';
  const activeRating = searchParams.get('rating') || '';
  const activeMinPrice = searchParams.get('min_price') || '';
  const activeMaxPrice = searchParams.get('max_price') || '';
  const [minPrice, setMinPrice] = useState(activeMinPrice || '');
  const [maxPrice, setMaxPrice] = useState(activeMaxPrice || '');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['category', 'price', 'rating']);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catRef = useRef(null);

  // Fetch categories from DB (same as MobileFilterToolbar)
  const { data: catData } = useQuery({
    queryKey: ['product-filters-categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data?.all || [];
    },
    staleTime: 300000,
  });
  const allCategories = catData?.length > 0 ? catData : categories;
  const parentCategories = allCategories.filter((c) => !c.parent_id);

  const toggleSection = (section) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
    setCatDropdownOpen(false);
  };

  const applyPrice = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('min_price', minPrice);
    else params.delete('min_price');
    if (maxPrice) params.set('max_price', maxPrice);
    else params.delete('max_price');
    params.set('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  // Listen for custom event from MobileFilterToolbar to open filter drawer
  useEffect(() => {
    const handler = () => setMobileOpen(true);
    window.addEventListener('open-mobile-filters', handler);
    return () => window.removeEventListener('open-mobile-filters', handler);
  }, []);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const clearAllFilters = () => {
    router.push('/products');
  };

  const activeFilterCountValue = [
    activeCategory,
    activeRating,
    activeMinPrice || activeMaxPrice ? 'price' : '',
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCountValue > 0;

  const selectedCatName = activeCategory
    ? allCategories.find((c) => c.slug === activeCategory)?.name || activeCategory
    : 'All Categories';

  const SectionHeader = ({ id, title }) => (
    <button
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-3 text-sm font-semibold text-konkan-text-primary"
    >
      <span>{title}</span>
      <ChevronDown className={`w-4 h-4 text-konkan-text-secondary transition-transform duration-200 ${expandedSections.includes(id) ? 'rotate-180' : ''}`} />
    </button>
  );

  const filterContent = (
    <div>
      {/* Clear All */}
      {hasActiveFilters && (
        <button onClick={clearAllFilters} className="flex items-center gap-1.5 text-xs text-konkan-saffron hover:underline font-medium mb-4">
          <X className="w-3 h-3" />
          Clear all filters
        </button>
      )}

      {/* Category — dropdown from DB */}
      <div className="border-b border-konkan-sand py-1">
        <SectionHeader id="category" title="Category" />
        {expandedSections.includes('category') && (
          <div className="pb-3 relative" ref={catRef}>
            <button
              onClick={() => setCatDropdownOpen(!catDropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg border border-konkan-sand bg-white transition-colors"
              style={{ color: '#1A1A1A' }}
            >
              <span>{selectedCatName}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${catDropdownOpen ? 'rotate-180' : ''}`} style={{ color: '#8A8A8A' }} />
            </button>

            {catDropdownOpen && (
              <div
                className="absolute left-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border overflow-hidden"
                style={{ borderColor: '#E8E8E8', minWidth: '100%', maxHeight: '200px', overflowY: 'auto' }}
              >
                <button
                  onClick={() => { updateFilter('category', ''); setCatDropdownOpen(false); }}
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
                    onClick={() => { updateFilter('category', cat.slug); setCatDropdownOpen(false); }}
                    className="block w-full text-left px-3.5 py-2.5 text-sm transition-colors"
                    style={{
                      color: activeCategory === cat.slug ? '#1B3B2F' : '#4A4A4A',
                      fontWeight: activeCategory === cat.slug ? 600 : 400,
                      backgroundColor: activeCategory === cat.slug ? '#F0F7F3' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (activeCategory !== cat.slug) e.target.style.backgroundColor = '#F5F5F5'; }}
                    onMouseLeave={(e) => { if (activeCategory !== cat.slug) e.target.style.backgroundColor = 'transparent'; }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-b border-konkan-sand py-1">
        <SectionHeader id="price" title="Price Range" />
        {expandedSections.includes('price') && (
          <div className="pb-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="Min"
                className="w-full px-3 py-2 text-sm rounded-xl border bg-white text-konkan-text-primary placeholder:text-konkan-text-secondary/60 focus:ring-2 focus:ring-konkan-green-primary/30 focus:border-konkan-green-primary outline-none transition-all"
                style={{ borderColor: '#D0D0D0' }}
              />
              <span style={{ color: '#8A8A8A' }}>—</span>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Max"
                className="w-full px-3 py-2 text-sm rounded-xl border bg-white text-konkan-text-primary placeholder:text-konkan-text-secondary/60 focus:ring-2 focus:ring-konkan-green-primary/30 focus:border-konkan-green-primary outline-none transition-all"
                style={{ borderColor: '#D0D0D0' }}
              />
            </div>
            <button
              onClick={applyPrice}
              className="mt-2 w-full py-2 text-xs font-medium text-white bg-konkan-green-primary rounded-xl hover:bg-konkan-green-dark transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Customer Review — single line clickable stars */}
      <div className="border-b border-konkan-sand py-1">
        <SectionHeader id="rating" title="Customer Review" />
        {expandedSections.includes('rating') && (
          <div className="pb-3">
            <div className="flex items-center gap-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  onClick={() => updateFilter('rating', activeRating === String(star) ? '' : String(star))}
                  className="p-1 transition-transform active:scale-90"
                  title={`${star}★ & above`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      activeRating && parseInt(activeRating) >= star
                        ? 'fill-konkan-gold text-konkan-gold'
                        : 'fill-none text-[#CCCCCC]'
                    }`}
                  />
                </button>
              ))}
              {activeRating && (
                <button
                  onClick={() => updateFilter('rating', '')}
                  className="ml-2 text-xs px-2 py-1 rounded-full"
                  style={{ color: '#8A8A8A', backgroundColor: '#F0F0F0' }}
                >
                  <X className="w-3 h-3 inline" /> Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Availability */}
      <div className="py-3">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input type="checkbox" className="w-4 h-4 rounded border-konkan-sand text-konkan-green-primary focus:ring-konkan-green-primary focus:ring-offset-0" />
          <span className="text-sm text-konkan-text-secondary group-hover:text-konkan-text-primary transition-colors">In Stock Only</span>
        </label>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <aside className="hidden lg:block w-[300px] shrink-0">
        <div className="sticky top-[120px] bg-white rounded-2xl card border border-konkan-sand/50 p-5 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-bold text-konkan-text-primary text-base">Filters</h2>
            <SlidersHorizontal className="w-4 h-4 text-konkan-text-secondary" />
          </div>
          {filterContent}
        </div>
      </aside>

      {/* Mobile Filter Drawer — left side */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-white border-r border-konkan-sand shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-konkan-sand px-5 py-4 flex items-center justify-between z-10">
              <h2 className="font-display font-bold text-konkan-text-primary flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </h2>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-xl hover:bg-konkan-cream text-konkan-text-secondary hover:text-konkan-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {filterContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
