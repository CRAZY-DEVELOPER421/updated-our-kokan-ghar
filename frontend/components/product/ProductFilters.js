'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { SlidersHorizontal, X, ChevronDown, Star } from 'lucide-react';
import PriceRangeSlider from '@/components/ui/PriceRangeSlider';

export default function ProductFilters({ categories = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // These filters are shared by the product listing page (/products) and the
  // search page (/search). Apply them IN PLACE — a filter clicked on the
  // search page must stay on /search (preserving ?q=), not jump to /products.
  const filterBase = pathname?.startsWith('/search') ? '/search' : '/products';

  const activeCategory = searchParams.get('category') || '';
  const activeRating = searchParams.get('rating') || '';
  const activeMinPrice = searchParams.get('min_price') || '';
  const activeMaxPrice = searchParams.get('max_price') || '';
  const activeBrands = (searchParams.get('brand') || '').split(',').filter(Boolean);
  const activeRegions = (searchParams.get('region') || '').split(',').filter(Boolean);
  const activeInStock = searchParams.get('in_stock') === 'true';
  const activeDiscount = searchParams.get('discount') || '';
  const activeOrganic = searchParams.get('organic') === 'true';
  const activeSeasonal = searchParams.get('seasonal') === 'true';
  const activeBestseller = searchParams.get('bestseller') === 'true';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState(['category', 'price', 'rating', 'brand', 'region', 'discount', 'deals']);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catRef = useRef(null);
  const priceTimerRef = useRef(null);

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

  // Fetch distinct brands + regions (with counts) for the filter lists
  const { data: filterOptions } = useQuery({
    queryKey: ['product-filters-options'],
    queryFn: async () => {
      const res = await api.get('/products/filters');
      return res.data.data || { brands: [], regions: [] };
    },
    staleTime: 300000,
  });
  const brands = filterOptions?.brands || [];
  const regions = filterOptions?.regions || [];
  // Slider range — dynamic from DB: min floor = real min price,
  // max = real max price rounded up (e.g. ₹2235 → ₹2500).
  const priceRange = filterOptions?.price_range || { min: 0, max: 5000 };
  const PRICE_MIN = priceRange.min || 0;
  const PRICE_MAX = priceRange.max || 5000;

  // Multi-select toggle: append/remove a value from a comma-separated param
  const toggleMultiFilter = (key, value, activeList) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = activeList.includes(value)
      ? activeList.filter((v) => v !== value)
      : [...activeList, value];
    if (next.length > 0) params.set(key, next.join(','));
    else params.delete(key);
    params.set('page', '1');
    router.push(`${filterBase}?${params.toString()}`);
  };

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
    router.push(`${filterBase}?${params.toString()}`);
    setCatDropdownOpen(false);
  };

  // Price slider — smooth drag pe turant filter nahi lagta (lag hoga).
  // User jab ~800ms ruk jata hai tabhi URL push hota hai → grid refresh.
  const applyPriceSlider = (range) => {
    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (range.min > PRICE_MIN) params.set('min_price', String(range.min));
      else params.delete('min_price');
      if (range.max < PRICE_MAX) params.set('max_price', String(range.max));
      else params.delete('max_price');
      params.set('page', '1');
      router.push(`${filterBase}?${params.toString()}`);
    }, 800);
  };

  // Cleanup pending debounce on unmount
  useEffect(() => () => {
    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
  }, []);

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
    if (filterBase === '/search') {
      // Keep the search phrase, clear every filter chip.
      const params = new URLSearchParams(searchParams.toString());
      for (const key of [...params.keys()]) {
        if (key !== 'q') params.delete(key);
      }
      const qs = params.toString();
      router.push(qs ? `/search?${qs}` : '/search');
    } else {
      router.push('/products');
    }
  };

  const activeFilterCountValue = [
    activeCategory,
    activeRating,
    activeMinPrice || activeMaxPrice ? 'price' : '',
    activeBrands.length > 0 ? 'brand' : '',
    activeRegions.length > 0 ? 'region' : '',
    activeInStock ? 'in_stock' : '',
    activeDiscount ? 'discount' : '',
    activeOrganic ? 'organic' : '',
    activeSeasonal ? 'seasonal' : '',
    activeBestseller ? 'bestseller' : '',
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
            {/* Dual-thumb slider — drag smooth, filter ~1 sec rukne pe lagta hai.
                Range DB se dynamic: dono thumbs kahi bhi move kar sakte hain
                (e.g. ₹600 – ₹2200), step ₹50 for precise selection. */}
            <PriceRangeSlider
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={50}
              value={{
                min: activeMinPrice ? parseInt(activeMinPrice) : PRICE_MIN,
                max: activeMaxPrice ? parseInt(activeMaxPrice) : PRICE_MAX,
              }}
              onChange={applyPriceSlider}
            />
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
      {/* Brand — multi-select checkbox list with counts */}
      <div className="border-b border-konkan-sand py-1">
        <SectionHeader id="brand" title="Brand" />
        {expandedSections.includes('brand') && (
          <div className="pb-3 space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
            {brands.length === 0 && (
              <p className="text-xs text-konkan-text-secondary/60">Loading brands…</p>
            )}
            {brands.map((brand) => {
              const name = typeof brand === 'string' ? brand : brand.name;
              const count = typeof brand === 'string' ? 0 : brand.count;
              const isActive = activeBrands.some((b) => b.toLowerCase() === name.toLowerCase());
              return (
                <label key={name} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleMultiFilter('brand', name, activeBrands)}
                    className="w-4 h-4 rounded border-konkan-sand text-konkan-green-primary focus:ring-konkan-green-primary focus:ring-offset-0"
                  />
                  <span className={`text-sm transition-colors flex-1 ${isActive ? 'text-konkan-green-primary font-medium' : 'text-konkan-text-secondary group-hover:text-konkan-text-primary'}`}>
                    {name}
                  </span>
                  {count > 0 && (
                    <span className="text-[11px] text-konkan-text-secondary/70 tabular-nums">({count})</span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Region — multi-select checkbox list with counts */}
      <div className="border-b border-konkan-sand py-1">
        <SectionHeader id="region" title="Region" />
        {expandedSections.includes('region') && (
          <div className="pb-3 space-y-1 max-h-48 overflow-y-auto scrollbar-hide">
            {regions.length === 0 && (
              <p className="text-xs text-konkan-text-secondary/60">Loading regions…</p>
            )}
            {regions.map((region) => {
              const name = typeof region === 'string' ? region : region.name;
              const count = typeof region === 'string' ? 0 : region.count;
              const isActive = activeRegions.some((r) => r.toLowerCase() === name.toLowerCase());
              return (
                <label key={name} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleMultiFilter('region', name, activeRegions)}
                    className="w-4 h-4 rounded border-konkan-sand text-konkan-green-primary focus:ring-konkan-green-primary focus:ring-offset-0"
                  />
                  <span className={`text-sm transition-colors flex-1 ${isActive ? 'text-konkan-green-primary font-medium' : 'text-konkan-text-secondary group-hover:text-konkan-text-primary'}`}>
                    {name}
                  </span>
                  {count > 0 && (
                    <span className="text-[11px] text-konkan-text-secondary/70 tabular-nums">({count})</span>
                  )}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Discount — percentage thresholds */}
      <div className="border-b border-konkan-sand py-1">
        <SectionHeader id="discount" title="Discount" />
        {expandedSections.includes('discount') && (
          <div className="pb-3 space-y-1">
            {[10, 25, 50, 70].map((pct) => {
              const isActive = activeDiscount === String(pct);
              return (
                <label key={pct} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => updateFilter('discount', isActive ? '' : String(pct))}
                    className="w-4 h-4 rounded border-konkan-sand text-konkan-green-primary focus:ring-konkan-green-primary focus:ring-offset-0"
                  />
                  <span className={`text-sm transition-colors ${isActive ? 'text-konkan-green-primary font-medium' : 'text-konkan-text-secondary group-hover:text-konkan-text-primary'}`}>
                    {pct}% &amp; above
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Deals — Organic / Seasonal / Bestseller toggles */}
      <div className="border-b border-konkan-sand py-1">
        <SectionHeader id="deals" title="Deals &amp; Categories" />
        {expandedSections.includes('deals') && (
          <div className="pb-3 space-y-1">
            {[
              { key: 'organic', label: 'Organic', active: activeOrganic },
              { key: 'seasonal', label: 'Seasonal', active: activeSeasonal },
              { key: 'bestseller', label: 'Bestseller', active: activeBestseller },
            ].map((opt) => (
              <label key={opt.key} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={opt.active}
                  onChange={() => updateFilter(opt.key, opt.active ? '' : 'true')}
                  className="w-4 h-4 rounded border-konkan-sand text-konkan-green-primary focus:ring-konkan-green-primary focus:ring-offset-0"
                />
                <span className={`text-sm transition-colors ${opt.active ? 'text-konkan-green-primary font-medium' : 'text-konkan-text-secondary group-hover:text-konkan-text-primary'}`}>
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Availability — REAL in-stock toggle (wired to ?in_stock=true) */}
      <div className="py-3">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={activeInStock}
            onChange={() => updateFilter('in_stock', activeInStock ? '' : 'true')}
            className="w-4 h-4 rounded border-konkan-sand text-konkan-green-primary focus:ring-konkan-green-primary focus:ring-offset-0"
          />
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
