import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';

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

export default function ShippingPolicyPage() {
  return (
    <div className="animate-fade-in container-custom py-10 md:py-14">
      <Breadcrumb items={[{ label: 'Shipping Policy' }]} />
      <h1 className="font-display text-2xl md:text-4xl font-bold text-konkan-text-primary mb-6">Shipping Policy</h1>
      <div className="max-w-3xl space-y-6 text-konkan-text-secondary leading-relaxed">
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Delivery Coverage</h2><p>We deliver to all major cities and towns across India. Enter your pincode on any product page to check delivery availability for your location.</p></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Shipping Charges</h2><p>Free shipping on all orders above ₹499. A flat ₹49 shipping charge applies to orders below ₹499.</p></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Delivery Timeline</h2><p>Most orders are delivered within 3-5 business days. Remote and rural areas may take 5-7 business days. During festive seasons, slight delays may occur.</p></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Order Tracking</h2><p>Once your order is dispatched, you will receive a tracking link via email and SMS. You can also track orders from your account dashboard.</p></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Packaging</h2><p>Fresh produce is packed in ventilated boxes with cushioning. Seafood is flash-frozen and packed in insulated thermocol boxes with gel packs. Non-perishable items are securely packed in corrugated boxes.</p></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Shipping Partners</h2><p>We partner with leading courier services including Delhivery, India Post, and professional cold-chain logistics providers for temperature-sensitive items.</p></div>
        <p className="text-sm">For any shipping-related queries, please <Link href="/contact" className="text-konkan-green-primary hover:underline">contact our support team</Link>.</p>
      </div>
    </div>
  );
}
