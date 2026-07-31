import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';

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

export default function TermsPage() {
  return (
    <div className="animate-fade-in container-custom py-10 md:py-14">
      <Breadcrumb items={[{ label: 'Terms of Service' }]} />
      <h1 className="font-display text-2xl md:text-4xl font-bold text-konkan-text-primary mb-6">Terms of Service</h1>
      <div className="max-w-3xl prose prose-sm text-konkan-text-secondary space-y-4 leading-relaxed">
        <p>Last updated: January 2025</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">1. Acceptance of Terms</h2>
        <p>By accessing or using Konkan Bazaar, you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">2. Account Registration</h2>
        <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">3. Orders & Payments</h2>
        <p>All orders are subject to availability and confirmation. We reserve the right to cancel any order due to pricing errors, stock unavailability, or suspected fraud. Payment will be refunded in such cases.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">4. Pricing & Availability</h2>
        <p>Prices are subject to change without notice. We strive to display accurate pricing but errors may occur. In case of a pricing error, we will contact you before processing the order.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">5. Shipping & Delivery</h2>
        <p>Delivery times are estimates and not guaranteed. We are not liable for delays caused by courier partners, weather, or unforeseen circumstances. Risk of loss passes to you upon delivery.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">6. Returns & Refunds</h2>
        <p>Our return policy is outlined on our <Link href="/return-policy" className="text-konkan-green-primary hover:underline">Return Policy</Link> page. Please review it before making a purchase.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">7. User Conduct</h2>
        <p>You agree not to misuse the platform, engage in fraudulent activities, or violate any applicable laws. We reserve the right to suspend or terminate accounts for violations.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">8. Intellectual Property</h2>
        <p>All content on Konkan Bazaar — including text, images, logos, and trademarks — is our property or used with permission. You may not reproduce, distribute, or create derivative works without our consent.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">9. Limitation of Liability</h2>
        <p>Konkan Bazaar shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability is limited to the amount paid for the products in question.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">10. Changes to Terms</h2>
        <p>We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.</p>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mt-8">Contact</h2>
        <p>For questions about these terms, please <Link href="/contact" className="text-konkan-green-primary hover:underline">contact us</Link>.</p>
      </div>
    </div>
  );
}
