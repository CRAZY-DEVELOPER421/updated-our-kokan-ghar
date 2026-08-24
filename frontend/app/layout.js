import { Playfair_Display, Inter, Poppins } from 'next/font/google';
import './globals.css';
import dynamicLib from 'next/dynamic';
import { QueryProviders } from '@/lib/providers/QueryProviders';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import Navbar from '@/components/layout/Navbar';
import DeliveryAddressBar from '@/components/layout/DeliveryAddressBar';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import MobileFooter from '@/components/layout/MobileFooter';
import ToastProvider from '@/components/ui/Toast';
import SuspensionGate from '@/components/layout/SuspensionGate';
import PwaInstallPopup from '@/components/pwa/PwaInstallPopup';
import FloatingNotifPrompt from '@/components/pwa/FloatingNotifPrompt';
import IosPwaBanner from '@/components/pwa/IosPwaBanner';

// Dynamically import below-the-fold components to reduce initial JS payload
const PageTransition = dynamicLib(() => import('@/components/layout/PageTransition'));
const Footer = dynamicLib(() => import('@/components/layout/Footer'), {
  loading: () => <div className="bg-konkan-earth h-[400px] lg:h-[500px]" />,
});

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

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  preload: true,
  weight: ['400', '500', '600', '700'],
});

// Dynamic rendering — prevents prerendering failures on client-heavy pages (zustand, contexts)
export const dynamic = 'force-dynamic';

export const metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: {
    template: '%s | Kokan Ghar',
    default: 'Kokan Ghar - Authentic Konkan Products Online',
  },
  description: 'Shop authentic Konkan region products including Alphonso mangoes, cashews, spices, seafood, and traditional delicacies. Direct from farmers and artisans of the Konkan coast.',
  keywords: ['Konkan', 'Konkan products', 'Alphonso mangoes', 'Goan cashews', 'Konkan spices', 'organic', 'natural', 'buy online', 'India', 'Maharashtra', 'Goa'],
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icons/icon-192x192.svg',
  },
  other: {
    'theme-color': '#2D6A4F',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'Kokan Ghar - Authentic Konkan Products Online',
    description: 'Shop authentic Konkan region products. Direct from farmers and artisans.',
    url: 'https://www.kokanaghar.in',
    siteName: 'Kokan Ghar',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kokan Ghar - Authentic Konkan Products Online',
    description: 'Shop authentic Konkan region products. Direct from farmers and artisans.',
  },
  alternates: {
    canonical: 'https://www.kokanaghar.in',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kokan Ghar',
  url: 'https://www.kokanaghar.in',
  logo: 'https://www.kokanaghar.in/images/logo/konkan_logo.png',
  description: 'Authentic Konkan region products marketplace',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Mapusa',
    addressRegion: 'Goa',
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-9876543210',
    contactType: 'customer service',
  },
};

const searchActionLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Kokan Ghar',
  url: 'https://www.kokanaghar.in',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://www.kokanaghar.in/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${playfair.variable} ${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        {/* Structured data (JSON-LD) — rendered in body; Next.js manages <head> metadata itself */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionLd) }} />
        <QueryProviders>
          <I18nProvider>
            <ToastProvider />
            <PwaInstallPopup />
            <FloatingNotifPrompt />
            <IosPwaBanner />
            {/* Global suspension popup + route guard (suspended users stay home) */}
            <SuspensionGate />
            <div className="hidden lg:block sticky top-0 z-50"><Navbar /></div>
            <div className="lg:hidden sticky top-0 z-50"><MobileHeader /></div>
            {/* ── Delivery Address Bar (scrolls away smoothly; hidden on campaign pages) ── */}
            <DeliveryAddressBar />
            <main className="flex-1">
              <PageTransition variant="fadeUp" duration={0.2}>
                <div>{children}</div>
              </PageTransition>
            </main>
            <div className="lg:hidden pb-[60px]"><MobileFooter /></div>
            <div className="lg:hidden"><MobileBottomNav /></div>
            <div className="hidden lg:block"><Footer /></div>
          </I18nProvider>
        </QueryProviders>
      </body>
    </html>
  );
}
