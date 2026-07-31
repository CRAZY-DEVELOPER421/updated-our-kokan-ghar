import OffersContent from './OffersContent';

export const metadata = {
  title: 'Offers & Deals',
  description: 'Explore the latest offers, discounts, and deals on authentic Konkan products. Save more with coupon codes, flash sales, and bundle offers.',
  openGraph: {
    title: 'Offers & Deals',
    description: 'Save more with exclusive offers on Konkan products.',
    url: 'https://www.kokanghar.in/offers',
    siteName: 'Konkan Bazaar',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: { canonical: 'https://www.kokanghar.in/offers' },
};

export default function OffersPage() {
  return <OffersContent />;
}
