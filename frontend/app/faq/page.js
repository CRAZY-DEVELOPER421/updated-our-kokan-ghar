import ServicePageContent from '@/components/service/ServicePageContent';
import { fetchServicePage } from '@/lib/customerService';

export const metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about ordering, delivery, returns, and products at Konkan Bazaar. We are here to help.',
  openGraph: {
    title: 'FAQs',
    description: 'Find answers to common questions about ordering at Konkan Bazaar.',
    url: 'https://www.kokanghar.in/faq',
    siteName: 'Konkan Bazaar',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: { canonical: 'https://www.kokanghar.in/faq' },
};

export default async function FAQPage() {
  const page = await fetchServicePage('faq');
  return <ServicePageContent page={page} crumbLabel="FAQs" />;
}
