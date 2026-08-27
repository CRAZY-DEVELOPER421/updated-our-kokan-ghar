'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
// canvas-confetti is dynamically imported inside useEffect to avoid bundling it in the main chunk
import Button from '@/components/ui/Button';
import BestsellerRow from '@/components/home/BestsellerRow';
import api from '@/lib/api';
import { trackPurchase } from '@/lib/gtag';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order') || '';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fire GA4 purchase event once (deduped via sessionStorage inside trackPurchase)
  useEffect(() => {
    if (!orderNumber) return;
    api
      .get(`/orders/${orderNumber}`)
      .then((res) => {
        if (res.data?.success) {
          const order = res.data.data.order || res.data.data;
          const items = order.items || [];
          const totalValue = Number(order.total_amount) || 0;
          trackPurchase(order.order_number || orderNumber, totalValue, items, {
            tax: Number(order.tax_amount) || 0,
            shipping: Number(order.shipping_charge) || 0,
            coupon: order.coupon_code || undefined,
            paymentType: order.payment_method || undefined,
          });
        }
      })
      .catch(() => {
        // Non-critical — analytics failure should not break the page
      });
  }, [orderNumber]);

  useEffect(() => {
    if (!mounted) return;

    // Dynamically import canvas-confetti to keep main bundle smaller
    let cleanup;
    import('canvas-confetti').then(({ default: confetti }) => {
      const duration = 3000;
      const end = Date.now() + duration;
      let rafId;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#2D6A4F', '#40916C', '#E87722', '#F4A261', '#1A6B8A'],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#2D6A4F', '#40916C', '#E87722', '#F4A261', '#1A6B8A'],
        });

        if (Date.now() < end) rafId = requestAnimationFrame(frame);
      };

      rafId = requestAnimationFrame(frame);

      // Big burst on load
      const bigBurst = setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2D6A4F', '#E87722', '#F4A261', '#16A34A'],
        });
      }, 300);

      cleanup = () => {
        cancelAnimationFrame(rafId);
        clearTimeout(bigBurst);
      };
    });

    return () => cleanup?.();
  }, [mounted]);

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto bg-konkan-success/10 rounded-full flex items-center justify-center mb-6 animate-bounce-in">
          <svg className="w-10 h-10 text-konkan-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary mb-2">
          Order Placed Successfully!
        </h1>
        <p className="text-konkan-text-secondary mb-6">
          Thank you for shopping at Kokan Ghar. Your order has been confirmed.
        </p>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl card p-6 mb-6 text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-konkan-sand/50">
              <span className="text-sm text-konkan-text-secondary">Order Number</span>
              <span className="font-mono font-bold text-konkan-green-primary text-sm">{orderNumber}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-konkan-sand/50">
              <span className="text-sm text-konkan-text-secondary">Estimated Delivery</span>
              <span className="font-medium text-konkan-text-primary">
                {deliveryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-konkan-text-secondary">Payment</span>
              <span className="text-sm font-medium text-konkan-success">✓ Confirmed</span>
            </div>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-konkan-cream/50 rounded-2xl p-5 mb-6 text-left">
          <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">What Happens Next?</h3>
          <div className="space-y-2.5">
            <div className="space-y-2.5 text-sm text-konkan-text-secondary">
              <p className="flex items-center gap-2.5"><svg className="w-4 h-4 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> Your order is being processed by our team</p>
              <p className="flex items-center gap-2.5"><svg className="w-4 h-4 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Quality check before packaging</p>
              <p className="flex items-center gap-2.5"><svg className="w-4 h-4 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> Dispatched within 24-48 hours</p>
              <p className="flex items-center gap-2.5"><svg className="w-4 h-4 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Delivered to your doorstep in 3-5 days</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href={`/account/orders/${orderNumber}`}>
            <Button size="lg">Track Order</Button>
          </Link>
          <Link href="/products">
            <Button variant="secondary" size="lg">Continue Shopping</Button>
          </Link>
        </div>

        {/* Related Products */}
        <div className="mt-12 text-left">
          <BestsellerRow title="You May Also Like" subtitle="Customers who bought this also purchased" />
        </div>

        <div className="mt-6">
          <Link href="/" className="text-sm text-konkan-green-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="skeleton h-20 w-20 rounded-full mx-auto mb-6" />
          <div className="skeleton h-8 w-64 mx-auto mb-2" />
          <div className="skeleton h-4 w-48 mx-auto mb-6" />
          <div className="skeleton h-48 w-full max-w-lg mx-auto mb-6 rounded-2xl" />
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
