'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function getBundleStatus(b) {
  const now = new Date();
  const start = b.valid_from ? new Date(b.valid_from) : null;
  const end = b.valid_until ? new Date(b.valid_until) : null;
  if (!b.is_active) return { label: 'Inactive', color: 'bg-slate-100 text-slate-500' };
  if (end && now > end) return { label: 'Expired', color: 'bg-slate-100 text-slate-500' };
  if (start && now < start) return { label: 'Upcoming', color: 'bg-amber-50 text-amber-700' };
  return { label: 'Live', color: 'bg-emerald-50 text-emerald-700' };
}

export default function AdminBundlesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Fetch all bundles once (search is filtered client-side, so keep the queryKey stable)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-bundles'],
    queryFn: async () => {
      const res = await api.get('/admin/bundles');
      return res.data.data;
    },
    retry: 1,
  });

  const allBundles = data?.bundles || [];
  const bundles = search
    ? allBundles.filter(b => (b.name || '').toLowerCase().includes(search.toLowerCase()))
    : allBundles;

  const handleDelete = async (bundle) => {
    const linked = bundle.linked_product_name ? `\n\nLinked combo product "${bundle.linked_product_name}" will also be deleted.` : '';
    if (!confirm(`Delete bundle "${bundle.name}"?${linked}`)) return;
    try {
      await api.delete(`/admin/bundles/${bundle.id}`);
      toast.success('Bundle deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete bundle.'); }
  };

  const handleToggle = async (bundle) => {
    try {
      await api.put(`/admin/bundles/${bundle.id}`, { is_active: bundle.is_active ? 0 : 1 });
      queryClient.invalidateQueries({ queryKey: ['admin-bundles'] });
      toast.success(bundle.is_active ? 'Bundle deactivated' : 'Bundle activated');
    } catch (err) { toast.error('Failed to update bundle.'); }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-32 h-8 mb-1" /><Skeleton className="w-24 h-4" /></div>
          <Skeleton className="w-28 h-9 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-xl" />
              <div className="flex-1"><Skeleton className="w-48 h-4 mb-1" /><Skeleton className="w-32 h-3" /></div>
              <Skeleton className="w-24 h-4" />
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Bundles</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load bundles</span>
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
          <h1 className="text-2xl font-bold text-slate-900">Bundle Deals</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {bundles.length} bundle{bundles.length !== 1 ? 's' : ''}
            {search && <span className="text-slate-400 ml-1">(filtered)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none min-w-[180px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bundles..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
          </div>
          <Link href="/products/new?type=combo"><Button size="sm">+ Add Bundle</Button></Link>
        </div>
      </div>

      {/* Empty state */}
      {bundles.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">{search ? 'No bundles matching your search' : 'No bundles yet'}</span>
            <p className="text-xs text-slate-400">
              {search
                ? 'Try a different search term.'
                : 'Create combo packs to showcase multi-product deals on the Offers page.'}
            </p>
            {!search && (
              <Link href="/products/new?type=combo"><Button size="sm">+ Create Bundle</Button></Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {bundles.map((b) => {
            const status = getBundleStatus(b);
            const cover = b.products?.[0]?.primary_image;
            return (
              <div key={b.id} className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/10 transition-all duration-200">
                <div className="p-4 flex items-center gap-4">
                  {/* Cover */}
                  <Link href={`/bundles/${b.id}`} className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 flex items-center justify-center">
                    {cover ? (
                      <img src={getImageUrl(cover)} alt={b.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/bundles/${b.id}`} className="font-semibold text-slate-900 text-sm truncate max-w-[260px] group-hover:text-emerald-700 transition-colors">{b.name}</Link>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap ${status.color}`}>{status.label}</span>
                      {b.linked_product_name && (
                        <span className="text-[9px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded whitespace-nowrap">linked product</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">₹{Number(b.bundle_price).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-400 line-through">₹{Number(b.original_price).toLocaleString('en-IN')}</span>
                      {b.savings_percent > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{b.savings_percent}% OFF</span>}
                      <span className="text-[10px] text-slate-400">· {b.product_count || 0} product{(b.product_count || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    {b.valid_until && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {b.valid_from ? `${new Date(b.valid_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} → ` : ''}
                        {new Date(b.valid_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>

                  {/* Toggle */}
                  <button onClick={() => handleToggle(b)} className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${b.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`} aria-label={b.is_active ? 'Deactivate bundle' : 'Activate bundle'}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${b.is_active ? 'translate-x-5' : ''}`} />
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {b.product_id && (
                      <Link
                        href={`/products/${b.product_id}`}
                        title={b.linked_product_name ? `Open ${b.linked_product_name} in product editor` : 'Open linked product in editor'}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-md transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        Open Product
                      </Link>
                    )}
                    <Link href={`/bundles/${b.id}`} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-all">Edit</Link>
                    <button onClick={() => handleDelete(b)} className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-all">Delete</button>
                  </div>
                </div>

                {/* Member products strip */}
                {b.products && b.products.length > 0 && (
                  <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] text-slate-400 uppercase tracking-wide mr-1">Includes:</span>
                    {b.products.map(p => (
                      <span key={p.product_id} className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5">
                        {p.quantity > 1 && <span className="font-bold text-slate-400">{p.quantity}×</span>}
                        <span className="truncate max-w-[120px]">{p.name}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
