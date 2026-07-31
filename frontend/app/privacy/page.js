import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';

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

export default function PrivacyPage() {
  return (
    <div className="animate-fade-in container-custom py-10 md:py-14">
      <Breadcrumb items={[{ label: 'Privacy Policy' }]} />
      <h1 className="font-display text-2xl md:text-4xl font-bold text-konkan-text-primary mb-6">Privacy Policy</h1>
      <div className="max-w-3xl prose prose-sm text-konkan-text-secondary space-y-4 leading-relaxed">
        <p>Last updated: January 2025</p>
        <p>At Kokan Ghar, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">Information We Collect</h2>
        <ul className="list-disc pl-5 space-y-1"><li>Name, email address, phone number, and shipping address</li><li>Payment information (processed securely by Razorpay — we never store card details)</li><li>Order history and browsing behaviour</li><li>Device information and IP address</li></ul>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">How We Use Your Information</h2>
        <ul className="list-disc pl-5 space-y-1"><li>To process and deliver your orders</li><li>To send order updates and shipping notifications</li><li>To personalise your shopping experience</li><li>To improve our products and services</li><li>To send promotional offers (with your consent)</li></ul>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">Data Protection</h2>
        <p>We implement industry-standard security measures including SSL encryption, secure data storage, and regular security audits. Your data is stored on secure servers and accessed only by authorised personnel.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">Third-Party Services</h2>
        <p>We use trusted third-party services for payment processing (Razorpay), email delivery, and analytics. These services have their own privacy policies governing data handling.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">Cookies</h2>
        <p>We use cookies to improve your experience, remember your preferences, and analyse site traffic. You can control cookie settings through your browser preferences.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal data. You can manage your account settings or contact us to exercise these rights.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">Contact</h2>
        <p>For privacy-related inquiries, please <Link href="/contact" className="text-konkan-green-primary hover:underline">contact us</Link>.</p>
      </div>
    </div>
  );
}
