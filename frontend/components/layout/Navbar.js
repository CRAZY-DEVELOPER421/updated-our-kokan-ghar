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
import { getImageUrl } from '@/lib/utils';

const NAV_ITEMS = [
  { labelKey: 'fresh_arrivals', href: '/products?sort=newest' },
  { labelKey: 'seasonal_picks', href: '/products?seasonal=true' },
  { labelKey: 'seafood', href: '/categories/coastal-seafood' },
  { labelKey: 'organic', href: '/products?organic=true' },
  { labelKey: 'cashew_special', href: '/categories/cashew-dry-fruits' },
  { labelKey: 'konkan_mango', href: '/categories/konkan-mangoes-fruits' },
  { labelKey: 'offers', href: '/offers' },
  { labelKey: 'about', href: '/about' },
  { labelKey: 'blog', href: '/blog' },
  { labelKey: 'videos', href: '/videos' },
  { labelKey: 'contact', href: '/contact' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isScrolled } = useScrollDirection({ threshold: 5 });
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const closeCategoryMenu = () => { setIsCategoryOpen(false); setActiveCat(null); };
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, suspended, suspension, clearSuspended, fetchProfile, logout } = useAuthStore();
  const { itemCount: cartCount } = useCartStore();
  const { count: wishlistCount } = useWishlistStore();
  const { data: categoriesData } = useCategories();
  const { data: settingsData } = useSiteSettings();
  const categoryRef = useRef(null);

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
    <header className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-nav' : 'bg-white'}`}>
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

            {/* Notifications */}
            <Link
              href="/account/notifications"
              className="relative text-konkan-text-secondary hover:text-konkan-green-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative text-konkan-text-secondary hover:text-konkan-green-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Shopping cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
            >
              <ShoppingBag className="w-5 h-5" />
              {mounted && cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-konkan-green-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
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
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-modal border border-konkan-sand opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 z-50">
                      <Link href="/account/profile" className="block px-4 py-2.5 text-sm text-konkan-text-primary hover:bg-konkan-cream">{t('account.my_profile')}</Link>
                      <Link href="/account/settings" className="block px-4 py-2.5 text-sm text-konkan-text-primary hover:bg-konkan-cream">Settings</Link>
                      <Link href="/account/orders" className="block px-4 py-2.5 text-sm text-konkan-text-primary hover:bg-konkan-cream">{t('account.orders')}</Link>
                      <Link href="/account/wishlist" className="block px-4 py-2.5 text-sm text-konkan-text-primary hover:bg-konkan-cream">{t('nav.wishlist')}</Link>
                      <Link href="/account/loyalty" className="block px-4 py-2.5 text-sm text-konkan-text-primary hover:bg-konkan-cream">{t('account.loyalty_points')}</Link>
                      <hr className="my-2 border-konkan-sand" />
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
              className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center -mr-2 text-konkan-text-primary"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Links - Desktop (hidden on scroll down) */}
      <div
        className={`hidden lg:block transition-all duration-300 ease-out motion-reduce:transition-none ${
          isScrolled
            ? 'max-h-0 opacity-0 invisible pointer-events-none motion-reduce:hidden'
            : 'max-h-14 opacity-100 visible pointer-events-auto motion-reduce:block'
        }`}
      >
        <div className="border-t border-konkan-sand/50">
          <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 flex items-center">
            {/* All Categories Dropdown */}
            <div className="relative" ref={categoryRef}>
              <button
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-white bg-konkan-green-primary hover:bg-konkan-green-dark transition-colors rounded-t-xl"
                onMouseEnter={() => setIsCategoryOpen(true)}
                onClick={() => (isCategoryOpen ? closeCategoryMenu() : setIsCategoryOpen(true))}
                aria-haspopup="menu"
                aria-expanded={isCategoryOpen}
              >
                <Menu className="w-4 h-4" />
                {t('nav.all_categories')}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isCategoryOpen ? 'rotate-180' : ''}`} />
              </button>
              {isCategoryOpen && (
                <div
                  className="absolute top-full left-0 flex z-50 rounded-b-2xl shadow-modal border border-konkan-sand overflow-hidden"
                  onMouseLeave={closeCategoryMenu}
                >
                  {/* Left column: all categories (vertical scroll only) */}
                  <div className="w-64 bg-white py-2 max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden">
                    {categories.map((cat) => {
                      const catKey = cat.slug?.replace(/-/g, '_');
                      const isActive = activeCat?.id === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onMouseEnter={() => setActiveCat(cat)}
                          className={`${isActive ? 'bg-konkan-cream' : ''} transition-colors duration-150`}
                        >
                          <Link
                            href={`/categories/${cat.slug}`}
                            className="flex items-center justify-between px-4 py-2.5 text-sm text-konkan-text-primary hover:bg-konkan-cream transition-colors"
                            onClick={closeCategoryMenu}
                          >
                            <span className="min-w-0 line-clamp-2">{t(`nav.${catKey}`, { _default: cat.name })}</span>
                            {cat.children?.length > 0 && (
                              <ChevronRight className="w-3 h-3 text-konkan-text-secondary shrink-0 ml-1" />
                            )}
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right column: subcategories of the hovered category (vertical scroll only) */}
                  {activeCat?.children?.length > 0 && (
                    <div className="w-64 bg-white py-2 max-h-[calc(100vh-12rem)] overflow-y-auto overflow-x-hidden border-l border-konkan-sand/60">
                      <p className="px-4 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary">
                        {activeCat.name}
                      </p>
                      {activeCat.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/categories/${child.slug}`}
                          className="block px-4 py-2 text-sm text-konkan-text-primary hover:bg-konkan-cream transition-colors"
                          onClick={closeCategoryMenu}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nav Items */}
            <div className="flex items-center gap-1 ml-2 overflow-x-auto scrollbar-hide">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-3 text-sm font-medium transition-colors rounded-lg whitespace-nowrap ${
                    pathname === item.href
                      ? 'text-konkan-green-primary bg-konkan-green-primary/5'
                      : 'text-konkan-text-secondary hover:text-konkan-green-primary hover:bg-konkan-green-primary/5'
                  }`}
                >
                  {t(`nav.${item.labelKey}`)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

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
        {/* Sidebar panel slide from right */}
        <div
          className={`absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${
            isMobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 sm:p-6 border-b border-konkan-sand/50 shrink-0">
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
                <p className="text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary mb-2">Categories</p>
                {categories.slice(0, 12).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary"
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

                <hr className="my-3 border-konkan-sand" />

                {/* Nav Links */}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary mb-2">Pages</p>
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <span>{t(`nav.${item.labelKey}`)}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                  </Link>
                ))}

                <hr className="my-3 border-konkan-sand" />

                {/* Account Links */}
                <p className="text-[10px] font-semibold uppercase tracking-widest text-konkan-text-secondary mb-2">Account</p>
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
                    <Link href="/account/settings" className="flex items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-konkan-cream transition-colors text-konkan-text-primary" onClick={() => setIsMobileOpen(false)}>
                      <span>Settings</span>
                      <ChevronRight className="w-3.5 h-3.5 text-konkan-text-secondary" />
                    </Link>
                    <hr className="my-2 border-konkan-sand" />
                    <button onClick={() => { logout(); setIsMobileOpen(false); }} className="flex w-full items-center justify-between px-3 py-2.5 text-sm rounded-xl hover:bg-red-50 transition-colors text-konkan-error">
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
