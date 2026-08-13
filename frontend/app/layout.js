import { Playfair_Display, Inter, Poppins } from 'next/font/google';
import './globals.css';
import dynamicLib from 'next/dynamic';
import { QueryProviders } from '@/lib/providers/QueryProviders';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import Navbar from '@/components/layout/Navbar';
import MobileHeader from '@/components/layout/MobileHeader';
import MobileBottomNav from '@/components/home/MobileBottomNav';
import MobileFooter from '@/components/layout/MobileFooter';
import ToastProvider from '@/components/ui/Toast';
import SuspensionGate from '@/components/layout/SuspensionGate';

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
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchActionLd) }} />
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <QueryProviders>
          <I18nProvider>
            <ToastProvider />
            {/* Global suspension popup + route guard (suspended users stay home) */}
            <SuspensionGate />
            <div className="hidden lg:block sticky top-0 z-50"><Navbar /></div>
            <div className="lg:hidden sticky top-0 z-50"><MobileHeader /></div>
            {/* ── Delivery Address Bar (scrolls away smoothly) ── */}
            <div className="lg:hidden flex items-center h-8 px-4 gap-1" style={{ backgroundColor: '#E8F0EC' }}>
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: '#1B3B2F' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-[12px] font-medium" style={{ color: '#1B3B2F' }}>
                Delivering to Mumbai 400064
              </span>
              <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={{ color: '#1B3B2F' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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
