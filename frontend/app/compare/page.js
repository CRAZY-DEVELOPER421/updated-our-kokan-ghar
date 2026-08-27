'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import useCompareStore from '@/lib/store/compareStore';

export default function ComparePage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const clearAll = useCompareStore((s) => s.clearAll);

  useEffect(() => {
    const ids = searchParams.getAll('p').map(Number).filter(Boolean);
    if (ids.length === 0) {
      setError('No products selected for comparison. Go to the products page and select items to compare.');
      setLoading(false);
      return;
    }

    // Sync URL ids into the store
    clearAll();
    ids.forEach((id) => useCompareStore.getState().toggleProduct(id));

    setLoading(true);
    api.get(`/products/by-ids?ids=${ids.join(',')}`)
      .then((res) => {
        const list = res.data?.data?.products || [];
        if (list.length === 0) {
          setError('Could not load any of the selected products.');
        }
        setProducts(list);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load products for comparison.');
        setLoading(false);
      });
  }, []);

  const rows = [
    {
      label: 'Price',
      render: (p) => {
        const price = parseFloat(p.price) || 0;
        const mrp = parseFloat(p.mrp) || 0;
        return (
          <div>
            <span className="text-lg font-bold text-konkan-green-primary">₹{price}</span>
            {mrp > price && mrp > 0 && (
              <span className="text-xs text-gray-400 line-through ml-1.5">₹{mrp}</span>
            )}
          </div>
        );
      },
    },
    {
      label: 'MRP',
      render: (p) => <span className="text-sm text-gray-600">₹{p.mrp || '—'}</span>,
    },
    {
      label: 'Discount',
      render: (p) => {
        const discount = parseFloat(p.discount_percent) || 0;
        const price = parseFloat(p.price) || 0;
        const mrp = parseFloat(p.mrp) || 0;
        const calc = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
        const d = discount || calc;
        return d > 0 ? (
          <span className="inline-flex items-center text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            {d}% OFF
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      },
    },
    {
      label: 'Rating',
      render: (p) => {
        const rating = parseFloat(p.average_rating) || 0;
        const count = p.review_count || 0;
        return (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="w-3.5 h-3.5" fill={s <= Math.round(rating) ? '#F4A261' : 'none'} stroke="#F4A261" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium">{rating > 0 ? rating.toFixed(1) : '—'}</span>
            {count > 0 && <span className="text-xs text-gray-400">({count})</span>}
          </div>
        );
      },
    },
    { label: 'Weight', render: (p) => <span className="text-sm text-gray-600">{p.weight_grams ? `${p.weight_grams}g` : '—'}</span> },
    { label: 'Shelf Life', render: (p) => <span className="text-sm text-gray-600">{p.shelf_life_days ? `${p.shelf_life_days} days` : '—'}</span> },
    { label: 'Region', render: (p) => <span className="text-sm text-gray-600">{p.region_origin || '—'}</span> },
    { label: 'Brand', render: (p) => <span className="text-sm text-gray-600">{p.brand || '—'}</span> },
    { label: 'Category', render: (p) => <span className="text-sm text-gray-600">{p.category_name || '—'}</span> },
    { label: 'In Stock', render: (p) => {
      const qty = p.stock_quantity || 0;
      return qty > 0 ? (
        <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
          In Stock ({qty})
        </span>
      ) : (
        <span className="inline-flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
          Out of Stock
        </span>
      );
    }},
    { label: 'Free Delivery', render: (p) => p.free_delivery ? (
      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
    ) : (
      <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
    )},
    { label: 'Organic', render: (p) => p.is_organic ? (
      <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Yes</span>
    ) : (
      <span className="text-xs text-gray-400">No</span>
    )},
    { label: 'Sold', render: (p) => <span className="text-sm text-gray-600">{p.total_sold || 0}</span> },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-konkan-green-primary/20 border-t-konkan-green-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading comparison...</p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Nothing to Compare</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link href="/products" className="inline-block bg-konkan-green-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-konkan-green-dark transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Compare Products</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} product{products.length > 1 ? 's' : ''} selected</p>
        </div>
        <Link href="/products" className="text-sm text-konkan-green-primary hover:underline font-medium">
          + Add more
        </Link>
      </div>

      {/* Desktop comparison table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Product headers */}
          <thead>
            <tr>
              <th className="w-[160px] lg:w-[200px] p-3 text-left text-xs text-gray-400 font-medium align-top"></th>
              {products.map((p) => (
                <th key={p.id} className="p-3 text-center align-top min-w-[200px]">
                  <Link href={`/products/${p.slug}`} className="block group">
                    <div className="relative w-28 h-28 mx-auto mb-3 rounded-xl overflow-hidden bg-[#f5f0eb] border border-gray-100 group-hover:border-konkan-green-primary/30 transition-colors">
                      {p.primary_image ? (
                        <Image src={getImageUrl(p.primary_image)} alt={p.name} fill sizes="112px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-konkan-green-primary transition-colors">
                      {p.name}
                    </h3>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.label} className={idx % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                <td className="p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t border-gray-100">
                  {row.label}
                </td>
                {products.map((p) => (
                  <td key={p.id} className="p-3 text-center border-t border-gray-100">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
            {/* Action row */}
            <tr>
              <td className="p-3"></td>
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center border-t border-gray-200">
                  <Link
                    href={`/products/${p.slug}`}
                    className="inline-block w-full py-2.5 bg-konkan-green-primary text-white text-sm font-semibold rounded-xl hover:bg-konkan-green-dark transition-colors"
                  >
                    View Product
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile comparison — stacked cards */}
      <div className="sm:hidden space-y-4">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex gap-3 p-3">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-[#f5f0eb] shrink-0">
                {p.primary_image ? (
                  <Image src={getImageUrl(p.primary_image)} alt={p.name} fill sizes="80px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <Link href={`/products/${p.slug}`} className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-konkan-green-primary transition-colors">
                  {p.name}
                </Link>
                <div className="mt-1">
                  {rows[0].render(p)}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {rows.slice(1).map((row) => (
                <div key={row.label} className="flex items-center justify-between px-3 py-2">
                  <span className="text-xs font-medium text-gray-400">{row.label}</span>
                  {row.render(p)}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-100">
              <Link href={`/products/${p.slug}`} className="block w-full py-2 bg-konkan-green-primary text-white text-sm font-semibold rounded-lg text-center hover:bg-konkan-green-dark transition-colors">
                View Product
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom spacing for the floating bar */}
      <div className="h-20" />
    </div>
  );
}
