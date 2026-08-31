'use client';

import { useState, useEffect, useRef } from 'react';
import useScrollDirection from '@/lib/hooks/useScrollDirection';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Menu, X, ChevronRight, Heart, ShoppingBag, User, ChevronDown, Bell } from 'lucide-react';
import useAuthStore from '@/lib/store/authStore';
import useCartStore from '@/lib/store/cartStore';
import useWishlistStore from '@/lib/store/wishlistStore';
import { useCategories } from '@/lib/hooks/useProducts';
import SearchBar from '@/components/ui/SearchBar';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import DeliveryLocation from '@/components/layout/DeliveryLocation';
import SuspensionTimer from '@/components/ui/SuspensionTimer';
import { useSiteSettings } from '@/lib/hooks/useSiteSettings';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

// Fallback nav links — used when the API is unreachable. When the admin
// panel has configured navbar items, those take over (label_key resolves
// through translations, falling back to the plain label).
const FALLBACK_NAV_ITEMS = [
  { labelKey: 'shop_by_region', label: 'Shop by Region', href: '/#shop-by-region' },
  { labelKey: 'fresh_arrivals', label: 'Fresh Arrivals', href: '/products?sort=newest' },
  { labelKey: 'seasonal_picks', label: 'Seasonal Picks', href: '/products?seasonal=true' },
  { labelKey: 'seafood', label: 'Seafood', href: '/categories/coastal-seafood' },
  { labelKey: 'organic', label: 'Organic', href: '/products?organic=true' },
  { labelKey: 'cashew_special', label: 'Cashew Special', href: '/categories/cashew-dry-fruits' },
  { labelKey: 'konkan_mango', label: 'Konkan Mango', href: '/categories/konkan-mangoes-fruits' },
  { labelKey: 'offers', label: 'Offers', href: '/offers' },
  { labelKey: 'about', label: 'About', href: '/about' },
  { labelKey: 'blog', label: 'Blog', href: '/blog' },
  { labelKey: 'videos', label: 'Videos', href: '/videos' },
  { labelKey: 'contact', label: 'Contact', href: '/contact' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isScrolled } = useScrollDirection({ threshold: 5 });
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const [menuEverOpened, setMenuEverOpened] = useState(false);
  const closeCategoryMenu = () => { setIsCategoryOpen(false); setActiveCat(null); };
  const openCategoryMenu = () => { setIsCategoryOpen(true); setMenuEverOpened(true); };
  const pathname = usePathname();
  const router = useRouter();

  // Campaign landing pages are immersive — only the top bar (logo, search,
  // icons) is shown; the category nav row below it stays hidden there.
  const isCampaignPage = pathname?.startsWith('/campaign');
  const { user, isAuthenticated, suspended, suspension, clearSuspended, fetchProfile, logout } = useAuthStore();
  const { itemCount: cartCount } = useCartStore();
  const { count: wishlistCount } = useWishlistStore();
  const { data: categoriesData } = useCategories();

  // Admin-managed navbar links. Falls back to FALLBACK_NAV_ITEMS when the
  // API is down or returns nothing.
  const { data: navData } = useQuery({
    queryKey: ['navbar-items'],
    queryFn: async () => {
      const res = await api.get('/navbar');
      return res.data?.data?.items || [];
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
  const navItems = (navData && navData.length > 0)
    ? navData.map((item) => ({ labelKey: item.label_key, label: item.label, href: item.href }))
    : FALLBACK_NAV_ITEMS;
  // Resolve display label: translation key first, then the stored label.
  const navLabel = (item) => {
    if (item.labelKey) {
      const translated = t(`nav.${item.labelKey}`);
      if (translated && translated !== `nav.${item.labelKey}`) return translated;
    }
    return item.label || item.labelKey;
  };
  const { data: settingsData } = useSiteSettings();
  const categoryRef = useRef(null);

  // Promo banners for the mega-menu (fetched once, cached)
  const { data: bannersData } = useQuery({
    queryKey: ['banners-mega-menu'],
    queryFn: async () => {
      const res = await api.get('/banners');
      return res.data?.data?.banners || [];
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  // Pick the first active sidebar/promo banner for the mega-menu
  const megaBanner = (bannersData || []).find((b) => b.position === 'sidebar' || b.position === 'mega_menu') || bannersData?.[0] || null;

  // Unread notification count — same real data the mobile header uses
  // (GET /notifications returns unread_count). Keeps desktop/mobile badges in sync.
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-unread-count-desktop'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=1');
      return res.data?.data?.unread_count || 0;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const customLogo = getImageUrl(settingsData?.settings?.site_logo);

  // Fallback categories when API data unavailable
  const categories = categoriesData?.categories?.length > 0 ? categoriesData.categories : [
    { id: 1, name: 'Mangoes & Fruits', slug: 'konkan-mangoes-fruits', children: [] },
    { id: 2, name: 'Coastal Seafood', slug: 'coastal-seafood', children: [] },
    { id: 3, name: 'Coconut Products', slug: 'coconut-products', children: [] },
    { id: 4, name: 'Konkan Rice', slug: 'konkan-rice-varieties', children: [] },
    { id: 5, name: 'Cashew & Dry Fruits', slug: 'cashew-dry-fruits', children: [] },
    { id: 6, name: 'Natural Spices', slug: 'natural-spices', children: [] },
    { id: 7, name: 'Kokum & Beverages', slug: 'kokum-beverages', children: [] },
    { id: 8, name: 'Pickles & Chutneys', slug: 'pickles-chutneys', children: [] },
  ];
  const [mounted, setMounted] = useState(false);

  // Alphabetical (A–Z) ordering for the category menus — display-only, so
  // shoppers can find a specific category fast. Does NOT touch the admin's
  // sort_order, which is still used elsewhere (homepage sections, etc).
  const sortByName = (list = []) => [...list].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' })
  );
  const sortedCategories = sortByName(categories);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        closeCategoryMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open (works on iOS Safari too)
  useEffect(() => {
    if (isMobileOpen) {
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
  }, [isMobileOpen]);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 dark:bg-[#0f0f1a]/95 backdrop-blur-md shadow-nav' : 'bg-white dark:bg-[#0f0f1a]'}`}>
      {/* Main Navbar */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          {/* Logo - visible on all viewports, left end */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            {customLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customLogo} alt="Kokan Ghar Logo" className="h-10 w-auto" />
            ) : (
              <Image
                src="/images/logo/konkan_logo.png"
                alt="Kokan Ghar Logo"
                width={740}
                height={337}
                className="h-10 w-auto"
                priority
              />
            )}
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden lg:block flex-1 max-w-xl xl:max-w-2xl mx-4 xl:mx-6">
            <SearchBar />
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-1.5 lg:gap-3">
            {/* Delivery Location - Desktop only */}
            <DeliveryLocation />

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative text-konkan-text-secondary hover:text-konkan-green-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Wishlist${wishlistCount > 0 ? ` (${wishlistCount} items)` : ''}`}
            >
              <Heart className="w-5 h-5" />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-konkan-saffron text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Notifications — orange unread badge, same as mobile header */}
            <Link
              href="/account/notifications"
              className="relative text-konkan-text-secondary hover:text-konkan-green-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell className="w-5 h-5" />
              {mounted && isAuthenticated && unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#F5821F' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Cart — orange badge, same as mobile header */}
            <Link
              id="fly-cart-target"
              href="/cart"
              className="relative text-konkan-text-secondary hover:text-konkan-green-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Shopping cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#F5821F' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* Account / Profile — at the right end. Suspended accounts get a
                red "Suspended + countdown" chip instead of the profile. */}
            {mounted && (
              <>
                {suspended ? (
                  <div className="hidden lg:flex items-center gap-1.5">
                    <span
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-600"
                      title={suspension?.message || 'Account suspended'}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs font-bold uppercase tracking-wide">Suspended</span>
                      {suspension?.suspendUntil && (
                        <SuspensionTimer
                          until={suspension.suspendUntil}
                          compact
                          onExpire={() => { clearSuspended(); fetchProfile(); }}
                        />
                      )}
                    </span>
                    {/* Logout — the suspended user can still sign out and switch accounts */}
                    <button
                      onClick={logout}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                      aria-label="Sign out"
                      title="Sign out"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="text-xs font-semibold">{t('nav.sign_out')}</span>
                    </button>
                  </div>
                ) : isAuthenticated ? (
                  <div className="relative group hidden lg:block">
                    <button className="flex items-center gap-1.5 text-konkan-text-secondary hover:text-konkan-green-primary transition-colors min-w-[44px] min-h-[44px]" aria-label={`Account: ${user?.name?.split(' ')[0] || 'Profile'}`}>
                      <User className="w-5 h-5" />
                      <span className="text-sm">{user?.name?.split(' ')[0]}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-modal border border-konkan-sand opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50">                  <Link
                    href="/account/profile" className="block px-4 py-2.5 text-sm text-konkan-text-primary dark:text-gray-200 hover:bg-konkan-cream dark:hover:bg-[#1e1e30]">{t('account.my_profile')}</Link>
                      <Link href="/account/settings" className="block px-4 py-2.5 text-sm text-konkan-text-primary dark:text-gray-200 hover:bg-konkan-cream dark:hover:bg-[#1e1e30]">Settings</Link>
                      <Link href="/account/orders" className="block px-4 py-2.5 text-sm text-konkan-text-primary dark:text-gray-200 hover:bg-konkan-cream dark:hover:bg-[#1e1e30]">{t('account.orders')}</Link>
                      <Link href="/account/wishlist" className="block px-4 py-2.5 text-sm text-konkan-text-primary dark:text-gray-200 hover:bg-konkan-cream dark:hover:bg-[#1e1e30]">{t('nav.wishlist')}</Link>
                      <Link href="/account/loyalty" className="block px-4 py-2.5 text-sm text-konkan-text-primary dark:text-gray-200 hover:bg-konkan-cream dark:hover:bg-[#1e1e30]">{t('account.loyalty_points')}</Link>
                      <Link href="/account/referrals" className="block px-4 py-2.5 text-sm font-medium text-konkan-green-primary hover:bg-konkan-cream dark:hover:bg-[#1e1e30]">{t('account.refer_earn')}</Link>
                      <hr className="my-2 border-konkan-sand dark:border-[#2a2a40]" />
                      <button onClick={logout} className="block w-full text-left px-4 py-2.5 text-sm text-konkan-error hover:bg-konkan-cream">{t('nav.sign_out')}</button>
                    </div>
                  </div>
                ) : (
                  <Link href="/login" className="hidden lg:flex items-center gap-1.5 text-konkan-text-secondary hover:text-konkan-green-primary transition-colors min-w-[44px] min-h-[44px]" aria-label="Sign in to your account">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{t('nav.account')}</span>
                  </Link>
                )}
              </>
            )}

            {/* Hamburger - right end on mobile */}
            <button
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-konkan-text-primary dark:text-gray-200"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Links - Desktop (hidden on scroll down, and always on campaign pages) */}
      {!isCampaignPage && (
      <div
        className={`hidden lg:block transition-all duration-300 ease-out motion-reduce:transition-none ${
          isScrolled
            ? 'max-h-0 opacity-0 invisible pointer-events-none motion-reduce:hidden'
            : 'max-h-14 opacity-100 visible pointer-events-auto motion-reduce:block'
        }`}
      >
        <div className="border-t border-konkan-sand/50 dark:border-[#2a2a40]">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 flex items-center">
            {/* All Categories Dropdown */}
            <div className="relative" ref={categoryRef}>
              <button
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-konkan-green-primary hover:bg-konkan-green-dark transition-colors"
                onMouseEnter={openCategoryMenu}
                onClick={() => (isCategoryOpen ? closeCategoryMenu() : openCategoryMenu())}
                aria-haspopup="menu"
                aria-expanded={isCategoryOpen}
              >
                <Menu className="w-4 h-4" />
                {t('nav.all_categories')}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {menuEverOpened && (
                <div
                  className={`absolute top-full left-0 z-50 rounded-b-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-konkan-sand/60 dark:border-[#2a2a40] overflow-hidden bg-white dark:bg-[#0f0f1a] transition-all duration-200 ease-out ${
                    isCategoryOpen
                      ? 'opacity-100 translate-y-0 pointer-events-auto'
                      : 'opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                  style={{ width: 'min(95vw, 800px)' }}
                  onMouseLeave={closeCategoryMenu}
                  onTransitionEnd={() => { if (!isCategoryOpen) setMenuEverOpened(false); }}
                >
                  <div className="flex min-h-[340px] max-h-[calc(100vh-8rem)]">
                    {/* ── Left: Category list ── */}
                    <div className="w-[230px] shrink-0 border-r border-konkan-sand/30 dark:border-[#2a2a40] py-1.5 overflow-y-auto scrollbar-thin">
                      {sortedCategories.map((cat) => {
                        const catKey = cat.slug?.replace(/-/g, '_');
                        const isActive = activeCat?.id === cat.id;
                        const catImage = cat.image_url ? getImageUrl(cat.image_url) : null;
                        return (
                          <div
                            key={cat.id}
                            onMouseEnter={() => setActiveCat(cat)}
                            className="relative"
                          >
                            {/* Active indicator bar */}
                            <div
                              className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-konkan-green-primary transition-all duration-200 ${
                                isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
                              }`}
                            />
                            <Link
                              href={`/categories/${cat.slug}`}
                              className={`flex items-center gap-2.5 px-4 py-2.5 text-[13px] transition-all duration-150 ${
                                isActive
                                  ? 'text-konkan-green-primary font-semibold bg-konkan-cream/80 dark:bg-[#1a1a30]'
                                  : 'text-konkan-text-primary/80 dark:text-gray-300 hover:text-konkan-green-primary hover:bg-konkan-cream/40 dark:hover:bg-[#1a1a30]/50'
                              }`}
                              onClick={closeCategoryMenu}
                            >
                              {catImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={catImage} alt="" className={`w-7 h-7 rounded-lg object-cover shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                              ) : (
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-200 ${
                                  isActive
                                    ? 'bg-konkan-green-primary text-white'
                                    : 'bg-konkan-cream/80 dark:bg-[#1e1e30] text-konkan-green-primary/70'
                                }`}>
                                  {cat.name?.charAt(0)}
                                </span>
                              )}
                              <span className="min-w-0 truncate flex-1">{t(`nav.${catKey}`, { _default: cat.name })}</span>
                              {cat.children?.length > 0 && (
                                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-all duration-200 ${
                                  isActive ? 'text-konkan-green-primary translate-x-0.5' : 'text-konkan-text-secondary/40'
                                }`} />
                              )}
                            </Link>
                          </div>
                        );
                      })}
                    </div>

                    {/* ── Middle: Subcategories + featured ── */}
                    <div className="flex-1 overflow-y-auto p-5">
                      {/* Featured categories — visible when no category is hovered */}
                      <div className={activeCat ? 'hidden' : ''}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-1 h-5 bg-konkan-green-primary rounded-full" />
                          <h3 className="text-sm font-bold text-konkan-text-primary dark:text-white">Featured Categories</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {sortedCategories.slice(0, 6).map((cat) => {
                            const catImage = cat.image_url ? getImageUrl(cat.image_url) : null;
                            return (
                              <Link
                                key={cat.id}
                                href={`/categories/${cat.slug}`}
                                className="group flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent hover:border-konkan-green-primary/20 hover:bg-gradient-to-b hover:from-konkan-green-primary/5 hover:to-transparent dark:hover:from-konkan-green-primary/10 transition-all duration-200"
                                onClick={closeCategoryMenu}
                              >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-konkan-cream to-white dark:from-[#1a1a30] dark:to-[#12121f] flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                                  {catImage ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={catImage} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                  ) : (
                                    <span className="text-2xl font-bold text-konkan-green-primary/50 group-hover:text-konkan-green-primary transition-colors">
                                      {cat.name?.charAt(0)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-center">
                                  <span className="text-[13px] font-semibold text-konkan-text-primary dark:text-gray-200 group-hover:text-konkan-green-primary transition-colors leading-tight line-clamp-2 block">
                                    {cat.name}
                                  </span>
                                  {cat.product_count > 0 && (
                                    <span className="text-[10px] text-konkan-text-secondary/50 mt-0.5 block">
                                      {cat.product_count} products
                                    </span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      {/* Subcategories — visible when a category is hovered */}
                      {activeCat && (
                        <div key={activeCat.id} className="animate-fade-in">
                          <Link
                            href={`/categories/${activeCat.slug}`}
                            className="flex items-center justify-between mb-4 pb-3 border-b border-konkan-sand/30 dark:border-[#2a2a40] group"
                            onClick={closeCategoryMenu}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-1 h-5 bg-konkan-green-primary rounded-full" />
                              <h3 className="text-sm font-bold text-konkan-text-primary dark:text-white group-hover:text-konkan-green-primary transition-colors">
                                {activeCat.name}
                              </h3>
                              {activeCat.product_count > 0 && (
                                <span className="text-[10px] font-medium text-konkan-text-secondary/50 bg-konkan-cream dark:bg-[#1a1a30] px-2 py-0.5 rounded-full">
                                  {activeCat.product_count} products
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-konkan-green-primary font-semibold group-hover:translate-x-1 transition-transform duration-200">
                              View All →
                            </span>
                          </Link>
                          {activeCat.children?.length > 0 ? (
                            <div className="grid grid-cols-2 gap-x-8 gap-y-0.5">
                              {sortByName(activeCat.children).map((child, idx) => (
                                <Link
                                  key={child.id}
                                  href={`/categories/${child.slug}`}
                                  className="group flex items-center gap-2.5 py-2 text-sm text-konkan-text-secondary/80 dark:text-gray-400 hover:text-konkan-green-primary transition-all duration-150 rounded-lg px-2.5 -mx-2.5 hover:bg-konkan-cream/50 dark:hover:bg-[#1e1e30]"
                                  style={{ animationDelay: `${idx * 30}ms` }}
                                  onClick={closeCategoryMenu}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-konkan-green-primary/30 group-hover:bg-konkan-green-primary group-hover:scale-125 transition-all duration-200 shrink-0" />
                                  <span className="truncate font-medium group-hover:translate-x-0.5 transition-transform duration-150">{child.name}</span>
                                  {child.product_count > 0 && (
                                    <span className="text-[10px] text-konkan-text-secondary/40 group-hover:text-konkan-green-primary/60 ml-auto shrink-0 tabular-nums">
                                      {child.product_count}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <div className="w-12 h-12 rounded-full bg-konkan-cream dark:bg-[#1a1a30] flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                              <p className="text-sm text-konkan-text-secondary/60">No subcategories yet</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Right: Promo banner ── */}
                    {megaBanner && (
                      <div className="w-[180px] shrink-0 border-l border-konkan-sand/30 dark:border-[#2a2a40] p-3 flex flex-col gap-3">
                        <Link
                          href={megaBanner.link || megaBanner.href || '#'}
                          className="block rounded-2xl overflow-hidden flex-1 group/banner relative"
                          onClick={closeCategoryMenu}
                        >
                          {megaBanner.image_url ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getImageUrl(megaBanner.image_url)}
                                alt={megaBanner.title || megaBanner.text || 'Offer'}
                                className="w-full h-full object-cover rounded-2xl group-hover/banner:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl" />
                              <div className="absolute bottom-3 left-3 right-3">
                                <span className="text-white text-xs font-bold leading-tight block drop-shadow-lg">
                                  {megaBanner.title || megaBanner.text || 'Special Offer'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full min-h-[200px] bg-gradient-to-br from-konkan-saffron via-orange-500 to-red-500 rounded-2xl flex flex-col items-center justify-center p-4 text-center group-hover/banner:scale-[1.02] transition-transform duration-300">
                              <span className="text-3xl mb-2">🔥</span>
                              <span className="text-white text-sm font-bold leading-tight drop-shadow-lg">{megaBanner.title || megaBanner.text || 'Special Offer'}</span>
                              {megaBanner.subtitle && (
                                <span className="text-white/80 text-xs mt-1.5">{megaBanner.subtitle}</span>
                              )}
                            </div>
                          )}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* ── Bottom: View All Categories ── */}
                  <Link
                    href="/categories"
                    className="flex items-center justify-center gap-2 py-3 border-t border-konkan-sand/30 dark:border-[#2a2a40] bg-gradient-to-r from-konkan-green-primary/5 via-konkan-green-primary/10 to-konkan-green-primary/5 dark:from-konkan-green-primary/10 dark:via-konkan-green-primary/15 dark:to-konkan-green-primary/10 text-sm font-semibold text-konkan-green-primary hover:from-konkan-green-primary/10 hover:via-konkan-green-primary/15 hover:to-konkan-green-primary/10 transition-all duration-200 group"
                    onClick={closeCategoryMenu}
                  >
                    View All Categories
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                </div>
              )}
            </div>

            {/* Nav Items — admin-managed via the panel */}
            <div className="flex items-center gap-1 ml-2 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={`px-3 py-3 text-sm font-medium transition-colors rounded-lg whitespace-nowrap ${
                    pathname === item.href
                      ? 'text-konkan-green-primary bg-konkan-green-primary/5 dark:text-konkan-green-light dark:bg-konkan-green-light/10'
                      : 'text-konkan-text-secondary hover:text-konkan-green-primary hover:bg-konkan-green-primary/5 dark:text-gray-400 dark:hover:text-konkan-green-light dark:hover:bg-konkan-green-light/10'
                  }`}
                >
                  {navLabel(item)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Mobile Menu — Smooth Slide from Right */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ease-out ${
          isMobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      >
        {/* Backdrop fade */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        />
        {/* Sidebar panel slide from right */}          <div
          className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white dark:bg-[#0f0f1a] shadow-xl flex flex-col transition-transform duration-300 ease-out ${
            isMobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 sm:p-6 border-b border-konkan-sand/50 dark:border-[#2a2a40] shrink-0">
              <div className="flex items-center justify-between mb-4">
                <Link href="/" onClick={() => setIsMobileOpen(false)}>
                  {customLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={customLogo} alt="Kokan Ghar Logo" className="h-8 w-auto" />
                  ) : (
                    <Image
                      src="/images/logo/konkan_logo.png"
                      alt="Kokan Ghar Logo"
                      width={740}
                      height={337}
                      className="h-8 w-auto"
                    />
                  )}
                </Link>
                <button onClick={() => setIsMobileOpen(false)} className="min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-konkan-text-secondary hover:text-konkan-text-primary transition-colors" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 mt-3">
                <div className="flex-1">
                  <LanguageSwitcher variant="flag" />
                </div>
                {!isAuthenticated && (
                  <div className="flex gap-2">
                    <Link href="/login" className="flex-1 btn-primary text-center text-sm py-2" onClick={() => setIsMobileOpen(false)}>Sign In</Link>
                    <Link href="/signup" className="flex-1 btn-secondary text-center text-sm py-2" onClick={() => setIsMobileOpen(false)}>Sign Up</Link>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <nav className="space-y-1">
                {/* Category Links - from API */}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary dark:text-gray-400 mb-2">Categories</p>
                {sortedCategories.slice(0, 12).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream dark:hover:bg-[#1e1e30] transition-colors text-konkan-text-primary dark:text-gray-200"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                  </Link>
                ))}
                <Link
                  href="/categories"
                  className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-green-primary font-medium"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <span>All Categories</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <hr className="my-3 border-konkan-sand dark:border-[#2a2a40]" />

                {/* Nav Links — admin-managed via the panel */}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary dark:text-gray-400 mb-2">Pages</p>
                {navItems.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream dark:hover:bg-[#1e1e30] transition-colors text-konkan-text-primary dark:text-gray-200"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span>{navLabel(item)}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                  </Link>
                ))}

                <hr className="my-3 border-konkan-sand dark:border-[#2a2a40]" />

                {/* Account Links */}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary dark:text-gray-400 mb-2">Account</p>
                {isAuthenticated ? (
                  <>
                    <Link href="/account/profile" className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary" onClick={() => setIsMobileOpen(false)}>
                      <span>{t('account.my_profile')}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                    </Link>
                    <Link href="/account/orders" className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary" onClick={() => setIsMobileOpen(false)}>
                      <span>{t('account.orders')}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                    </Link>
                    <Link href="/account/wishlist" className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary" onClick={() => setIsMobileOpen(false)}>
                      <span>{t('nav.wishlist')}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                    </Link>
                    <Link href="/account/loyalty" className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary" onClick={() => setIsMobileOpen(false)}>
                      <span>{t('account.loyalty_points')}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                    </Link>
                    <Link href="/account/referrals" className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-green-primary font-medium" onClick={() => setIsMobileOpen(false)}>
                      <span>{t('account.refer_earn')}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                    </Link>
                    <Link href="/account/settings" className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary" onClick={() => setIsMobileOpen(false)}>
                      <span>Settings</span>
                      <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                    </Link>
                    <hr className="my-2 border-konkan-sand" />
                    <button onClick={() => { logout(); setIsMobileOpen(false); }} className="flex w-full items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-konkan-error">
                      <span>{t('nav.sign_out')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary" onClick={() => setIsMobileOpen(false)}>
                      <span>Sign In</span>
                      <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                    </Link>
                    <Link href="/signup" className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary" onClick={() => setIsMobileOpen(false)}>
                      <span>Sign Up</span>
                      <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                    </Link>
                  </>
                )}
              </nav>
            </div>
        </div>
      </div>


    </header>
  );
}
