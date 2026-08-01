import ServicePageContent from '@/components/service/ServicePageContent';
import { fetchServicePage } from '@/lib/customerService';

export const metadata = {
  title: 'Shipping Policy',
  description: 'Learn about Konkan Bazaar shipping policy — delivery charges, timelines, tracking, and coverage areas across India.',
  openGraph: {
    title: 'Shipping Policy',
    url: 'https://www.kokanghar.in/shipping-policy',
    siteName: 'Konkan Bazaar',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: { canonical: 'https://www.kokanghar.in/shipping-policy' },
};

export default async function ShippingPolicyPage() {
  const page = await fetchServicePage('shipping-policy');
  return <ServicePageContent page={page} crumbLabel="Shipping Policy" />;
}
