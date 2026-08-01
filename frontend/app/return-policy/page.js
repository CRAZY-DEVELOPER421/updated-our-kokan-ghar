import ServicePageContent from '@/components/service/ServicePageContent';
import { fetchServicePage } from '@/lib/customerService';

export const metadata = {
  title: 'Return Policy',
  description: 'Konkan Bazaar return and refund policy. Easy returns within 7 days for non-perishable items. Learn about our hassle-free return process.',
  openGraph: {
    title: 'Return Policy',
    url: 'https://www.kokanghar.in/return-policy',
    siteName: 'Konkan Bazaar',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: { canonical: 'https://www.kokanghar.in/return-policy' },
};

export default async function ReturnPolicyPage() {
  const page = await fetchServicePage('return-policy');
  return <ServicePageContent page={page} crumbLabel="Return Policy" />;
}
