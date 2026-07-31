'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/ui/Breadcrumb';
import api from '@/lib/api';

const FALLBACK_OFFERS = [
  { title: 'Welcome Offer', code: 'KONKAN100', discount: 'Flat ₹100 OFF', minOrder: 'On orders above ₹499', expiry: 'Valid until further notice', color: 'from-konkan-saffron to-amber-600' },
  { title: 'First Order', code: 'FIRST20', discount: '20% Off', minOrder: 'For first-time customers', expiry: 'Valid until further notice', color: 'from-konkan-green-primary to-konkan-green-dark' },
  { title: 'Free Shipping', code: 'FREESHIP', discount: 'Free Delivery', minOrder: 'On orders above ₹299', expiry: 'No expiry', color: 'from-konkan-ocean to-blue-800' },
];

const BUNDLES = [
  { title: 'Monsoon Combo', items: 'Sol Kadhi Mix + Dried Bombay Duck + Kokum', price: '₹699', originalPrice: '₹999', discount: '30% off' },
  { title: 'Tiffin Special', items: 'Cashews (500g) + Dry Dates (250g) + Banana Chips (200g)', price: '₹449', originalPrice: '₹649', discount: '31% off' },
  { title: 'Gourmet Spice Box', items: 'Goda Masala + Malvani Masala + Kolhapuri Masala', price: '₹349', originalPrice: '₹499', discount: '30% off' },
];

function formatExpiry(dateStr) {
  if (!dateStr) return 'No expiry';
  try {
    return `Valid until ${new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  } catch {
    return 'No expiry';
  }
}

function getCouponColor(index) {
  const colors = [
    'from-konkan-saffron to-amber-600',
    'from-konkan-green-primary to-konkan-green-dark',
    'from-konkan-ocean to-blue-800',
    'from-konkan-gold to-yellow-600',
    'from-red-500 to-red-700',
    'from-purple-600 to-purple-800',
    'from-pink-500 to-pink-700',
    'from-teal-500 to-teal-700',
  ];
  return colors[index % colors.length];
}

function formatDiscount(coupon) {
  if (coupon.type === 'percentage') return `${coupon.value}% OFF`;
  if (coupon.type === 'flat') return `Flat ₹${Number(coupon.value).toLocaleString('en-IN')} OFF`;
  if (coupon.type === 'free_shipping') return 'Free Delivery';
  return `${coupon.value} OFF`;
}

function formatMinOrder(amount) {
  if (!amount || amount <= 0) return 'No minimum order';
  return `On orders above ₹${Number(amount).toLocaleString('en-IN')}`;
}

export default function OffersContent() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  async function copyToClipboard(code) {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const res = await api.get('/coupons');
        const data = res.data.data;
        if (data?.coupons?.length > 0) {
          setCoupons(data.coupons);
        }
      } catch {
        // Use fallback offers on error
      }
      setLoading(false);
    }
    fetchCoupons();
  }, []);

  const displayOffers = loading || coupons.length === 0
    ? FALLBACK_OFFERS
    : coupons.map((c, i) => ({
        title: c.description || `${c.code} - ${formatDiscount(c)}`,
        code: c.code,
        discount: formatDiscount(c),
        minOrder: formatMinOrder(c.min_order_amount),
        expiry: formatExpiry(c.valid_until),
        color: getCouponColor(i),
      }));

  return (
    <div className="animate-fade-in">
      <div className="bg-gradient-to-r from-konkan-saffron to-amber-700 py-10 md:py-14">
        <div className="container-custom">
          <Breadcrumb items={[{ label: 'Offers' }]} light />
          <h1 className="font-display text-3xl md:text-4xl font-bold text-white mt-2">Offers & Deals</h1>
          <p className="text-white/80 mt-1">Save more on authentic Konkan products</p>
        </div>
      </div>
      <div className="container-custom py-10 md:py-14">
        <h2 className="font-display text-xl font-bold text-konkan-text-primary mb-4">Active Coupons</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {displayOffers.map((offer, idx) => (
            <div key={offer.code || idx} className={`bg-gradient-to-br ${offer.color} rounded-xl p-5 text-white`}>
              <h3 className="font-display font-bold text-lg">{offer.title}</h3>
              <p className="text-2xl font-bold mt-1">{offer.discount}</p>
              <p className="text-sm text-white/80 mt-1">{offer.minOrder}</p>
              {offer.code && (
                <button
                  onClick={() => copyToClipboard(offer.code)}
                  className="mt-3 w-full bg-white/20 hover:bg-white/30 active:bg-white/40 rounded-lg px-3 py-2 text-center font-mono text-sm font-bold tracking-wider transition-all cursor-pointer relative"
                >
                  {copiedCode === offer.code ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {offer.code}
                    </span>
                  )}
                </button>
              )}
              <p className="text-[10px] text-white/60 mt-2">{offer.expiry}</p>
            </div>
          ))}
          {loading && (
            <div className="col-span-full text-center py-8 text-konkan-text-secondary">
              <div className="w-6 h-6 border-2 border-konkan-green-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm">Loading offers...</p>
            </div>
          )}
        </div>

        <h2 className="font-display text-xl font-bold text-konkan-text-primary mb-4">Bundle Deals</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {BUNDLES.map((bundle) => (
            <div key={bundle.title} className="bg-white rounded-xl card p-5">
              <h3 className="font-display font-bold text-konkan-text-primary">{bundle.title}</h3>
              <p className="text-xs text-konkan-text-secondary mt-1">{bundle.items}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xl font-bold text-konkan-saffron">{bundle.price}</span>
                <span className="text-sm text-konkan-text-secondary line-through">{bundle.originalPrice}</span>
                <span className="text-xs font-semibold text-konkan-success bg-konkan-success/10 px-1.5 py-0.5 rounded">{bundle.discount}</span>
              </div>
              <Link href="/products" className="mt-3 block w-full text-center bg-konkan-green-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-konkan-green-dark transition-colors">Shop Now</Link>
            </div>
          ))}
        </div>

        <div className="bg-konkan-cream/50 rounded-2xl p-6 text-center">
          <h2 className="font-display text-xl font-bold text-konkan-text-primary mb-2">Buy More, Save More</h2>
          <p className="text-sm text-konkan-text-secondary mb-4">Automatic discounts applied at checkout — no coupon needed!</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-3"><p className="text-xs text-konkan-text-secondary">Spend ₹1,000+</p><p className="text-sm font-bold text-konkan-green-primary">Save 5% Off</p></div>
            <div className="bg-white rounded-xl p-3"><p className="text-xs text-konkan-text-secondary">Spend ₹2,000+</p><p className="text-sm font-bold text-konkan-green-primary">Save 10% Off</p></div>
            <div className="bg-white rounded-xl p-3"><p className="text-xs text-konkan-text-secondary">Spend ₹3,000+</p><p className="text-sm font-bold text-konkan-green-primary">Save 15% Off</p></div>
            <div className="bg-white rounded-xl p-3"><p className="text-xs text-konkan-text-secondary">Spend ₹5,000+</p><p className="text-sm font-bold text-konkan-green-primary">Save 20% Off</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
