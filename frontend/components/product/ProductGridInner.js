'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import ProductGrid from './ProductGrid';
import Pagination from '@/components/ui/Pagination';

export default function ProductGridInner({ page, sort, category, sub, q, minPrice, maxPrice, rating, organic, seasonal, bestseller, discount, region, brand, inStock }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: '24' });
    if (sort && sort !== 'relevance') params.set('sort', sort);
    if (category) params.set('category', category);
    if (sub) params.set('sub', sub);
    if (q) params.set('q', q);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (rating) params.set('rating', rating);
    if (organic) params.set('organic', organic);
    if (seasonal) params.set('seasonal', seasonal);
    if (bestseller) params.set('bestseller', bestseller);
    if (discount) params.set('discount', discount);
    if (region) params.set('region', region);
    if (brand) params.set('brand', brand);
    if (inStock) params.set('in_stock', inStock);
    return params.toString();
  }, [page, sort, category, sub, q, minPrice, maxPrice, rating, organic, seasonal, bestseller, discount, region, brand, inStock]);

  useEffect(() => {
    setLoading(true);
    api.get(`/products?${queryString}`)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [queryString]);

  if (loading) return <ProductGrid loading={true} />;
  if (!data) return <div className="text-center py-12 text-konkan-text-secondary">Failed to load products.</div>;

  const currentParams = Object.fromEntries(searchParams.entries());

  return (
    <>
      <ProductGrid products={data.data?.products || []} />
      <Pagination
        currentPage={page}
        totalPages={data.pagination?.pages || 1}
        baseUrl="/products"
        params={currentParams}
      />
    </>
  );
}
