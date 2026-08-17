'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import useAuthStore from '@/lib/store/authStore';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

/* ── Icons (inline SVG, same library pattern as the rest of the app) ─────── */
const I = {
  chevron: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>,
  orders: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  buyAgain: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  heart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
  pin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  card: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  coin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  coupon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  help: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  logout: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  clock: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  truck: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  check: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  x: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
};

/* ── Menu rows for the mobile redesign ───────────────────────────────────── */
const MENU_ITEMS = [
  { label: 'My Orders', desc: 'Track, return or buy again', href: '/account/orders', icon: I.orders },
  { label: 'Buy Again', desc: 'Shop your previous purchases', href: '/account/buy-again', icon: I.buyAgain },
  { label: 'Wishlist', desc: 'Your saved favorite items', href: '/account/wishlist', icon: I.heart },
  { label: 'Addresses', desc: 'Manage delivery addresses', href: '/account/addresses', icon: I.pin },
  { label: 'Payment Methods', desc: 'UPI, Cards, Wallets & more', href: '/account/payment-methods', icon: I.card },
  { label: 'Konkan Coins & Rewards', desc: 'View rewards, coins & offers', href: '/account/loyalty', icon: I.coin },
  { label: 'Refer & Earn', desc: 'Share your code, earn 50 coins per friend', href: '/account/referrals', icon: I.coin },
  { label: 'Coupons & Offers', desc: 'Explore all offers and discounts', href: '/coupons', icon: I.coupon },
  { label: 'Help Center', desc: 'FAQs, guides and support', href: '/faq', icon: I.help },
  { label: 'Settings', desc: 'Notifications, language & more', href: '/account/settings', icon: I.settings },
];

/* ── Order status strip (4 columns, counts from the orders API) ──────────── */
const STATUS_STRIP = [
  { key: 'pending', label: 'Pending', icon: I.clock, color: 'text-amber-600', bg: 'bg-amber-100', badge: 'bg-amber-500' },
  { key: 'shipped', label: 'Shipped', icon: I.truck, color: 'text-blue-600', bg: 'bg-blue-100', badge: 'bg-blue-500' },
  { key: 'delivered', label: 'Delivered', icon: I.check, color: 'text-emerald-600', bg: 'bg-emerald-100', badge: 'bg-emerald-500' },
  { key: 'cancelled', label: 'Cancelled', icon: I.x, color: 'text-red-600', bg: 'bg-red-100', badge: 'bg-red-500' },
];

