'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import useAuthStore from '@/lib/store/authStore';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function AccountDashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['account-dashboard'],
    queryFn: async () => {
      const [ordersRes, wishlistRes, loyaltyRes] = await Promise.all([
        api.get('/orders?limit=5'),
        api.get('/wishlist'),
        api.get('/users/loyalty').catch(() => ({ data: { data: { points: user?.loyalty_points || 0 } } })),
      ]);
      const addresses = user?.address_count || 0;
      return {
        orders: ordersRes.data.data?.orders || [],
        orderCount: ordersRes.data.data?.pagination?.total || 0,
        wishlistCount: wishlistRes.data.data?.items?.length || wishlistRes.data.data?.wishlist?.length || 0,
        loyaltyPoints: loyaltyRes.data?.data?.points || user?.loyalty_points || 0,
        addressCount: addresses,
      };
    },
  });

  const quickLinks = [
    { label: 'My Orders', href: '/account/orders', desc: 'Track and manage your orders', color: 'from-blue-500 to-blue-600' },
    { label: 'Wishlist', href: '/account/wishlist', desc: 'Your saved favourites', color: 'from-pink-500 to-pink-600' },
    { label: 'Addresses', href: '/account/addresses', desc: 'Manage delivery addresses', color: 'from-purple-500 to-purple-600' },
    { label: 'Loyalty Points', href: '/account/loyalty', desc: 'Earn rewards on every order', color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-konkan-green-primary to-konkan-green-secondary rounded-2xl p-6 text-white">
        <h2 className="font-display text-xl font-bold mb-1">
          Welcome back, {user?.name?.split(' ')[0] || 'Valued Customer'}!
        </h2>
        <p className="text-white/80 text-sm">Here&apos;s what&apos;s happening with your account today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl card p-4"><Skeleton className="!h-16" /></div>
          ))
        ) : (
          <>
            <div className="bg-white rounded-xl card p-4 text-center">
              <p className="text-2xl font-bold text-konkan-green-primary">{stats?.orderCount || 0}</p>
              <p className="text-xs text-konkan-text-secondary mt-1">Total Orders</p>
              <Link href="/account/orders" className="text-xs text-konkan-green-primary hover:underline mt-2 inline-block">View Orders</Link>
            </div>
            <div className="bg-white rounded-xl card p-4 text-center">
              <p className="text-2xl font-bold text-konkan-saffron">{stats?.wishlistCount || 0}</p>
              <p className="text-xs text-konkan-text-secondary mt-1">Wishlist Items</p>
              <Link href="/account/wishlist" className="text-xs text-konkan-green-primary hover:underline mt-2 inline-block">View Wishlist</Link>
            </div>
            <div className="bg-white rounded-xl card p-4 text-center">
              <p className="text-2xl font-bold text-konkan-green-primary">{stats?.loyaltyPoints || 0}</p>
              <p className="text-xs text-konkan-text-secondary mt-1">Loyalty Points</p>
              <Link href="/account/loyalty" className="text-xs text-konkan-green-primary hover:underline mt-2 inline-block">View Rewards</Link>
            </div>
            <div className="bg-white rounded-xl card p-4 text-center">
              <p className="text-2xl font-bold text-konkan-green-primary">{stats?.addressCount || 0}</p>
              <p className="text-xs text-konkan-text-secondary mt-1">Saved Addresses</p>
              <Link href="/account/addresses" className="text-xs text-konkan-green-primary hover:underline mt-2 inline-block">Manage</Link>
            </div>
          </>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h3 className="font-display font-bold text-konkan-text-primary text-lg mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 bg-white rounded-xl card p-4 hover:shadow-card-hover transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center shrink-0`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-konkan-text-primary group-hover:text-konkan-green-primary transition-colors">{link.label}</p>
                <p className="text-xs text-konkan-text-secondary">{link.desc}</p>
              </div>
              <svg className="w-5 h-5 text-konkan-text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-konkan-text-primary text-lg">Recent Orders</h3>
          <Link href="/account/orders" className="text-xs text-konkan-green-primary hover:underline">View All</Link>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl card p-4"><Skeleton className="!h-12" /></div>
            ))}
          </div>
        ) : stats?.orders?.length > 0 ? (
          <div className="space-y-2">
            {stats.orders.slice(0, 3).map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between bg-white rounded-xl card p-4 hover:shadow-card-hover transition-all"
              >
                <div>
                  <p className="text-sm font-medium text-konkan-text-primary">#{order.order_number || order.id}</p>
                  <p className="text-xs text-konkan-text-secondary">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                    {' · '}₹{order.total_amount || order.total || 0}
                  </p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {order.status || 'Pending'}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl card p-6 text-center">
            <p className="text-konkan-text-secondary text-sm mb-2">No orders yet</p>
            <Link href="/products"><Button size="sm">Start Shopping</Button></Link>
          </div>
        )}
      </div>
    </div>
  );
}
