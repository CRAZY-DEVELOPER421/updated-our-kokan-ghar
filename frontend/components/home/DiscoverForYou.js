'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import MobileProductCard from '@/components/product/MobileProductCard';

const PRICE_CHIPS = [
  { label: 'Under ₹299', min: null, max: 299 },
  { label: '₹300–599', min: 300, max: 599 },
  { label: '₹600+', min: 600, max: null },
];

export default function DiscoverForYou() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(null); // { min, max }
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const prevCountRef = useRef(0);

  // Build query params
  const buildParams = (pageNum) => {
    const params = new URLSearchParams();
    params.set('limit', '12');
    params.set('page', String(pageNum));
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedPrice?.min) params.set('min_price', String(selectedPrice.min));
    if (selectedPrice?.max) params.set('max_price', String(selectedPrice.max));
    return params.toString();
  };

  // Fetch categories for dropdown
  const { data: catData } = useQuery({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data?.all || [];
    },
    staleTime: 300000,
  });
  const categories = catData || [];

  // Fetch products — random when no filters, filtered when filters active
  const { isLoading, isFetching } = useQuery({
    queryKey: ['discover-products', selectedCategory, selectedPrice, page],
    queryFn: async () => {
      const res = await api.get(`/products/random?${buildParams(page)}`);
      const products = res.data.data?.products || [];
      const pagination = res.data.pagination || {};
      const totalPages = pagination.pages || 1;

      if (page === 1) {
        setAllProducts(products);
      } else {
        setAllProducts((prev) => {
          const existingIds = new Set(prev.map(p => p.id));
          let newProducts = products.filter(p => !existingIds.has(p.id));
          // Ensure even count so grid rows stay balanced
          if (newProducts.length % 2 !== 0) {
            newProducts = newProducts.slice(0, -1);
          }
          return [...prev, ...newProducts];
        });
      }

      setHasMore(page < totalPages);
      return products;
    },
    staleTime: 0, // Always refetch for random
  });

  // Handle filter change — reset to page 1
  const handleFilterChange = (type, value) => {
    if (type === 'category') {
      setSelectedCategory(value);
    } else if (type === 'price') {
      setSelectedPrice((prev) =>
        prev?.min === value.min && prev?.max === value.max ? null : value
      );
    }
    setPage(1);
    setAllProducts([]);
    setHasMore(true);
    prevCountRef.current = 0;
  };

  const handleLoadMore = () => {
    prevCountRef.current = allProducts.length;
    setPage((prev) => prev + 1);
  };

  // Custom dropdown state
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const catRef = useRef(null);
  const catBtnRef = useRef(null);

  // Close dropdown on outside click or scroll
  useEffect(() => {
    const handleClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    const handleScroll = () => setCatDropdownOpen(false);
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const selectedCatName = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)?.name || 'All Categories'
    : 'All Categories';

  // Derive active price label for highlighting
  const isPriceActive = (chip) =>
    selectedPrice?.min === chip.min && selectedPrice?.max === chip.max;

  return (
    <section style={{ width: '100%', overflowX: 'hidden', backgroundColor: '#FFF0F3', paddingTop: '4px', paddingBottom: '8px' }}>
      <style>{`
        .discover-card-wrapper > div {
          width: 100% !important;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* ── Section Header ── */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '24px 16px 12px' }}
      >
        <h2
          className="font-bold"
          style={{
            fontSize: '20px',
            color: '#1A1A1A',
            fontFamily: "'Poppins', sans-serif",
          }}
        >
          Discover Products For You
        </h2>
      </div>

      {/* ── Filter Chips: Horizontal Scroll Row ── */}
      <div
        className="flex gap-2 overflow-x-auto pb-2"
        style={{
          paddingLeft: '16px',
          paddingRight: '16px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Categories custom dropdown (replaces native select) */}
        <div className="relative shrink-0" ref={catRef}>
          <button
            ref={catBtnRef}
            type="button"
            onClick={() => {
              if (!catDropdownOpen) {
                const rect = catBtnRef.current.getBoundingClientRect();
                const dropdownWidth = 180;
                let left = rect.left;
                // Prevent right-edge overflow
                if (left + dropdownWidth > window.innerWidth) {
                  left = window.innerWidth - dropdownWidth - 8;
                }
                setDropdownPos({
                  top: rect.bottom + 6,
                  left: Math.max(left, 8),
                });
              }
              setCatDropdownOpen(!catDropdownOpen);
            }}
            className="shrink-0 text-sm font-medium rounded-full px-4 py-2 transition-all flex items-center gap-1 active:scale-95"
            suppressHydrationWarning
            style={{
              backgroundColor: selectedCategory ? '#1B3B2F' : '#FFFFFF',
              color: selectedCategory ? '#FFFFFF' : '#1A1A1A',
              border: selectedCategory ? '1px solid #1B3B2F' : '1px solid #E0E0E0',
              cursor: 'pointer',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              boxShadow: selectedCategory ? '0 1px 4px rgba(27,59,47,0.25)' : 'none',
            }}
          >
            {selectedCatName}
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${catDropdownOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {catDropdownOpen && (
            <>
              {/* Backdrop for dismiss */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setCatDropdownOpen(false)}
              />
              <div
                className="fixed z-50 bg-white rounded-xl shadow-lg border overflow-hidden"
                style={{
                  top: dropdownPos.top,
                  left: dropdownPos.left,
                  borderColor: '#E8E8E8',
                  minWidth: '180px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                <button
                  type="button"
                  onClick={() => { handleFilterChange('category', ''); setCatDropdownOpen(false); }}
                  className="block w-full text-left px-3.5 py-2.5 text-sm transition-colors"
                  style={{
                    color: !selectedCategory ? '#1B3B2F' : '#4A4A4A',
                    fontWeight: !selectedCategory ? 600 : 400,
                    backgroundColor: !selectedCategory ? '#F0F7F3' : 'transparent',
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#F5F5F5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = !selectedCategory ? '#F0F7F3' : 'transparent'}
                >
                  All Categories
                </button>
                <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '0 8px' }} />
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { handleFilterChange('category', cat.slug); setCatDropdownOpen(false); }}
                    className="block w-full text-left px-3.5 py-2.5 text-sm transition-colors"
                    style={{
                      color: selectedCategory === cat.slug ? '#1B3B2F' : '#4A4A4A',
                      fontWeight: selectedCategory === cat.slug ? 600 : 400,
                      backgroundColor: selectedCategory === cat.slug ? '#F0F7F3' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== cat.slug) e.target.style.backgroundColor = '#F5F5F5';
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== cat.slug) e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Price range chips — active chip is clearly highlighted (green fill) */}
        {PRICE_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleFilterChange('price', chip)}
            className="shrink-0 text-sm font-medium rounded-full px-4 py-2 transition-all active:scale-95"
            suppressHydrationWarning
            style={{
              backgroundColor: isPriceActive(chip) ? '#1B3B2F' : '#FFFFFF',
              color: isPriceActive(chip) ? '#FFFFFF' : '#1A1A1A',
              fontSize: '13px',
              border: isPriceActive(chip) ? '1px solid #1B3B2F' : '1px solid #E0E0E0',
              boxShadow: isPriceActive(chip) ? '0 1px 4px rgba(27,59,47,0.25)' : 'none',
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Product Grid: 2 Columns ── */}
      <div
        className="grid grid-cols-2"
        style={{
          gap: '8px',
          width: '100%',
          padding: '0 12px',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div
                className="overflow-hidden rounded-[12px]"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="h-[130px] w-full"
                  style={{
                    backgroundColor: '#E8F0EC',
                    animation: 'shimmer 2s infinite linear',
                    backgroundImage:
                      'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%)',
                    backgroundSize: '200% 100%',
                  }}
                />
                <div className="p-2.5 space-y-2">
                  <div className="h-3 w-3/4 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                  <div className="h-3 w-1/2 rounded" style={{ backgroundColor: '#E8F0EC' }} />
                </div>
              </div>
            </div>
          ))
        ) : allProducts.length > 0 ? (
          allProducts.slice(0, page * 12).map((product, index) => {
            const isNew = index >= prevCountRef.current;
            return (
              <div
                key={product.id}
                className="discover-card-wrapper"
                style={isNew ? {
                  animation: `fadeInUp 0.4s ease-out ${Math.min((index - prevCountRef.current) * 0.04, 0.3)}s both`,
                } : undefined}
              >
                <MobileProductCard product={product} />
              </div>
            );
          })
        ) : (
          <div
            className="col-span-2 text-center py-8"
            style={{ color: '#8A8A8A', fontSize: '14px' }}
          >
            No products found. Try adjusting your filters.
          </div>
        )}
      </div>

      {/* ── Load More Button ── */}
      {!isLoading && hasMore && allProducts.length > 0 && (
        <div className="text-center mt-2 pb-4">
          <button
            onClick={handleLoadMore}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.97] disabled:opacity-60"
            suppressHydrationWarning
            style={{
              backgroundColor: 'transparent',
              color: '#1B3B2F',
            }}
          >
            {isFetching ? (
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : 'Load More'}
          </button>
        </div>
      )}
    </section>
  );
}