export default function AccountDashboard() {
  const { user, logout } = useAuthStore();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['account-dashboard'],
    queryFn: async () => {
      // Lightweight per-status count queries (limit=1, only pagination.total is used)
      const statusGroups = [
        { key: 'pending', statuses: ['pending', 'confirmed', 'processing'] },
        { key: 'shipped', statuses: ['shipped', 'out_for_delivery'] },
        { key: 'delivered', statuses: ['delivered'] },
        { key: 'cancelled', statuses: ['cancelled'] },
      ];
      const allStatuses = statusGroups.flatMap((g) => g.statuses);

      const [ordersRes, wishlistRes, loyaltyRes, ...statusRes] = await Promise.all([
        api.get('/orders?limit=5'),
        api.get('/wishlist'),
        api.get('/users/loyalty').catch(() => ({ data: { data: { points: user?.loyalty_points || 0 } } })),
        ...allStatuses.map((s) => api.get(`/orders?status=${s}&limit=1`).catch(() => null)),
      ]);

      // Sum pagination.total per status group
      const statusToGroup = {};
      statusGroups.forEach((g) => g.statuses.forEach((s) => { statusToGroup[s] = g.key; }));
      const statusCounts = { pending: 0, shipped: 0, delivered: 0, cancelled: 0 };
      allStatuses.forEach((s, i) => {
        const total = statusRes[i]?.data?.data?.pagination?.total || 0;
        const key = statusToGroup[s];
        if (key) statusCounts[key] += total;
      });

      return {
        orders: ordersRes.data.data?.orders || [],
        orderCount: ordersRes.data.data?.pagination?.total || 0,
        statusCounts,
        wishlistCount: wishlistRes.data.data?.items?.length || wishlistRes.data.data?.wishlist?.length || 0,
        loyaltyPoints: loyaltyRes.data?.data?.points || loyaltyRes.data?.data?.loyalty?.points || user?.loyalty_points || 0,
        addressCount: user?.address_count || 0,
      };
    },
  });

  const firstName = user?.name?.split(' ')[0] || 'Valued Customer';
  const avatarChar = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const quickLinks = [
    { label: 'My Orders', href: '/account/orders', desc: 'Track and manage your orders', color: 'from-blue-500 to-blue-600' },
    { label: 'Wishlist', href: '/account/wishlist', desc: 'Your saved favourites', color: 'from-pink-500 to-pink-600' },
    { label: 'Addresses', href: '/account/addresses', desc: 'Manage delivery addresses', color: 'from-purple-500 to-purple-600' },
    { label: 'Loyalty Points', href: '/account/loyalty', desc: 'Earn rewards on every order', color: 'from-amber-500 to-amber-600' },
    { label: 'Refer & Earn', href: '/account/referrals', desc: 'Share code, earn coins per friend', color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div>
      {/* ══════════════════ MOBILE — NEW REDESIGN ══════════════════ */}
      <div className="md:hidden space-y-5">
        {/* ── Page title ── */}
        <h1 className="font-display text-2xl font-bold text-konkan-text-primary">My Account</h1>

        {/* ── Profile card ── */}
        <div className="bg-white rounded-2xl card p-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-konkan-green-primary flex items-center justify-center text-white font-display text-xl font-bold shrink-0">
            {avatarChar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-konkan-text-primary truncate">Hi {firstName}!</p>
            <p className="text-xs text-konkan-text-secondary mt-0.5">Welcome back to Konkan Ghar</p>
            <Link href="/account/profile" className="text-xs text-konkan-green-primary font-medium hover:underline mt-1 inline-block">
              View &amp; Edit Profile &gt;
            </Link>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[10px] text-konkan-text-secondary uppercase tracking-wide">Konkan Coins</p>
            {isLoading ? (
              <div className="h-7 w-12 mx-auto my-1"><Skeleton className="!h-7" /></div>
            ) : (
              <p className="text-2xl font-bold text-konkan-green-primary leading-tight">{stats?.loyaltyPoints ?? 0}</p>
            )}
            <Link href="/account/loyalty" className="text-xs text-konkan-green-primary font-medium hover:underline mt-0.5 inline-block">
              Redeem Now &gt;
            </Link>
          </div>
        </div>

        {/* ── Your Orders ── */}
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-konkan-text-primary">Your Orders</h2>
          <Link href="/account/orders" className="text-xs text-konkan-green-primary font-medium hover:underline">
            View all &gt;
          </Link>
        </div>

        {/* ── Order status strip ── */}
        {isLoading ? (
          <div className="bg-white rounded-2xl card p-4"><Skeleton className="!h-20" /></div>
        ) : (
          <div className="bg-white rounded-2xl card p-3 grid grid-cols-4 gap-1">
            {STATUS_STRIP.map((item) => (
              <Link key={item.key} href={`/account/orders?status=${item.key}`} className="flex flex-col items-center gap-1.5 py-1 rounded-xl hover:bg-konkan-cream transition-colors">
                <div className={`w-9 h-9 rounded-full ${item.bg} flex items-center justify-center ${item.color}`}>
                  {item.icon}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${item.badge}`} />
                  <span className="text-sm font-bold text-konkan-text-primary">{stats?.statusCounts?.[item.key] ?? 0}</span>
                </div>
                <span className="text-[10px] text-konkan-text-secondary font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Menu list ── */}
        <div className="bg-white rounded-2xl card divide-y divide-konkan-sand/40">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-3.5 hover:bg-konkan-cream transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-konkan-cream flex items-center justify-center text-konkan-green-primary shrink-0 group-hover:bg-konkan-green-primary group-hover:text-white transition-colors">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-konkan-text-primary">{item.label}</p>
                <p className="text-xs text-konkan-text-secondary truncate">{item.desc}</p>
              </div>
              <span className="text-konkan-sand group-hover:text-konkan-green-primary transition-colors shrink-0">{I.chevron}</span>
            </Link>
          ))}

          {/* Logout — same logic as the old hamburger menu's Sign Out */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 p-3.5 hover:bg-red-50 transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-konkan-error shrink-0 group-hover:bg-konkan-error group-hover:text-white transition-colors">
              {I.logout}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-konkan-error">Logout</p>
              <p className="text-xs text-konkan-text-secondary">Sign out from your account</p>
            </div>
            <span className="text-konkan-sand shrink-0">{I.chevron}</span>
          </button>
        </div>
      </div>

      {/* ══════════════════ DESKTOP — ORIGINAL LAYOUT ══════════════════ */}
      <div className="hidden md:block space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-konkan-green-primary to-konkan-green-secondary rounded-2xl p-6 text-white">
          <h2 className="font-display text-xl font-bold mb-1">
            Welcome back, {firstName}!
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
    </div>
  );
}
