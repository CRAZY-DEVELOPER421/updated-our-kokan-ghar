'use client';

import Link from 'next/link';

const METHODS = [
  {
    name: 'UPI',
    desc: 'GPay, PhonePe, Paytm & more',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-blue-600 bg-blue-50',
  },
  {
    name: 'Credit / Debit Cards',
    desc: 'Visa, Mastercard, RuPay & Amex',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    name: 'Wallets',
    desc: 'Paytm, Amazon Pay & more',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
      </svg>
    ),
    color: 'text-amber-600 bg-amber-50',
  },
  {
    name: 'Net Banking',
    desc: 'All major Indian banks',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01" />
      </svg>
    ),
    color: 'text-purple-600 bg-purple-50',
  },
  {
    name: 'Cash on Delivery',
    desc: 'Pay when your order arrives',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-rose-600 bg-rose-50',
  },
];

export default function PaymentMethodsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl card p-5">
        <h2 className="font-display font-bold text-lg text-konkan-text-primary mb-1">Payment Methods</h2>
        <p className="text-sm text-konkan-text-secondary">
          Choose how you&apos;d like to pay. All online payments are securely processed at checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {METHODS.map((method) => (
          <div
            key={method.name}
            className="flex items-center gap-4 bg-white rounded-xl card p-4 hover:shadow-card-hover transition-all"
          >
            <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center shrink-0`}>
              {method.icon}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-konkan-text-primary">{method.name}</p>
              <p className="text-xs text-konkan-text-secondary">{method.desc}</p>
            </div>
            <svg className="w-5 h-5 text-konkan-sand ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>

      <div className="bg-konkan-cream rounded-2xl p-5 text-sm text-konkan-text-secondary">
        💡 Tip: You can select your preferred payment method at checkout. Orders below ₹499 include a ₹49 delivery charge.
      </div>

      <div className="flex justify-center">
        <Link href="/products" className="text-sm text-konkan-green-primary hover:underline font-medium">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
