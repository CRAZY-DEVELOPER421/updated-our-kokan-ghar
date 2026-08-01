import ServicePageContent from '@/components/service/ServicePageContent';
import { fetchServicePage } from '@/lib/customerService';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Our privacy policy explains how Kokan Ghar collects, uses, and protects your personal information. Your privacy matters to us.',
  openGraph: {
    title: 'Privacy Policy',
    url: 'https://www.kokanghar.in/privacy',
    siteName: 'Kokan Ghar',
    locale: 'en_IN',
    type: 'website',
  },
  alternates: { canonical: 'https://www.kokanghar.in/privacy' },
};

export default async function PrivacyPage() {
  const page = await fetchServicePage('privacy');
  return <ServicePageContent page={page} crumbLabel="Privacy Policy" />;
}
