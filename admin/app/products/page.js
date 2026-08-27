'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import { downloadCSV } from '@/lib/csv';

const PER_PAGE = 25;

const SORT_OPTIONS = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'price', label: 'Price' },
  { key: 'mrp', label: 'MRP' },
  { key: 'stock_quantity', label: 'Stock' },
  { key: 'category_name', label: 'Category' },
  { key: 'created_at', label: 'Created' },
];

function SortIcon({ active, direction }) {
  return (
    <span className="inline-flex flex-col items-center leading-none ml-1 -mr-1">
      <svg className={`w-2 h-2 -mb-0.5 ${active && direction === 'asc' ? 'text-emerald-600' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 10 6"><path d="M5 0L10 6H0z" /></svg>
      <svg className={`w-2 h-2 ${active && direction === 'desc' ? 'text-emerald-600' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 10 6"><path d="M5 6L0 0h10z" /></svg>
    </span>
  );
}

function Th({ label, sortKey, currentSort, onSort, className = '' }) {
  const active = currentSort.key === sortKey;
  return (
    <th
      className={`px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider select-none cursor-pointer hover:text-slate-800 transition-colors ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-0.5">
        {label}
        <SortIcon active={active} direction={currentSort.direction} />
      </span>
    </th>
  );
}

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [imageStatus, setImageStatus] = useState('');
  const [productStatus, setProductStatus] = useState('');
  const [sort, setSort] = useState({ key: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const queryParams = useMemo(() => {
    // Fetch ALL products (current catalog = 570) so every product is visible;
    // sorting + pagination happen client-side below. Bump if the catalog grows.
    const p = new URLSearchParams({ page: String(page), limit: '5000' });
    if (searchTerm) p.set('search', searchTerm);
    if (selectedCategory) p.set('category', selectedCategory);
    if (imageStatus) p.set('imageStatus', imageStatus);
    if (productStatus) p.set('status', productStatus);
    return p.toString();
  }, [page, searchTerm, selectedCategory, imageStatus, productStatus]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-products', queryParams],
    queryFn: async () => {
      const res = await api.get(`/admin/products?${queryParams}`);
      return res.data.data;
    },
    retry: 1,
  });

  useEffect(() => {
    api.get('/admin/categories')
      .then(res => setCategories(res.data.data?.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, imageStatus, productStatus]);

  const allProducts = data?.products || [];

  const sorted = useMemo(() => {
    const arr = [...allProducts];
    const { key, direction } = sort;
    const dir = direction === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let aVal = a[key], bVal = b[key];
      if (key === 'price' || key === 'mrp' || key === 'stock_quantity') {
        return ((parseFloat(aVal) || 0) - (parseFloat(bVal) || 0)) * dir;
      }
      if (key === 'created_at') {
        return (new Date(aVal).getTime() - new Date(bVal).getTime()) * dir;
      }
      return ((aVal || '').toString().toLowerCase().localeCompare((bVal || '').toString().toLowerCase())) * dir;
    });
    return arr;
  }, [allProducts, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = sorted.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const startItem = sorted.length === 0 ? 0 : (safePage - 1) * PER_PAGE + 1;
  const endItem = Math.min(safePage * PER_PAGE, sorted.length);

  const handleSort = (key) => {
    setSort(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 7;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, safePage - 2);
      let end = Math.min(totalPages - 1, safePage + 2);
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  const [importing, setImporting] = useState(false);

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/import/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        const d = res.data.data;
        alert(`Import complete!\n\nCreated: ${d.created}\nUpdated: ${d.updated}\nSkipped: ${d.skipped}\nTotal rows: ${d.total_rows}` + (d.errors?.length ? `\n\nErrors:\n${d.errors.join('\n')}` : ''));
        refetch();
      } else {
        alert('Import failed: ' + (res.data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Import failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const activeFilterCount = [selectedCategory, searchTerm, imageStatus, productStatus].filter(Boolean).length;

  // ── Render ──
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-32 h-8 mb-1" /><Skeleton className="w-20 h-4" /></div>
          <div className="flex gap-2"><Skeleton className="w-48 h-10 rounded-lg" /><Skeleton className="w-32 h-10 rounded-lg" /></div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1"><Skeleton className="w-48 h-4 mb-1" /><Skeleton className="w-32 h-3" /></div>
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-12 h-4" />
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        </div>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load products</span>
            <span className="text-xs text-slate-500">Please check your connection and try again.</span>
            <button onClick={() => refetch()} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {sorted.length} product{sorted.length !== 1 ? 's' : ''}
            {activeFilterCount > 0 && <span className="text-slate-400 ml-1">(filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400" />
            {searchInput && (
              <button onClick={() => { setSearchInput(''); setSearchTerm(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          {/* Filters */}
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => (<option key={c.id} value={c.id}>{c.name} ({c.product_count || 0})</option>))}
          </select>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" value={imageStatus} onChange={e => setImageStatus(e.target.value)}>
            <option value="">All Images</option>
            <option value="uploaded">Has Image</option>
            <option value="pending">No Image</option>
          </select>
          <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" value={productStatus} onChange={e => setProductStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            onClick={() => downloadCSV('/export/products', 'products.csv')}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-emerald-300 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export
          </button>
          <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 hover:border-emerald-300 transition-all cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <Link href="/products/new"><Button size="sm">+ Add Product</Button></Link>
        </div>
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">No products found{searchTerm || selectedCategory || imageStatus || productStatus ? ' matching your filters' : ''}</span>
            <p className="text-xs text-slate-400 max-w-[300px]">
              {searchTerm || selectedCategory || imageStatus || productStatus
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first product to the store.'}
            </p>
            {!searchTerm && !selectedCategory && !imageStatus && !productStatus && (
              <Link href="/products/new"><Button size="sm">+ Add Your First Product</Button></Link>
            )}
            {(searchTerm || selectedCategory || imageStatus || productStatus) && (
              <button onClick={() => { setSearchInput(''); setSearchTerm(''); setSelectedCategory(''); setImageStatus(''); setProductStatus(''); }} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Clear all filters</button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          {/* Info bar */}
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing <strong className="text-slate-700">{startItem}–{endItem}</strong> of <strong className="text-slate-700">{sorted.length}</strong> products</span>
            <span className="hidden sm:block text-slate-400">
              Sorted by <strong className="text-slate-600">{SORT_OPTIONS.find(o => o.key === sort.key)?.label || sort.key}</strong> ({sort.direction === 'asc' ? 'ascending' : 'descending'})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-left">
                <tr>
                  <Th label="Product" sortKey="name" currentSort={sort} onSort={handleSort} className="w-[32%]" />
                  <Th label="SKU" sortKey="sku" currentSort={sort} onSort={handleSort} className="hidden md:table-cell" />
                  <Th label="Price" sortKey="price" currentSort={sort} onSort={handleSort} />
                  <Th label="Stock" sortKey="stock_quantity" currentSort={sort} onSort={handleSort} />
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-2.5">
                      <Link href={`/products/${p.id}`} className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border ${p.image ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50'}`}>
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-slate-900 text-sm truncate max-w-[230px] group-hover:text-emerald-700 transition-colors">{p.name}</span>
                            {!!p.is_bundle && (
                              <span className="shrink-0 text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Combo</span>
                            )}
                          </div>
                          {p.category_name && <span className="text-[10px] text-slate-400 mt-0.5 block truncate">{p.category_name}{p.region_origin ? ` · ${p.region_origin}` : ''}</span>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500 hidden md:table-cell">{p.sku}</td>
                    <td className="px-4 py-2.5 text-xs whitespace-nowrap">
                      <span className="font-bold text-slate-900">₹{Number(p.price).toLocaleString('en-IN')}</span>
                      {p.mrp > p.price && <span className="text-slate-400 line-through ml-1.5 text-[10px]">₹{Number(p.mrp).toLocaleString('en-IN')}</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums px-2 py-0.5 rounded-md ${
                        p.stock_quantity === 0 ? 'bg-rose-50 text-rose-700' :
                        p.stock_quantity <= 10 ? 'bg-amber-50 text-amber-700' :
                        'text-slate-900 bg-slate-50'
                      }`}>
                        {p.stock_quantity === 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                        {p.stock_quantity <= 10 && p.stock_quantity > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                        p.stock_quantity === 0 ? 'bg-rose-50 text-rose-700' :
                        p.stock_quantity <= 10 ? 'bg-amber-50 text-amber-700' :
                        p.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.stock_quantity === 0 ? 'Out of Stock' :
                         p.stock_quantity <= 10 ? 'Limited Stock' :
                         p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/products/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all group-hover:shadow-sm"
                      >
                        Edit
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">Page {safePage} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(Math.max(1, safePage - 1))} disabled={safePage <= 1} className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                {pageNumbers.map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-slate-400">…</span>
                  ) : (
                    <button key={p} onClick={() => setCurrentPage(p)} className={`min-w-[32px] px-2 py-1.5 rounded-md text-xs font-medium transition-all ${p === safePage ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}>
                      {p}
                    </button>
                  )
                )}
                <button onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages} className="px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
