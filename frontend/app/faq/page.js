import Breadcrumb from '@/components/ui/Breadcrumb';

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

const FAQS = [
  { category: 'Orders & Delivery', questions: [
    { q: 'How do I place an order?', a: 'Simply browse our products, add items to your cart, and proceed to checkout. You can place an order as a guest or create an account for faster checkout.' },
    { q: 'What are your delivery charges?', a: 'We offer FREE delivery on all orders above ₹499. For orders below ₹499, a flat ₹49 delivery charge applies.' },
    { q: 'How long does delivery take?', a: 'Most orders are delivered within 3-5 business days. Remote areas in the Konkan region may take 5-7 business days.' },
    { q: 'Do you deliver to my city?', a: 'We currently deliver across all major cities in India. Enter your pincode on the product page to check delivery availability.' },
    { q: 'Can I change my delivery address after placing an order?', a: 'Yes, you can change your address within 2 hours of placing the order by contacting our support team.' },
  ]},
  { category: 'Products & Quality', questions: [
    { q: 'Are your products organic?', a: 'Many of our products are organically grown, and we clearly label them. We source directly from trusted farmers who follow traditional, sustainable farming practices.' },
    { q: 'How fresh are your products?', a: 'Our products are sourced directly from farms and producers, ensuring maximum freshness. We ship within 24-48 hours of harvesting for perishable items.' },
    { q: 'Do you offer bulk orders?', a: 'Yes! We offer special pricing for bulk orders and corporate gift hampers. Contact us for a custom quote.' },
  ]},
  { category: 'Returns & Refunds', questions: [
    { q: 'What is your return policy?', a: 'We offer a 7-day easy return policy on all non-perishable items. Perishable items can be returned within 24 hours of delivery if damaged.' },
    { q: 'How do I request a return?', a: 'Go to your account dashboard, find the order, and click "Request Return". Our team will review and process your request within 48 hours.' },
    { q: 'When will I get my refund?', a: 'Refunds are processed within 5-7 business days after the returned item is received and inspected.' },
  ]},
  { category: 'Account & Payments', questions: [
    { q: 'What payment methods do you accept?', a: 'We accept all major credit/debit cards, UPI (GPay, PhonePe, Paytm), Net Banking, and Cash on Delivery.' },
    { q: 'Is it safe to pay online?', a: 'Absolutely. All payments are processed securely through Razorpay, a PCI-DSS compliant payment gateway.' },
    { q: 'How does the loyalty program work?', a: 'Earn 1 point for every ₹10 spent. Accumulate points and redeem them for discounts. Higher tiers (Silver, Gold, Platinum) unlock exclusive benefits.' },
  ]},
];

export default function FAQPage() {
  return (
    <div className="animate-fade-in container-custom py-10 md:py-14">
      <Breadcrumb items={[{ label: 'FAQs' }]} />
      <h1 className="font-display text-2xl md:text-4xl font-bold text-konkan-text-primary mb-2">Frequently Asked Questions</h1>
      <p className="text-konkan-text-secondary mb-8">Everything you need to know about shopping at Konkan Bazaar.</p>

      <div className="space-y-8 max-w-3xl">
        {FAQS.map((section) => (
          <div key={section.category}>
            <h2 className="font-display text-lg font-bold text-konkan-green-primary mb-3">{section.category}</h2>
            <div className="space-y-2">
              {section.questions.map((faq, idx) => (
                <details key={idx} className="bg-white rounded-xl card overflow-hidden group">
                  <summary className="px-5 py-4 cursor-pointer text-sm font-medium text-konkan-text-primary hover:bg-konkan-cream/50 transition-colors list-none flex items-center justify-between">
                    {faq.q}
                    <svg className="w-4 h-4 text-konkan-text-secondary shrink-0 ml-2 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-4">
                    <p className="text-sm text-konkan-text-secondary leading-relaxed">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
