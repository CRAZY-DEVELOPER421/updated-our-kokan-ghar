'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { downloadCSV } from '@/lib/csv';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  processing: { label: 'Processing', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  shipped: { label: 'Shipped', color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  delivered: { label: 'Delivered', color: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  cancelled: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  returned: { label: 'Returned', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

const STATUSES = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const params = { page, limit: 20 };
  if (statusFilter) params.status = statusFilter;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-orders', params],
    queryFn: async () => {
      const res = await api.get(`/admin/orders?${new URLSearchParams(params).toString()}`);
      return res.data.data;
    },
    retry: 1,
  });

  const orders = data?.orders || [];
  const totalOrders = data?.pagination?.total || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">{totalOrders} total order{totalOrders !== 1 ? 's' : ''}{statusFilter ? ` (${statusFilter})` : ''}</p>
        </div>
        <button
          onClick={() => downloadCSV('/export/orders', 'orders.csv', statusFilter ? { status: statusFilter } : {})}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Export CSV
        </button>
      </div>

      {/* Status Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {STATUSES.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === s
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700'
            }`}
          >
            {s ? STATUS_CONFIG[s]?.label || s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-20 h-4" />
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-10 h-4" />
                <Skeleton className="w-16 h-4" />
                <Skeleton className="w-12 h-5 rounded-full" />
                <Skeleton className="w-24 h-4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load orders</span>
            <button onClick={() => refetch()} className="text-xs font-medium text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg hover:bg-emerald-100 transition-colors">Try Again</button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && orders.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-600">
              {statusFilter ? `No ${statusFilter} orders found` : 'No orders yet'}
            </span>
            <p className="text-xs text-slate-400">Orders will appear here once customers start purchasing.</p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && !isError && orders.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Order #</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden sm:table-cell">Items</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden md:table-cell">Payment</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/orders/${o.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-bold text-slate-500 group-hover:text-emerald-700 transition-colors">#{o.order_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700 shrink-0">
                          {(o.user?.name || o.user_name || 'G').charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-slate-900 truncate max-w-[140px]">{o.user?.name || o.user_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">
                      <span className="font-mono">{o.item_count || o.items?.length || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-slate-900 tabular-nums">₹{Number(o.total_amount).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        o.payment_status === 'paid' || o.payment_status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        o.payment_status === 'pending' ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {o.payment_status === 'paid' || o.payment_status === 'completed' ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> : null}
                        {o.payment_status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize border whitespace-nowrap ${STATUS_CONFIG[o.status]?.color || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {o.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-500 hidden lg:table-cell">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination?.pages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all">Previous</button>
              <span className="text-xs text-slate-500">Page {page} of {data?.pagination?.pages}</span>
              <button onClick={() => setPage(Math.min(data?.pagination?.pages, page + 1))} disabled={page >= data?.pagination?.pages} className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
