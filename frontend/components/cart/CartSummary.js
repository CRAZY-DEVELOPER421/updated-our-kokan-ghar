'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function CartSummary({ items, summary, coupon, onRemoveCoupon }) {
  const subtotal = summary?.subtotal || 0;
  const discount = summary?.total_discount || 0;
  const couponDiscount = summary?.coupon_discount || 0;
  const shipping = summary?.shipping_charge || 0;
  const tax = summary?.tax_amount || 0;
  const total = Math.max(0, (summary?.total || 0));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl card p-4">
        <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">Price Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-konkan-text-secondary">Subtotal</span><span>₹{subtotal}</span></div>
          {discount > 0 && <div className="flex justify-between"><span className="text-konkan-text-secondary">Discount</span><span className="text-konkan-success">-₹{discount}</span></div>}
          {couponDiscount > 0 && <div className="flex justify-between"><span className="text-konkan-text-secondary">Coupon</span><span className="text-konkan-success">-₹{couponDiscount}</span></div>}
          <div className="flex justify-between"><span className="text-konkan-text-secondary">Shipping</span><span className={shipping === 0 ? 'text-konkan-success' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
          <div className="flex justify-between"><span className="text-konkan-text-secondary">GST</span><span>₹{tax}</span></div>
          <hr className="border-konkan-sand/50" />
          <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-konkan-saffron">₹{total}</span></div>
        </div>
      </div>

      {coupon && <div className="bg-konkan-green-primary/5 rounded-lg p-3 flex items-center justify-between"><div><span className="text-sm font-bold text-konkan-green-primary">{coupon}</span><p className="text-xs text-konkan-text-secondary">Discount: -₹{couponDiscount}</p></div><button onClick={onRemoveCoupon} className="text-xs text-konkan-error hover:underline">Remove</button></div>}

      <Link href="/checkout"><Button size="lg" className="w-full">Proceed to Checkout</Button></Link>
      <Link href="/products" className="block text-center text-sm text-konkan-green-primary hover:underline">Continue Shopping</Link>
    </div>
  );
}
