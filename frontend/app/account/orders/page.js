'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';

const STATUS_OPTIONS = ['All', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_VARIANTS = {
  pending: 'default',
  confirmed: 'primary',
  processing: 'ocean',
  shipped: 'accent',
  delivered: 'success',
  cancelled: 'error',
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get('page') || '1');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');

  const apiParams = useMemo(() => {
    const p = { page, limit: 10 };
    if (statusFilter !== 'All') p.status = statusFilter;
    return p;
  }, [page, statusFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', apiParams],
    queryFn: async () => {
      const qs = new URLSearchParams(apiParams).toString();
      const res = await api.get(`/orders?${qs}`);
      return res.data.data;
    },
  });

  const orders = data?.orders || [];
  const pagination = data?.pagination || { page: 1, pages: 1 };

  const getStatusBadge = (status) => (
    <Badge variant={STATUS_VARIANTS[status] || 'default'} className="text-[10px] capitalize">
      {status}
    </Badge>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl card p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-1"><Skeleton variant="title" /><Skeleton variant="text" className="w-1/3" /></div>
            <Skeleton variant="badge" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
        {STATUS_OPTIONS.map((s) => (            <button
              key={s}              onClick={() => {
                setStatusFilter(s);
                const params = new URLSearchParams(searchParams.toString());
                if (s === 'All') params.delete('status'); else params.set('status', s);
                params.delete('page');
                router.replace(`/account/orders?${params.toString()}`);
              }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === s
                ? 'bg-konkan-green-primary text-white'
                : 'bg-white border border-konkan-sand text-konkan-text-secondary hover:border-konkan-green-primary hover:text-konkan-green-primary'
            }`}
          >
            {s === 'All' ? 'All Orders' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl card p-10 text-center">
          <div className="mb-4 flex justify-center">
            <svg className="w-10 h-10 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-1">No orders found</h2>
          <p className="text-sm text-konkan-text-secondary mb-4">
            {statusFilter === 'All' ? 'You haven\'t placed any orders yet.' : `No orders with status "${statusFilter}".`}
          </p>
          <Link href="/products"><Button>Start Shopping</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block bg-white rounded-xl card p-4 hover:shadow-card-hover transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-konkan-text-secondary">#{order.order_number}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-sm text-konkan-text-primary font-medium truncate">
                    {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                    {order.product_name ? ` · ${order.product_name}` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-konkan-text-secondary">
                    <span>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {order.payment_method && <span>{order.payment_method === 'online' ? 'Online' : 'COD'}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-konkan-saffron">₹{order.total_amount}</p>
                  <svg className="w-4 h-4 ml-auto mt-1 text-konkan-sand group-hover:text-konkan-green-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          baseUrl="/account/orders"
          params={statusFilter !== 'All' ? { status: statusFilter } : {}}
        />
      )}
    </div>
  );
}
