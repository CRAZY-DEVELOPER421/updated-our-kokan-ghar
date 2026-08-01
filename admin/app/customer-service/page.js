'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

const TYPE_BADGES = {
  text: { label: 'Text', className: 'bg-blue-50 text-blue-700' },
  faq: { label: 'FAQ', className: 'bg-purple-50 text-purple-700' },
};

export default function AdminCustomerServicePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-customer-service'],
    queryFn: async () => {
      const res = await api.get('/admin/customer-service');
      return res.data.data;
    },
    retry: 1,
  });

  const pages = data?.pages || [];

  const filtered = pages.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (p.title || '').toLowerCase().includes(q) || (p.service_key || '').toLowerCase().includes(q);
  });

  const handleToggle = async (p) => {
    try {
      await api.put(`/admin/customer-service/${p.id}`, { is_active: p.is_active ? 0 : 1 });
      toast.success(p.is_active ? 'Page hidden.' : 'Page published.');
      queryClient.invalidateQueries({ queryKey: ['admin-customer-service'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update page.');
    }
  };

  const handleDelete = async (p) => {
    const label = p.service_key;
    if (!confirm(`Delete "${p.title}" (${label})? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/customer-service/${p.id}`);
      toast.success('Page deleted.');
      queryClient.invalidateQueries({ queryKey: ['admin-customer-service'] });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete page.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><Skeleton className="w-44 h-8 mb-1" /><Skeleton className="w-28 h-4" /></div>
          <Skeleton className="w-32 h-9 rounded-lg" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div className="flex-1"><Skeleton className="w-48 h-4 mb-1" /><Skeleton className="w-32 h-3" /></div>
              <Skeleton className="w-24 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Customer Service</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load customer service pages</span>
            <button onClick={() => refetch()} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Service</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {pages.length} page{pages.length !== 1 ? 's' : ''} — Terms, Returns, Shipping, FAQ, Privacy & custom pages
          </p>
        </div>
        <Link href="/customer-service/new">
          <Button size="sm">+ Add New Service</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages..."
          className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">{search ? 'No pages match your search' : 'No customer service pages yet'}</span>
            <p className="text-xs text-slate-400">Add your first service page — Terms, Return Policy, FAQ, or anything else.</p>
            <Link href="/customer-service/new"><Button size="sm">+ Add New Service</Button></Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3 hidden sm:table-cell">Type</th>
                <th className="px-4 py-3 hidden md:table-cell">Key</th>
                <th className="px-4 py-3 hidden lg:table-cell">Sections</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => {
                const badge = TYPE_BADGES[p.page_type] || TYPE_BADGES.text;
                const sectionCount = p.page_type === 'faq'
                  ? (p.content?.categories?.length || 0) + ' categories'
                  : `${(p.content?.sections?.length || 0)} sections`;
                return (
                  <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 18, height: 18 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-400">/{p.service_key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${badge.className}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <code className="text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{p.service_key}</code>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">{sectionCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(p)}
                          className={`relative w-9 h-5 rounded-full transition-colors ${p.is_active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                          aria-label={p.is_active ? 'Hide page' : 'Publish page'}
                          title={p.is_active ? 'Published — click to hide' : 'Hidden — click to publish'}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${p.is_active ? 'translate-x-4' : ''}`} />
                        </button>
                        <Link
                          href={`/customer-service/${p.id}`}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1 rounded-md transition-all"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p)}
                          className="text-xs font-medium text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-md transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        Tip: The 5 default pages (/terms, /return-policy, /shipping-policy, /faq, /privacy) are always served by the
        storefront. Custom pages you add here are available through the public API too.
      </p>
    </div>
  );
}
