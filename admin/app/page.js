'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';

// ── Skeleton Components ──────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-konkan-sand/60 p-5">
      <Skeleton className="w-10 h-10 rounded-lg mb-3" />
      <Skeleton className="w-24 h-7 mb-1.5" />
      <Skeleton className="w-16 h-3" />
    </div>
  );
}

function ListSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-24 h-4" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-4" />
            <Skeleton className="w-16 h-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBarSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-6 h-3" />
          </div>
          <Skeleton className="w-full h-1.5 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Animated Counter ─────────────────────────────────────
function AnimatedValue({ value, prefix = '', suffix = '' }) {
  return (
    <span className="tabular-nums">
      {prefix}{value}{suffix}
    </span>
  );
}

// ── Stat Card ────────────────────────────────────────────
function StatCard({ icon, label, value, accent = 'indigo', trend }) {
  const accents = {
    indigo: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-600', ring: 'ring-emerald-200/50' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500', ring: 'ring-blue-200/50' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-500', ring: 'ring-violet-200/50' },
    cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-500', ring: 'ring-cyan-200/50' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500', ring: 'ring-rose-200/50' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'text-slate-500', ring: 'ring-slate-200/50' },
  };
  const a = accents[accent] || accents.indigo;

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200/70 p-5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/20 transition-all duration-300 cursor-default">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${a.bg} flex items-center justify-center ${a.icon} ring-1 ${a.ring} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${trend.up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
            <svg className={`w-2.5 h-2.5 ${trend.up ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-0.5 tabular-nums tracking-tight">{value}</p>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
    </div>
  );
}

// ── Status Badge ─────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-slate-100 text-slate-700 border-slate-200',
    confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
    processing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shipped: 'bg-violet-50 text-violet-700 border-violet-200',
    out_for_delivery: 'bg-amber-50 text-amber-700 border-amber-200',
    delivered: 'bg-sky-50 text-sky-700 border-sky-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    returned: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  const s = styles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold capitalize border ${s} whitespace-nowrap`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ── Card Wrapper ─────────────────────────────────────────
function Card({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200/70 overflow-hidden hover:shadow-md transition-shadow duration-300 ${className}`}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────
function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-5">
      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      {description && <p className="text-xs text-slate-400 text-center max-w-[200px]">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// ── Error State ──────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-5">
      <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 mb-3">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-slate-600 mb-1">Failed to load data</p>
      <p className="text-xs text-slate-400 mb-3 text-center max-w-[250px]">{message || 'Please check your connection and try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors">
          Try Again
        </button>
      )}
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────
export default function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/dashboard');
      return res.data.data;
    },
    retry: 1,
    staleTime: 30000,
  });

  const stats = data?.stats || {};
  const recentOrders = data?.recent_orders || [];
  const ordersByStatus = data?.orders_by_status || [];
  const monthlyRevenue = data?.monthly_revenue || [];
  const topProducts = data?.top_products || [];
  const lowStock = data?.low_stock_products || [];
  const lowStockCount = lowStock.length;
  const activeProducts = stats.total_products || 0;

  const statCards = [
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>, label: 'Total Revenue', value: `₹${Number(stats.total_revenue || 0).toLocaleString('en-IN')}`, accent: 'indigo' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, label: 'Total Orders', value: (stats.total_orders || 0).toLocaleString('en-IN'), accent: 'blue' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>, label: 'Customers', value: (stats.total_users || 0).toLocaleString('en-IN'), accent: 'violet' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, label: 'Active Products', value: activeProducts.toLocaleString('en-IN'), accent: 'cyan' },
    { icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>, label: 'Low Stock', value: lowStockCount > 0 ? <span className="text-amber-500">{lowStockCount}</span> : 0, accent: lowStockCount > 0 ? 'rose' : 'slate' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your business performance</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
        >
          <svg className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : isError ? (
          <div className="col-span-full">
            <ErrorState message={error?.message} onRetry={() => refetch()} />
          </div>
        ) : (
          statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))
        )}
      </div>

      {/* Low Stock Alerts */}
      {!isLoading && !isError && lowStock.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200/70 overflow-hidden animate-fadeIn">
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100 bg-amber-50/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="text-sm font-semibold text-amber-800">Low Stock Alerts</h2>
              <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{lowStock.length} items</span>
            </div>
            <Link href="/products" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Manage Stock →</Link>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lowStock.slice(0, 6).map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-amber-100 hover:bg-amber-50/50 hover:border-amber-200 transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate max-w-[180px] group-hover:text-emerald-700 transition-colors">{p.name}</p>
                      {p.sku && <p className="text-[10px] text-slate-400 font-mono">{p.sku}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${p.stock_quantity <= 5 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-700'}`}>
                    {p.stock_quantity} left
                  </span>
                </Link>
              ))}
            </div>
            {lowStock.length > 6 && (
              <Link href="/products" className="block text-center text-xs text-emerald-600 hover:text-emerald-700 mt-3 font-medium transition-colors">
                +{lowStock.length - 6} more low stock products
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card
          title="Recent Orders"
          action={<Link href="/orders" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">View All →</Link>}
        >
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : isError ? (
            <ErrorState message="Could not load orders" onRetry={() => refetch()} />
          ) : recentOrders.length === 0 ? (
            <EmptyState
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              title="No orders yet"
              description="Orders will appear here once customers start purchasing."
            />
          ) : (
            <div className="p-5 space-y-1">
              {recentOrders.slice(0, 5).map((order, i) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-all group"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-slate-400 font-semibold w-16 shrink-0">#{order.order_number || order.id}</span>
                    <span className="text-xs text-slate-600 truncate group-hover:text-slate-900 transition-colors">{order.user_name || 'Guest'}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                    <StatusBadge status={order.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Order Status Breakdown */}
        <Card title="Order Status">
          {isLoading ? (
            <StatusBarSkeleton />
          ) : isError ? (
            <ErrorState message="Could not load order status" onRetry={() => refetch()} />
          ) : ordersByStatus.length === 0 ? (
            <EmptyState
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              title="No order data"
              description="Order status breakdown will show here once orders are placed."
            />
          ) : (
            <div className="p-5 space-y-4">
              {ordersByStatus.map((item) => {
                const total = ordersByStatus.reduce((sum, o) => sum + o.count, 0);
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-700 capitalize flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.status === 'pending' ? 'bg-slate-400' : item.status === 'confirmed' ? 'bg-blue-500' : item.status === 'processing' ? 'bg-emerald-500' : item.status === 'shipped' ? 'bg-violet-500' : item.status === 'delivered' ? 'bg-sky-500' : item.status === 'cancelled' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                        {item.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-slate-500 font-medium">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: item.status === 'pending' ? '#94a3b8' : item.status === 'confirmed' ? '#3b82f6' : item.status === 'processing' ? '#10b981' : item.status === 'shipped' ? '#8b5cf6' : item.status === 'delivered' ? '#0ea5e9' : item.status === 'cancelled' ? '#f43f5e' : '#94a3b8'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Lower Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card
          title="Top Products"
          action={<Link href="/products" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">View All →</Link>}
        >
          {isLoading ? (
            <ListSkeleton rows={4} />
          ) : isError ? (
            <ErrorState message="Could not load products" onRetry={() => refetch()} />
          ) : topProducts.length === 0 ? (
            <EmptyState
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              title="No products yet"
              description="Top selling products will appear here."
            />
          ) : (
            <div className="p-5 space-y-1">
              {topProducts.slice(0, 5).map((p, idx) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-all group" style={{ animationDelay: `${idx * 50}ms` }}>
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold tabular-nums ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-100 text-slate-500' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-300'}`}>
                    {idx + 1}
                  </span>
                  <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate max-w-[200px] group-hover:text-emerald-700 transition-colors">{p.name}</p>
                    <p className="text-[10px] text-slate-400">{p.total_sold || 0} sold</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">₹{Number(p.price).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Monthly Revenue Trend */}
        <Card title="Monthly Revenue">
          {isLoading ? (
            <StatusBarSkeleton />
          ) : isError ? (
            <ErrorState message="Could not load revenue data" onRetry={() => refetch()} />
          ) : monthlyRevenue.length === 0 ? (
            <EmptyState
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
              title="No revenue data yet"
              description="Monthly revenue trends will appear once orders are completed."
            />
          ) : (
            <div className="p-5 space-y-3">
              {monthlyRevenue.slice(-6).map((item) => {
                const max = Math.max(...monthlyRevenue.map(r => r.revenue));
                const pct = max > 0 ? (item.revenue / max) * 100 : 0;
                return (
                  <div key={item.month}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">{item.month}</span>
                      <span className="text-slate-900 font-bold tabular-nums">₹{Number(item.revenue).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #059669, #10b981)' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
