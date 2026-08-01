'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/lib/store/authStore';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import Breadcrumb from '@/components/ui/Breadcrumb';

// Sub-page titles — the dashboard ('/account') renders its own in-page header,
// so it is intentionally not listed here.
const SUBPAGE_TITLES = [
  { path: '/account/orders', labelKey: 'account.orders' },
  { path: '/account/addresses', labelKey: 'account.addresses' },
  { path: '/account/wishlist', labelKey: 'account.wishlist' },
  { path: '/account/loyalty', labelKey: 'account.loyalty_points' },
  { path: '/account/notifications', labelKey: 'account.notifications' },
  { path: '/account/profile', labelKey: 'account.my_profile' },
  { path: '/account/buy-again', label: 'Buy Again' },
  { path: '/account/payment-methods', label: 'Payment Methods' },
  { path: '/account/settings', label: 'Settings' },
];

export default function AccountLayout({ children }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const isDashboard = pathname === '/account';
  const current = SUBPAGE_TITLES.find(
    (item) => item.path === pathname || (item.path !== '/account' && pathname.startsWith(item.path))
  );
  const title = current ? (current.label || t(current.labelKey)) : '';

  return (
    <div className="bg-konkan-cream/30 min-h-screen">
      <div className="container-custom py-6 md:py-8">
        {!isDashboard && current && (
          <>
            <Breadcrumb items={[{ label: t('account.title'), href: '/account' }, { label: title }]} />
            <h1 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary mb-6">
              {title}
            </h1>
          </>
        )}
        {children}
      </div>
    </div>
  );
}
