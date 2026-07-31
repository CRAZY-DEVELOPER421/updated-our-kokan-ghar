'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Playfair_Display, Inter } from 'next/font/google';
import { QueryProviders } from '@/lib/providers/QueryProviders';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import ToastProvider from '@/components/ui/Toast';
import useAdminAuthStore from '@/lib/store/adminAuthStore';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  preload: true,
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

// ── Sidebar Navigation ───
const SIDEBAR_SECTIONS = [
  {
    label: null,
    items: [
      { href: '/', label: 'Dashboard', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/products', label: 'All Products', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
      { href: '/products/new', label: 'Add Product', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg> },
      { href: '/categories', label: 'Categories', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/orders', label: 'Orders', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
      { href: '/coupons', label: 'Coupons', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/blogs', label: 'Blogs', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg> },
      { href: '/videos', label: 'Videos', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { href: '/team', label: 'Team', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/products', label: 'Manage Stock', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg> },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/users', label: 'Customers', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg> },
      { href: '/analytics', label: 'Analytics', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    ],
  },
];

function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAdminAuthenticated, adminLogout } = useAdminAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const unsub = useAdminAuthStore.persist.onFinishHydration(() => setHydrated(true));
    if (useAdminAuthStore.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  // Auth check: redirect if not authenticated or missing JWT token
  useEffect(() => {
    if (!hydrated) return;
    if (isLoginPage) return;

    if (!isAdminAuthenticated) {
      router.push('/login');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('⚠️ Old session without JWT token - re-login required');
      adminLogout();
      router.push('/login');
    }
  }, [hydrated, isAdminAuthenticated, isLoginPage, router, adminLogout]);

  // Listen for forced logout from API interceptor (e.g. refresh token fails)
  useEffect(() => {
    const handleForceLogout = () => {
      adminLogout();
      if (!isLoginPage) {
        router.push('/login');
      }
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, [isLoginPage, router, adminLogout]);

  if (isLoginPage) return children;

  if (!hydrated || !isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-[#1B4332] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-konkan-green-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-konkan-cream/80">
      {/* ══ Desktop Sidebar ══ */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen bg-[#1B4332] transition-all duration-300 hidden lg:flex flex-col ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand */}
        <div className={`flex items-center h-16 px-4 border-b border-konkan-green-primary/30 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-konkan-saffron flex items-center justify-center text-white text-[10px] font-bold shadow-sm">KB</div>
              <div>
                <h1 className="text-sm font-bold text-white leading-tight">Control Panel</h1>
                <p className="text-[9px] text-konkan-green-light/50 font-medium uppercase tracking-widest">Management</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && <div className="w-7 h-7 rounded bg-konkan-saffron flex items-center justify-center text-white text-[10px] font-bold shadow-sm">KB</div>}
          {!sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(true)} className="p-1 rounded text-konkan-green-light/50 hover:text-konkan-green-light hover:bg-white/5 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
          {sidebarCollapsed && (
            <button onClick={() => setSidebarCollapsed(false)} className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-konkan-green-primary/70 border-2 border-konkan-green-primary/40 flex items-center justify-center text-konkan-green-light/70 hover:text-white transition-all">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
          {SIDEBAR_SECTIONS.map((section, si) => (
            <div key={si}>
              {section.label && !sidebarCollapsed && (
                <p className="px-3 mb-1.5 text-[9px] font-semibold text-konkan-green-light/50 uppercase tracking-[0.15em]">{section.label}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href + '/') || pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-konkan-green-primary/20 text-konkan-green-light'
                          : 'text-konkan-green-light/70 hover:text-white hover:bg-white/5'
                      } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className={isActive ? 'text-konkan-green-light' : 'text-konkan-green-light/40'}>{item.icon}</span>
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={`border-t border-konkan-green-primary/30 p-3 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <button
            onClick={adminLogout}
            className={`flex items-center gap-3 px-3 py-2 rounded text-sm font-medium text-konkan-green-light/50 hover:text-konkan-saffron hover:bg-konkan-saffron/10 transition-all w-full ${sidebarCollapsed ? 'justify-center' : ''}`}
            title={sidebarCollapsed ? 'Logout' : undefined}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ══ Header ══ */}
      <header className={`sticky top-0 z-20 bg-white border-b border-konkan-sand/50 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-konkan-green-light/60 hover:text-konkan-green-primary rounded-lg hover:bg-konkan-cream transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h2 className="text-sm font-semibold text-konkan-text-primary">Admin</h2>
              <p className="text-[10px] text-konkan-text-secondary">Dashboard overview</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button className="relative p-2 rounded text-konkan-green-light/60 hover:text-konkan-green-primary hover:bg-konkan-cream transition-all" title="Notifications">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-konkan-saffron rounded-full" />
            </button>

            <button className="p-2 rounded text-konkan-green-light/60 hover:text-konkan-green-primary hover:bg-konkan-cream transition-all" title="Settings">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <div className="w-px h-6 bg-konkan-sand mx-1" />

            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-konkan-green-primary flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-konkan-text-primary">Admin</p>
                <p className="text-[10px] text-konkan-text-secondary">admin@kokanghar.in</p>
              </div>
            </div>

            <button onClick={adminLogout} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-konkan-saffron hover:text-[#d95f0e] hover:bg-konkan-saffron/10 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══ Mobile Sidebar ══ */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-[#1B4332] shadow-2xl">
            <div className="flex items-center justify-between h-16 px-4 border-b border-konkan-green-primary/30">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-konkan-saffron flex items-center justify-center text-white text-[10px] font-bold shadow-sm">KB</div>
                <div>
                  <h1 className="text-sm font-bold text-white leading-tight">Control Panel</h1>
                  <p className="text-[9px] text-konkan-green-light/50 font-medium uppercase tracking-widest">Management</p>
                </div>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded text-konkan-green-light/50 hover:text-white hover:bg-white/5 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-3 space-y-5 overflow-y-auto h-[calc(100%-64px)]">
              {SIDEBAR_SECTIONS.map((section, si) => (
                <div key={si}>
                  {section.label && <p className="px-3 mb-1.5 text-[9px] font-semibold text-konkan-green-light/50 uppercase tracking-[0.15em]">{section.label}</p>}
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href + '/') || pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all ${
                            isActive ? 'bg-konkan-green-primary/20 text-konkan-green-light' : 'text-konkan-green-light/70 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className={isActive ? 'text-konkan-green-light' : 'text-konkan-green-light/40'}>{item.icon}</span>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <hr className="border-konkan-green-primary/30" />
              <button
                onClick={() => { adminLogout(); setMobileSidebarOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-konkan-saffron hover:bg-konkan-saffron/10 transition-all w-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ══ Main ══ */}
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'} pt-0`}>
        <div className="p-4 lg:p-6">{children}</div>
      </main>
    </div>
  );
}

// ── Root wrapper with providers ───────────────────────────
export default function AdminRootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <QueryProviders>
          <I18nProvider>
          <ToastProvider />
          <AdminLayout>
            {children}
          </AdminLayout>
          </I18nProvider>
        </QueryProviders>
      </body>
    </html>
  );
}
