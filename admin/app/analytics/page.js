'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '@/lib/api';

const COLORS = ['#059669', '#F4A261', '#E87722', '#3B82F6', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'];

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-200 rounded ${className}`} />;
}

function ChartSkeleton({ height = 250 }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ height }}>
      <Skeleton className="w-3/4 h-4 mb-2" />
      <Skeleton className="w-full h-full max-h-[200px] rounded-lg" />
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
        <p className="font-semibold text-slate-900 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-slate-600">
            <span style={{ color: p.color }}>{p.name}: </span>
            <span className="font-bold text-slate-900">{formatter ? formatter(p.value) : p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdminAnalyticsPage() {
  const { data: dashboard, isLoading: dashLoading, isError: dashError } = useQuery({
    queryKey: ['admin-analytics-dashboard'],
    queryFn: async () => { const r = await api.get('/admin/analytics/dashboard'); return r.data.data; },
  });

  const { data: topProducts, isLoading: topLoading } = useQuery({
    queryKey: ['admin-analytics-top'],
    queryFn: async () => { const r = await api.get('/admin/analytics/top-products'); return r.data.data; },
  });

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['admin-analytics-categories'],
    queryFn: async () => { const r = await api.get('/admin/analytics/category-performance'); return r.data.data; },
  });

  const { data: searchTerms, isLoading: searchLoading } = useQuery({
    queryKey: ['admin-analytics-search'],
    queryFn: async () => { const r = await api.get('/admin/analytics/search-terms'); return r.data.data; },
  });

  const isLoading = dashLoading || topLoading || catLoading || searchLoading;
  const isError = dashError;

  const stats = [
    { label: 'Today Revenue', value: `₹${Number(dashboard?.stats?.today_revenue || 0).toLocaleString('en-IN')}`, change: dashboard?.stats?.today_revenue ? '+Today' : '₹0', accent: 'emerald' },
    { label: 'Total Revenue', value: `₹${Number(dashboard?.stats?.total_revenue || 0).toLocaleString('en-IN')}`, change: '+All time', accent: 'blue' },
    { label: 'Total Orders', value: `${dashboard?.stats?.total_orders || 0}`, change: `${dashboard?.stats?.pending_orders || 0} pending`, accent: 'violet' },
    { label: 'Active Users', value: `${dashboard?.stats?.total_users || 0}`, change: `${dashboard?.stats?.new_users || 0} new this week`, accent: 'cyan' },
  ];

  const revenueChartData = (dashboard?.monthly_revenue || []).map(m => ({ month: m.month || m.month_label, revenue: parseFloat(m.revenue) || 0 }));
  const statusChartData = (dashboard?.orders_by_status || []).map(s => ({ name: s.status?.replace(/_/g, ' ') || s.status, value: parseInt(s.count) }));
  const topProductsData = (topProducts?.products || []).slice(0, 8).map(p => ({
    name: p.name?.length > 20 ? p.name.substring(0, 20) + '...' : p.name || 'Product',
    sold: p.total_sold || 0,
  }));
  const categoryData = (categories?.categories || []).slice(0, 8).map(c => ({
    name: c.name?.length > 15 ? c.name.substring(0, 15) + '...' : c.name || 'Category',
    revenue: parseFloat(c.revenue) || 0,
    products: c.product_count || 0,
  }));

  const ACCENTS = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  };

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <div className="bg-white rounded-xl border border-rose-100 p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-slate-700">Failed to load analytics data</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Performance metrics and insights</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 bg-white border border-slate-200 rounded-lg cursor-not-allowed">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export (coming soon)
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={s.label} className="group bg-white rounded-xl p-4 border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all duration-200">
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="w-20 h-7" /><Skeleton className="w-16 h-3" /><Skeleton className="w-14 h-4 rounded" /></div>
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight group-hover:text-emerald-700 transition-colors">{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                <span className={`inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ACCENTS[s.accent] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {s.change}
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 text-sm mb-4">Monthly Revenue</h2>
          {isLoading ? (
            <ChartSkeleton height={250} />
          ) : revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<CustomTooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />} />
                <Bar dataKey="revenue" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {revenueChartData.map((_, i) => (
                    <Cell key={i} fill={i === revenueChartData.length - 1 ? '#059669' : '#34d399'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-slate-400">No revenue data yet.</div>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 text-sm mb-4">Orders by Status</h2>
          {isLoading ? (
            <ChartSkeleton height={250} />
          ) : statusChartData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="60%" height={220}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 w-full sm:w-auto">
                {statusChartData.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-slate-600 capitalize min-w-[80px]">{s.name}</span>
                    <span className="font-bold text-slate-900 tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-slate-400">No orders yet.</div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 text-sm mb-4">Top Products</h2>
          {isLoading ? (
            <ChartSkeleton height={250} />
          ) : topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProductsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip content={<CustomTooltip formatter={(v) => `${v} sold`} />} />
                <Bar dataKey="sold" fill="#10b981" radius={[0, 6, 6, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-slate-400">No product data yet.</div>
          )}
        </div>

        {/* Category Performance */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
          <h2 className="font-bold text-slate-900 text-sm mb-4">Category Performance</h2>
          {isLoading ? (
            <ChartSkeleton height={250} />
          ) : categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(v) => `₹${v}`} />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} />
                <Tooltip content={<CustomTooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />} />
                <Bar dataKey="revenue" fill="#E87722" radius={[0, 6, 6, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-sm text-slate-400">No category data yet.</div>
          )}
        </div>
      </div>

      {/* Search Terms */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 hover:shadow-md transition-shadow">
        <h2 className="font-bold text-slate-900 text-sm mb-4">Top Search Terms</h2>
        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
          </div>
        ) : (searchTerms?.terms || []).length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No search data yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(searchTerms?.terms || []).slice(0, 20).map((t, i) => (
              <span
                key={t.query || i}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 cursor-default ${
                  i < 3 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' :
                  i < 8 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  'bg-slate-50 text-slate-600 border border-slate-200'
                }`}
              >
                {t.query}
                <span className="opacity-60 ml-1 font-mono">({t.search_count || 0})</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
