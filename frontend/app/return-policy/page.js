import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';

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

export default function ReturnPolicyPage() {
  return (
    <div className="animate-fade-in container-custom py-10 md:py-14">
      <Breadcrumb items={[{ label: 'Return Policy' }]} />
      <h1 className="font-display text-2xl md:text-4xl font-bold text-konkan-text-primary mb-6">Return & Refund Policy</h1>
      <div className="max-w-3xl space-y-6 text-konkan-text-secondary leading-relaxed">
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">7-Day Easy Returns</h2><p>We offer a 7-day easy return policy on all non-perishable items from the date of delivery. Items must be unused and in original packaging.</p></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Perishable Items</h2><p>For fresh produce, seafood, and other perishable items, please inspect your order upon delivery. If items are damaged or spoiled, contact us within 24 hours with photos for a replacement or refund.</p></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">How to Return</h2><ol className="list-decimal pl-5 space-y-1"><li>Log in to your account and go to My Orders</li><li>Select the order and click "Request Return"</li><li>Choose the reason for return and submit</li><li>Our team will review and approve within 48 hours</li><li>Schedule a pickup or self-ship the item back</li></ol></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Refund Processing</h2><p>Refunds are processed within 5-7 business days after we receive and inspect the returned item. Refunds are issued to the original payment method. COD orders are refunded via bank transfer.</p></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Non-Returnable Items</h2><ul className="list-disc pl-5 space-y-1"><li>Items marked as "Final Sale" or "Non-Returnable"</li><li>Products damaged due to improper use</li><li>Items returned without original packaging</li><li>Gift cards</li></ul></div>
        <div className="bg-white rounded-xl card p-6"><h2 className="font-display text-lg font-bold text-konkan-text-primary mb-2">Cancellations</h2><p>Orders can be cancelled within 2 hours of placement. Once an order is processed for shipping, it cannot be cancelled. For cancellations, please contact support.</p></div>
        <p className="text-sm">For return-related questions, <Link href="/contact" className="text-konkan-green-primary hover:underline">contact us</Link>.</p>
      </div>
    </div>
  );
}
