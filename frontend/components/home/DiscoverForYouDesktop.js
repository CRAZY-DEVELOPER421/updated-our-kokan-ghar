'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ProductCarouselCard, { ProductCarouselCardSkeleton } from '@/components/product/ProductCarouselCard';
import { ChevronDown } from 'lucide-react';

const PRICE_CHIPS = [
  { label: 'Under ₹299', min: null, max: 299 },
  { label: '₹300–599', min: 300, max: 599 },
  { label: '₹600+', min: 600, max: null },
];

// Popular category shortcuts — one click instead of scrolling the full
// dropdown. Slugs must exist in the categories table (the backend resolves
// them and includes child subcategories automatically).
const SHORTCUT_CATEGORIES = [
  { label: 'Mangoes', slug: 'mango-aamba-products' },
  { label: 'Cashews', slug: 'kokan-cashew-kaju' },
  { label: 'Kokum', slug: 'kokum-aamsul-products' },
  { label: 'Spices', slug: 'malvani-masala' },
  { label: 'Pickles', slug: 'lonche-pickles' },
];

export default function DiscoverForYouDesktop() {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [page, setPage] = useState(1);
  const [allProducts, setAllProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const catRef = useRef(null);
  const prevCountRef = useRef(0);

  const buildParams = (pageNum) => {
    const params = new URLSearchParams();
    params.set('limit', '24');
    params.set('page', String(pageNum));
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedPrice?.min) params.set('min_price', String(selectedPrice.min));
    if (selectedPrice?.max) params.set('max_price', String(selectedPrice.max));
    return params.toString();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch categories for dropdown
  const { data: catData } = useQuery({
    queryKey: ['categories-list-desktop'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data?.all || [];
    },
    staleTime: 300000,
  });
  const categories = catData || [];

  // Fetch products
  const { isLoading, isFetching } = useQuery({
    queryKey: ['discover-products-desktop', selectedCategory, selectedPrice, page],
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
          // Ensure count is a multiple of 5 so 5-col grid rows stay balanced
          if (newProducts.length % 5 !== 0) {
            newProducts = newProducts.slice(0, -(newProducts.length % 5));
          }
          return [...prev, ...newProducts];
        });
      }
      setHasMore(page < totalPages);
      return products;
    },
    staleTime: 0,
  });

  const selectedCatName = selectedCategory
    ? categories.find((c) => c.slug === selectedCategory)?.name || 'All Categories'
    : 'All Categories';

  const handleFilterChange = (type, value) => {
    if (type === 'category') {
      setSelectedCategory(value);
      setCatDropdownOpen(false);
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

  const isPriceActive = (chip) =>
    selectedPrice?.min === chip.min && selectedPrice?.max === chip.max;

  return (
    <section>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="section-title">Discover Products For You</h2>
          <p className="section-subtitle">Handpicked Konkan finds — refresh for new suggestions</p>
        </div>
      </div>

      {/* ── Filter Row ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Categories dropdown */}
        <div className="relative" ref={catRef}>
          <button
            onClick={() => setCatDropdownOpen(!catDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{
              backgroundColor: selectedCategory ? '#1B3B2F' : '#FFFFFF',
              color: selectedCategory ? '#FFFFFF' : '#1A1A1A',
              border: selectedCategory ? '1px solid #1B3B2F' : '1px solid #E0E0E0',
              boxShadow: selectedCategory ? '0 1px 4px rgba(27,59,47,0.25)' : 'none',
            }}
          >
            {selectedCatName}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          {catDropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-lg border z-50 py-1 max-h-60 overflow-y-auto"
              style={{ borderColor: '#E0E0E0' }}
            >
              <button
                onClick={() => handleFilterChange('category', '')}
                className="block w-full text-left px-4 py-2.5 text-sm hover:bg-[#E8F0EC] transition-colors"
                style={{ color: !selectedCategory ? '#1B3B2F' : '#1A1A1A', fontWeight: !selectedCategory ? 600 : 400 }}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleFilterChange('category', cat.slug)}
                  className="block w-full text-left px-4 py-2.5 text-sm hover:bg-[#E8F0EC] transition-colors"
                  style={{
                    color: selectedCategory === cat.slug ? '#1B3B2F' : '#1A1A1A',
                    fontWeight: selectedCategory === cat.slug ? 600 : 400,
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category shortcut buttons — one click, no dropdown scrolling */}
        <div className="flex items-center gap-2 flex-wrap">
          {SHORTCUT_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => handleFilterChange('category', isActive ? '' : cat.slug)}
                className="px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
                style={{
                  backgroundColor: isActive ? '#2D6A4F' : '#F0F7F3',
                  color: isActive ? '#FFFFFF' : '#1B3B2F',
                  border: isActive ? '1px solid #2D6A4F' : '1px solid #D8E8DF',
                  boxShadow: isActive ? '0 1px 4px rgba(45,106,79,0.3)' : 'none',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Price range chips — active chip is clearly highlighted (green fill) */}
        {PRICE_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleFilterChange('price', chip)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95"
            style={{
              backgroundColor: isPriceActive(chip) ? '#1B3B2F' : '#FFFFFF',
              color: isPriceActive(chip) ? '#FFFFFF' : '#1A1A1A',
              border: isPriceActive(chip) ? '1px solid #1B3B2F' : '1px solid #E0E0E0',
              boxShadow: isPriceActive(chip) ? '0 1px 4px rgba(27,59,47,0.25)' : 'none',
            }}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Product Grid: 5 columns — same height/width as Flash Sale cards ── */}
      <div className="grid grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <ProductCarouselCardSkeleton />
            </div>
          ))
        ) : allProducts.length > 0 ? (
          allProducts.slice(0, page * 15).map((product, index) => {
            const isNew = index >= prevCountRef.current;
            return (
              <div
                key={product.id}
                className="h-full"
                style={isNew ? {
                  animation: `fadeInUp 0.4s ease-out ${Math.min((index - prevCountRef.current) * 0.03, 0.25)}s both`,
                } : undefined}
              >
                <ProductCarouselCard product={product} />
              </div>
            );
          })
        ) : (
          <div
            className="col-span-5 text-center py-12"
            style={{ color: '#8A8A8A', fontSize: '15px' }}
          >
            No products found. Try adjusting your filters.
          </div>
        )}
      </div>

      {/* ── Load More Button ── */}
      {!isLoading && hasMore && allProducts.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            disabled={isFetching}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.97] disabled:opacity-60"
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
