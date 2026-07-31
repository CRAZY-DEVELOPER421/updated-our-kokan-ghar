'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/lib/store/authStore';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import Breadcrumb from '@/components/ui/Breadcrumb';

const NAV_ITEMS = [
  { href: '/account', key: 'dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { href: '/account/profile', key: 'my_profile', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
  { href: '/account/orders', key: 'orders', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
  { href: '/account/addresses', key: 'addresses', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { href: '/account/wishlist', key: 'wishlist', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg> },
  { href: '/account/loyalty', key: 'loyalty_points', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { href: '/account/notifications', key: 'notifications', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg> },
];

export default function AccountLayout({ children }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Build translated nav items
  const translatedNavItems = NAV_ITEMS.map(item => ({
    ...item,
    label: t(`account.${item.key}`),
  }));

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const currentPage = translatedNavItems.find(item => {
    if (item.href === '/account') return pathname === '/account';
    return pathname.startsWith(item.href);
  });

  const breadcrumbItems = [
    { label: t('account.title'), href: '/account' },
    ...(currentPage && currentPage.href !== '/account' ? [{ label: currentPage.label }] : []),
  ];

  return (
    <div className="bg-konkan-cream/30 min-h-screen">
      <div className="container-custom py-6 md:py-8">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary">
            {currentPage?.label || t('account.title')}
          </h1>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-konkan-cream text-konkan-text-secondary"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className="flex gap-6 lg:gap-8 relative">
          {/* Sidebar Overlay (mobile) */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            fixed lg:sticky top-0 lg:top-4 z-30 lg:z-0
            w-64 lg:w-56 xl:w-64 h-full lg:h-fit
            bg-white rounded-2xl card p-4 shrink-0
            transition-transform duration-300 ease-out
            ${sidebarOpen ? 'translate-x-0 left-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            {/* User Info */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-konkan-sand/50">
              <div className="w-10 h-10 rounded-full bg-konkan-green-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm text-konkan-text-primary truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-konkan-text-secondary truncate">{user?.email || ''}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1">
              {translatedNavItems.map((item) => {
                const isActive = item.href === '/account'
                  ? pathname === '/account'
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-konkan-green-primary text-white shadow-sm'
                        : 'text-konkan-text-secondary hover:text-konkan-green-primary hover:bg-konkan-cream'
                    }`}
                  >
                    <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Language */}
            <div className="mt-4 pt-4 border-t border-konkan-sand/50 space-y-3">
              <div className="px-3">
                <p className="text-[10px] font-medium text-konkan-text-secondary uppercase tracking-wider mb-2">{t('account.language')}</p>
                <LanguageSwitcher variant="dropdown" className="w-full" />
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-konkan-text-secondary hover:text-konkan-error hover:bg-red-50 transition-all w-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {t('account.sign_out')}
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
