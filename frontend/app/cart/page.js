'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import useAuthStore from '@/lib/store/authStore';
import useCartStore from '@/lib/store/cartStore';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { trackViewCart } from '@/lib/gtag';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    items, summary, coupon,
    isLoading, fetchCart,
    updateQuantity, removeItem, clearCart,
    applyCoupon, removeCoupon,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [suggestedCoupons, setSuggestedCoupons] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Guests can view/manage their cart too — fetchCart works with the
  // device id; login is only required at checkout (where the cart merges).
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Fire GA4 view_cart when cart items are loaded
  useEffect(() => {
    if (items?.length > 0 && summary) {
      trackViewCart(items, summary.total || 0);
    }
  }, [items?.length, summary?.total]);

  // Fetch best applicable coupons whenever the cart contents change
  useEffect(() => {
    if (!items?.length) {
      setSuggestedCoupons([]);
      return;
    }
    let cancelled = false;
    setLoadingSuggestions(true);
    api
      .get('/cart/suggest-coupons')
      .then((res) => {
        if (!cancelled && res.data.success) setSuggestedCoupons(res.data.data.coupons || []);
      })
      .catch(() => {
        if (!cancelled) setSuggestedCoupons([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSuggestions(false);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, items, coupon]);

  const handleApplySuggested = async (code) => {
    if (coupon === code) return;
    setApplying(true);
    const res = await applyCoupon(code);
    setApplying(false);
    if (res.success) toast.success(res.message);
    else toast.error(res.message);
  };

  const handleQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    await updateQuantity(itemId, newQty);
  };

  const handleRemove = async (itemId) => {
    const res = await removeItem(itemId);
    if (res.success) toast.success('Item removed');
    else toast.error(res.message);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return toast.error('Enter a coupon code');
    setApplying(true);
    const res = await applyCoupon(couponInput.trim().toUpperCase());
    setApplying(false);
    if (res.success) {
      toast.success(res.message);
      setCouponInput('');
    } else {
      toast.error(res.message);
    }
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    toast.success('Coupon removed');
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
      toast.success('Cart cleared');
    }
  };

  const freeShippingRemaining = summary?.free_shipping_remaining || 0;
  const freeShippingPercent = freeShippingRemaining > 0
    ? Math.min(100, ((499 - freeShippingRemaining) / 499) * 100)
    : 100;

  // Buy More Save More slabs
  const slabs = [
    { min: 0, max: 999, discount: 0, label: '₹0 - ₹999' },
    { min: 1000, max: 1999, discount: 5, label: '₹1,000+ — Save 5%' },
    { min: 2000, max: 2999, discount: 10, label: '₹2,000+ — Save 10%' },
    { min: 3000, max: Infinity, discount: 15, label: '₹3,000+ — Save 15%' },
  ];

  const subtotal = summary?.subtotal || 0;
  const currentSlab = slabs.reduce((prev, slab) => (subtotal >= slab.min ? slab : prev), slabs[0]);
  const nextSlab = slabs.find(s => s.min > subtotal);
  const slabDiscount = currentSlab.discount > 0 ? Math.round((subtotal * currentSlab.discount) / 100) : 0;
  const nextSlabAmount = nextSlab ? nextSlab.min - subtotal : 0;

  return (
    <div className="container-custom py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[{ label: 'Cart', href: '/cart' }]} />

      {/* Guest notice — items are saved on this device; login is required at checkout */}
      {!isAuthenticated && items.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-konkan-saffron/30 bg-konkan-saffron/5 p-4">
          <svg className="w-5 h-5 text-konkan-saffron shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <p className="font-semibold text-konkan-text-primary">You're shopping as a guest</p>
            <p className="text-konkan-text-secondary mt-0.5">
              Your items are saved on this device. Log in or sign up at checkout to place your order — your cart will carry over automatically.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Link href="/login?redirect=/checkout" className="btn-primary text-sm py-1.5 px-4">Log in</Link>
              <Link href="/signup?redirect=/checkout" className="btn-secondary text-sm py-1.5 px-4">Sign up</Link>
            </div>
          </div>
        </div>
      )}

      <h1 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary mb-6">
        Shopping Cart {summary?.item_count > 0 && `(${summary.item_count} items)`}
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl card">
          <div className="mb-4 flex justify-center">
            <svg className="w-12 h-12 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-bold text-konkan-text-primary mb-2">Your cart is empty</h2>
          <p className="text-konkan-text-secondary mb-6">Looks like you haven't added any Konkan products yet.</p>
          <Link href="/products" className="btn-primary inline-flex">
            Start Shopping
          </Link>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-konkan-text-secondary">
            <Link href="/categories/konkan-mangoes-fruits" className="hover:text-konkan-green-primary">Mangoes</Link>
            <Link href="/categories/cashew-dry-fruits" className="hover:text-konkan-green-primary">Cashews</Link>
            <Link href="/categories/coastal-seafood" className="hover:text-konkan-green-primary">Seafood</Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Free Shipping Progress */}
            <div className="bg-white rounded-xl card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-konkan-text-primary">
                  {freeShippingRemaining > 0
                    ? `Add ₹${freeShippingRemaining} more for FREE shipping!`
                    : 'You qualify for FREE shipping!'}
                </span>
                {freeShippingRemaining > 0 && (
                  <span className="text-xs text-konkan-text-secondary">₹{freeShippingRemaining} left</span>
                )}
              </div>
              <div className="h-2 bg-konkan-sand rounded-full overflow-hidden">
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

            {/* Items */}
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl card p-4 flex gap-4">
                {/* Image */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden bg-konkan-cream">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><svg className="w-6 h-6 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.slug}`} className="font-display font-bold text-konkan-text-primary hover:text-konkan-green-primary transition-colors line-clamp-1">
                    {item.name}
                  </Link>
                  {item.variant_name && (
                    <p className="text-xs text-konkan-text-secondary mt-0.5">{item.variant_name}: {item.variant_value}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="font-bold text-konkan-saffron">₹{item.price}</span>
                    {item.mrp > item.price && (
                      <span className="text-xs text-konkan-text-secondary line-through">₹{item.mrp}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      Remove
                    </button>
                    {/* Quantity */}
                    <div className="flex items-center border border-konkan-sand rounded-lg">
                      <button
                        onClick={() => handleQuantity(item.id, item.quantity - 1)}
                        className="px-2.5 py-1 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors text-sm"
                      >
                        −
                      </button>
                      <span className="px-3 py-1 text-sm font-medium border-x border-konkan-sand min-w-[32px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantity(item.id, item.quantity + 1)}
                        className="px-2.5 py-1 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-konkan-text-primary">₹{item.price * item.quantity}</p>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <div className="flex items-center justify-end">
              <button onClick={handleClear} className="text-xs text-konkan-text-secondary hover:text-konkan-error transition-colors">
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-xl card p-4">
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">Apply Coupon</h3>
              {coupon ? (
                <div className="flex items-center justify-between bg-konkan-green-primary/5 rounded-lg p-3">
                  <div>
                    <span className="text-sm font-bold text-konkan-green-primary">{coupon}</span>
                    <p className="text-xs text-konkan-text-secondary">You saved -₹{summary?.coupon_discount || 0} on this cart!</p>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-xs text-konkan-error hover:underline">Remove</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 text-sm rounded-lg border border-konkan-sand bg-white focus:ring-2 focus:ring-konkan-green-primary/30 focus:border-konkan-green-primary outline-none uppercase"
                      maxLength={20}
                    />
                    <Button size="sm" onClick={handleApplyCoupon} loading={applying} disabled={!couponInput.trim()}>
                      Apply
                    </Button>
                  </div>
                  <p className="text-[11px] text-konkan-text-secondary mt-2">Tip: try our best offer below 👇</p>
                </>
              )}

              {/* Best Offer Suggestion — auto-filtered to coupons that actually work for this cart */}
              {!coupon && suggestedCoupons.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-konkan-saffron">
                    🏷️ Best Offers For You
                  </p>
                  {suggestedCoupons.map((c, idx) => (
                    <div key={c.code} className={`flex items-center justify-between rounded-lg p-2.5 ${idx === 0 ? 'bg-konkan-saffron/10 border border-konkan-saffron/30' : 'bg-konkan-cream/60'}`}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-konkan-green-primary">{c.code}</span>
                          {idx === 0 && <span className="px-1 py-0.5 bg-konkan-saffron text-white rounded text-[9px] font-bold">BEST</span>}
                        </div>
                        <p className="text-[11px] text-konkan-text-secondary truncate mt-0.5">
                          {c.discountAmount > 0
                            ? `You save ₹${c.discountAmount} with ${c.code}`
                            : (c.description || c.code)}
                          {c.min_order_amount > 0 ? ` • Min ₹${c.min_order_amount}` : ''}
                        </p>
                      </div>
                      <Button size="sm" onClick={() => handleApplySuggested(c.code)} disabled={applying}>
                        Apply
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {!coupon && loadingSuggestions && (
                <div className="mt-3 space-y-2">
                  <div className="skeleton h-12 rounded-lg" />
                  <div className="skeleton h-12 rounded-lg" />
                </div>
              )}
            </div>

            {/* Buy More Save More */}
            <div className="bg-white rounded-xl card p-4">
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">Buy More, Save More</h3>
              <div className="space-y-1.5">
                {slabs.map((slab) => {
                  const active = subtotal >= slab.min && subtotal < (slab.max || Infinity);
                  const reached = subtotal >= slab.min;
                  return (
                    <div key={slab.min} className={`flex items-center justify-between text-xs py-1 px-2 rounded ${active ? 'bg-konkan-saffron/10 font-medium' : ''} ${reached ? 'text-konkan-green-primary' : 'text-konkan-text-secondary'}`}>
                      <span className="flex items-center gap-1">
                        {reached && (
                          <svg className="w-3 h-3 text-konkan-success" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {slab.label}
                      </span>
                      <span>{slab.discount}% OFF</span>
                    </div>
                  );
                })}
              </div>
              {nextSlabAmount > 0 && (
                <p className="text-xs text-konkan-saffron mt-2">
                  Add ₹{nextSlabAmount} more to get {nextSlab.discount}% off!
                </p>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-xl card p-4">
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">Price Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-konkan-text-secondary">Subtotal</span>
                  <span className="text-konkan-text-primary">₹{summary?.subtotal || 0}</span>
                </div>
                {summary && summary.total_discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-konkan-text-secondary">Discount</span>
                    <span className="text-konkan-success">-₹{summary.total_discount}</span>
                  </div>
                )}
                {summary && summary.coupon_discount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-konkan-text-secondary">Coupon Discount</span>
                    <span className="text-konkan-success">-₹{summary.coupon_discount}</span>
                  </div>
                )}
                {slabDiscount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-konkan-text-secondary">Slab Discount</span>
                    <span className="text-konkan-success">-₹{slabDiscount}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-konkan-text-secondary">Shipping</span>
                  <span className={summary?.shipping_charge === 0 ? 'text-konkan-success' : 'text-konkan-text-primary'}>
                    {summary?.shipping_charge === 0 ? 'FREE' : `₹${summary?.shipping_charge || 0}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-konkan-text-secondary">GST (5%)</span>
                  <span className="text-konkan-text-primary">₹{summary?.tax_amount || 0}</span>
                </div>
                <hr className="border-konkan-sand/50" />
                <div className="flex items-center justify-between font-bold text-base">
                  <span className="text-konkan-text-primary">Total</span>
                  <span className="text-konkan-saffron">₹{Math.max(0, (summary?.total || 0) - slabDiscount)}{slabDiscount > 0 ? <span className="text-xs font-normal text-konkan-success ml-1">incl. slab discount</span> : ''}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full text-center mt-4 btn-primary py-3"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/products"
                className="block w-full text-center mt-2 text-sm text-konkan-green-primary hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
