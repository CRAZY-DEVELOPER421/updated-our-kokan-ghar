'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useCartStore from '@/lib/store/cartStore';
import Button from '@/components/ui/Button';

export default function CartDrawer({ isOpen, onClose }) {
  const { items, summary, updateQuantity, removeItem, fetchCart } = useCartStore();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (isOpen && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchCart();
      document.body.style.overflow = 'hidden';
    }
    if (!isOpen) {
      hasFetchedRef.current = false;
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, fetchCart]);

  const itemCount = items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
  const subtotal = summary?.subtotal || 0;
  const freeShippingRemaining = summary?.free_shipping_remaining ?? Math.max(0, 499 - subtotal);
  const freeShippingPercent = subtotal >= 499 ? 100 : Math.min(100, (subtotal / 499) * 100);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150]" onClick={onClose} />}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[160] transform transition-all duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-konkan-sand/50 shrink-0">
          <h2 className="font-display font-bold text-lg text-konkan-text-primary">
            Cart <span className="text-konkan-text-secondary font-normal text-sm">({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          </h2>
          <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-konkan-cream text-konkan-text-secondary hover:text-konkan-text-primary transition-colors" aria-label="Close cart">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div className="px-5 pt-4 pb-2 shrink-0">
            <div className="bg-gradient-to-r from-konkan-green-primary/5 to-emerald-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-konkan-text-primary">
                  {freeShippingPercent >= 100
                    ? '🎉 You qualify for FREE shipping!'
                    : `Add ₹${Math.ceil(freeShippingRemaining)} more for FREE shipping`}
                </span>
              </div>
              <div className="h-2 bg-konkan-sand/50 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${freeShippingPercent}%`,
                    background: freeShippingPercent >= 100
                      ? 'linear-gradient(90deg, #16A34A, #22C55E)'
                      : 'linear-gradient(90deg, #2D6A4F, #40916C)',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-konkan-cream flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-konkan-text-primary mb-1">Your cart is empty</h3>
              <p className="text-sm text-konkan-text-secondary mb-6">Discover authentic Konkan products!</p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-konkan-green-primary to-konkan-green-secondary text-white text-sm font-semibold rounded-xl hover:from-konkan-green-dark hover:to-konkan-green-primary transition-all duration-200 shadow-[0_4px_12px_rgba(45,106,79,0.25)]"
              >
                Start Shopping
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 p-3 bg-konkan-cream/50 rounded-xl hover:bg-konkan-cream transition-colors group/item">
                {/* Image */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white shrink-0 shadow-sm">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-konkan-text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.slug}`} onClick={onClose} className="text-sm font-semibold text-konkan-text-primary hover:text-konkan-green-primary transition-colors line-clamp-1">
                    {item.name}
                  </Link>
                  <p className="text-xs text-konkan-text-secondary mt-0.5">₹{item.price} each</p>

                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="px-2 py-0.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors opacity-0 group-hover/item:opacity-100 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Remove
                    </button>
                    {/* Quantity */}
                    <div className="flex items-center border border-konkan-sand rounded-lg bg-white">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors rounded-l-lg"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-2.5 py-0.5 text-xs font-medium border-x border-konkan-sand tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors rounded-r-lg"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total Price */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-konkan-saffron">₹{item.price * item.quantity}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-konkan-sand/50 p-5 space-y-3 shrink-0 bg-white">
            <div className="flex items-center justify-between text-sm">
              <span className="text-konkan-text-secondary">Subtotal</span>
              <span className="font-bold text-lg text-konkan-text-primary">₹{subtotal}</span>
            </div>
            {summary?.coupon_discount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-konkan-success">Coupon discount</span>
                <span className="text-konkan-success">-₹{summary.coupon_discount}</span>
              </div>
            )}
            <Link href="/checkout" onClick={onClose}>
              <Button size="lg" className="w-full">Proceed to Checkout</Button>
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="block text-center text-xs text-konkan-text-secondary hover:text-konkan-green-primary transition-colors"
            >
              View full cart details
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
