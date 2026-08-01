import ServicePageContent from '@/components/service/ServicePageContent';
import { fetchServicePage } from '@/lib/customerService';

export const metadata = {
  title: 'Terms of Service',
  description: 'Read the terms and conditions for using Konkan Bazaar. Understand your rights and responsibilities when shopping on our platform.',
  openGraph: {
    title: 'Terms of Service',
    description: 'Read the terms and conditions for using Konkan Bazaar.',
    url: 'https://www.kokanghar.in/terms',
    siteName: 'Konkan Bazaar',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: { canonical: 'https://www.kokanghar.in/terms' },
};

export default async function TermsPage() {
  const page = await fetchServicePage('terms');
  return <ServicePageContent page={page} crumbLabel="Terms of Service" />;
}
