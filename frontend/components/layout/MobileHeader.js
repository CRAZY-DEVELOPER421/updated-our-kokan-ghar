'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import useCartStore from '@/lib/store/cartStore';
import useAuthStore from '@/lib/store/authStore';
import api from '@/lib/api';
import { useSiteSettings } from '@/lib/hooks/useSiteSettings';
import { getImageUrl } from '@/lib/utils';
import SuspensionTimer from '@/components/ui/SuspensionTimer';

export default function MobileHeader() {
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartStore((s) => s.itemCount);
  const { isAuthenticated, suspended, suspension, clearSuspended, fetchProfile, logout } = useAuthStore();
  const { data: settingsData } = useSiteSettings();

  // Admin-managed navbar links (same source as the desktop navbar).
  const { data: navData } = useQuery({
    queryKey: ['navbar-items'],
    queryFn: async () => {
      const res = await api.get('/navbar');
      return res.data?.data?.items || [];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
  const navItems = navData && navData.length > 0
    ? navData.map((item) => ({ label: item.label || item.label_key, href: item.href }))
    : [];
  const customLogo = getImageUrl(settingsData?.settings?.site_logo);

  // Unread notification count — real data from GET /notifications (unread_count)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=1');
      return res.data?.data?.unread_count || 0;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when hamburger menu is open
  useEffect(() => {
    if (menuOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [menuOpen]);

  return (
    <>
      {/* ── Sticky Main Header Bar ── */}
      <header
        className="bg-white dark:bg-[#0f0f1a]"
        style={{ boxShadow: '0 2px 6px rgba(0,0,0,0.08)' }}
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center min-w-[44px] min-h-[44px] -ml-2"
            style={{ color: '#1A1A1A' }}
            aria-label="Toggle menu"
            suppressHydrationWarning
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Center: Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {customLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customLogo} alt="Kokan Ghar Logo" className="h-8 w-auto" />
            ) : (
              <>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#3A7D5C' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span
                  className="font-bold text-[18px]"
                  style={{ fontFamily: "'Poppins', sans-serif", color: '#1B3B2F' }}
                >
                  Konkan Ghar
                </span>
              </>
            )}
          </Link>

          {/* Right: Theme Toggle + Search + Bell + Cart */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <Link
              href="/search"              className="flex items-center justify-center min-w-[44px] min-h-[44px] dark:text-gray-200"
              style={{ color: '#1A1A1A' }}
              aria-label="Search"
          >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {/* Suspended chip — compact, replaces the bell icon area visually */}
            {mounted && suspended && (
              <span
                className="flex items-center gap-1 px-2 py-1 rounded-full border"
                style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FEF2F2', fontSize: '10px', fontWeight: 700 }}
                title={suspension?.message || 'Account suspended'}
              >
                <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Suspended
                {suspension?.suspendUntil && (
                  <SuspensionTimer
                    until={suspension.suspendUntil}
                    compact
                    onExpire={() => { clearSuspended(); fetchProfile(); }}
                  />
                )}
              </span>
            )}

            {/* Notifications */}
            <Link
              href="/account/notifications"
              className="relative flex items-center justify-center min-w-[44px] min-h-[44px]"
              style={{ color: '#1A1A1A' }}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {mounted && isAuthenticated && unreadCount > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: '#F5821F' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              id="fly-cart-target"
              href="/cart"
              className="relative flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2"
              style={{ color: '#1A1A1A' }}
              aria-label={`Shopping cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {mounted && cartCount > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: '#F5821F' }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>


      {/* ── Mobile Menu Overlay with Smooth Slide ── */}
      <div
        className={`fixed inset-0 z-[150] transition-all duration-300 ease-out ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      >
        {/* Backdrop fade */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        />
        {/* Sidebar panel slide from left */}
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-white dark:bg-[#0f0f1a] shadow-xl flex flex-col transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              {customLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customLogo} alt="Kokan Ghar Logo" className="h-7 w-auto" />
              ) : (
                <span className="font-bold text-base" style={{ fontFamily: "'Poppins', sans-serif", color: '#1B3B2F' }}>
                  Konkan Ghar
                </span>
              )}
              <button onClick={() => setMenuOpen(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2" style={{ color: '#8A8A8A' }} suppressHydrationWarning>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#8A8A8A' }}>Shop</p>
              {[
                { label: 'All Products', href: '/products' },
                { label: 'Shop by Region', href: '/#shop-by-region' },
                { label: 'Seafood', href: '/categories/coastal-seafood' },
                { label: 'Pickles', href: '/categories/pickles-chutneys' },
                { label: 'Spices', href: '/categories/natural-spices' },
                { label: 'Rice & Flours', href: '/categories/konkan-rice-varieties' },
                { label: 'Snacks', href: '/products?category=snacks' },
                { label: 'Oils & Coconut', href: '/categories/coconut-products' },
                { label: 'Beverages', href: '/categories/kokum-beverages' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-[#E8F0EC] dark:hover:bg-[#1e1e30] transition-colors dark:text-gray-200"
                  style={{ color: '#1A1A1A' }}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{item.label}</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: '#8A8A8A' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
              <hr className="my-3 border-gray-100 dark:border-[#2a2a40]" />
              <p className="text-[10px] font-semibold uppercase tracking-widest dark:text-gray-400" style={{ color: '#8A8A8A' }}>Pages</p>
              {(navItems.length > 0
                ? navItems.filter((i) => !i.href.startsWith('/#') && !i.href.startsWith('/products?') && !i.href.startsWith('/categories/'))
                : [
                    { label: 'Offers', href: '/offers' },
                    { label: 'About Us', href: '/about' },
                    { label: 'Blog', href: '/blog' },
                    { label: 'Contact', href: '/contact' },
                  ]
              ).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-[#E8F0EC] dark:hover:bg-[#1e1e30] transition-colors dark:text-gray-200"
                  style={{ color: '#1A1A1A' }}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{item.label}</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: '#8A8A8A' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
              <hr className="my-3 border-gray-100 dark:border-[#2a2a40]" />
              <p className="text-[10px] font-semibold uppercase tracking-widest dark:text-gray-400" style={{ color: '#8A8A8A' }}>Account</p>
              {suspended ? (
                <>
                  <div
                    className="px-3 py-3 rounded-xl border"
                    style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
                  >
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Suspended
                    </div>
                    {suspension?.suspendUntil && (
                      <div className="mt-1.5">
                        <SuspensionTimer
                          until={suspension.suspendUntil}
                          compact
                          onExpire={() => { clearSuspended(); fetchProfile(); }}
                        />
                      </div>
                    )}
                    <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#991B1B' }}>
                      {suspension?.message || 'Your account is suspended. You can only browse the home page.'}
                    </p>
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full mt-3 py-2 rounded-lg text-sm font-semibold border transition-colors"
                      style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FFFFFF' }}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                [
                  { label: 'My Account', href: '/account' },
                  { label: 'Orders', href: '/account/orders' },
                  { label: 'Wishlist', href: '/wishlist' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-[#E8F0EC] dark:hover:bg-[#1e1e30] transition-colors dark:text-gray-200"
                    style={{ color: '#1A1A1A' }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: '#8A8A8A' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))
              )}
            </nav>
          </div>
        </div>
    </>
  );
}
