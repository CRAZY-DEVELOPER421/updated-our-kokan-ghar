'use client';

// This page must be dynamically rendered — contains client-only dependencies (zustand persist, window, Razorpay)
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useAuthStore from '@/lib/store/authStore';
import useCartStore from '@/lib/store/cartStore';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { trackBeginCheckout, trackAddShippingInfo, trackAddPaymentInfo } from '@/lib/gtag';

const STEPS = [
  { key: 'address', label: 'Delivery Address' },
  { key: 'summary', label: 'Order Summary' },
  { key: 'payment', label: 'Payment' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { items, summary, coupon, fetchCart } = useCartStore();

  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [processing, setProcessing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: '', phone: '', house_no: '', street: '', city: '', state: '', pincode: '', is_default: false, address_type: 'home',
  });
  const [addressErrors, setAddressErrors] = useState({});

  // ── Loyalty points redemption ──
  const [loyalty, setLoyalty] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsEnabled, setPointsEnabled] = useState(false);

  // ── Best coupon suggestion ──
  const [suggestedCoupons, setSuggestedCoupons] = useState([]);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // GA4 checkout funnel tracking (deduped via refs)
  const checkoutTracked = useRef(false);
  const shippingTracked = useRef(false);
  const paymentTracked = useRef(false);

  useEffect(() => {
    if (!checkoutTracked.current && isAuthenticated && items?.length && summary) {
      checkoutTracked.current = true;
      trackBeginCheckout(items, summary.total || 0, coupon || null);
    }
  }, [isAuthenticated, items, summary, coupon]);

  // Track add_shipping_info when user moves from address → summary (step 0→1)
  useEffect(() => {
    if (step === 1 && !shippingTracked.current && items?.length && summary) {
      shippingTracked.current = true;
      trackAddShippingInfo(items, summary.total || 0, 'Standard');
    }
  }, [step, items?.length, summary]);

  // Track add_payment_info when user moves to payment step (step 2)
  useEffect(() => {
    if (step === 2 && !paymentTracked.current && items?.length && summary) {
      paymentTracked.current = true;
      trackAddPaymentInfo(items, summary.total || 0, paymentMethod);
    }
  }, [step, items?.length, summary, paymentMethod]);

  useEffect(() => {
    if (!isAuthenticated || !items?.length) {
      setSuggestedCoupons([]);
      return;
    }
    let cancelled = false;
    api
      .get('/cart/suggest-coupons')
      .then((res) => {
        if (!cancelled && res.data.success) setSuggestedCoupons(res.data.data.coupons || []);
      })
      .catch(() => {
        if (!cancelled) setSuggestedCoupons([]);
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, items]);

  const handleApplySuggestedCoupon = async (code) => {
    setApplyingCoupon(true);
    try {
      const res = await api.post('/cart/apply-coupon', { code });
      if (res.data.success) {
        toast.success(res.data.message || 'Coupon applied!');
        await fetchCart();
      } else {
        toast.error(res.data.message || 'Could not apply coupon');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login?redirect=/checkout'); return; }
    fetchCart();
    loadAddresses();
    loadLoyalty();
    // Load Razorpay script
    if (typeof window.Razorpay === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => setRazorpayLoaded(true);
      document.body.appendChild(script);
    } else {
      setRazorpayLoaded(true);
    }
  }, [isAuthenticated]);

  // Re-fetch cart every time the user advances a step — catches race conditions
  // where the merge from login hadn't completed when the page first mounted.
  useEffect(() => {
    if (isAuthenticated && step > 0) fetchCart();
  }, [step, isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const res = await api.get('/users/addresses');
      if (res.data.success) {
        setAddresses(res.data.data.addresses);
        const defaultAddr = res.data.data.addresses.find(a => a.is_default);
        if (defaultAddr) setSelectedAddress(defaultAddr.id);
      }
    } catch {
      // silently ignore — address list is optional until user adds one
    }
  };

  const loadLoyalty = async () => {
    try {
      const res = await api.get('/users/loyalty');
      if (res.data.success) setLoyalty(res.data.data.loyalty);
    } catch {
      // non-critical — points section just stays hidden
    }
  };

  const validateAddressForm = () => {
    const errs = {};
    if (!addressForm.name.trim()) errs.name = 'Full name is required';
    else if (addressForm.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!addressForm.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(addressForm.phone.replace(/\D/g, ''))) errs.phone = 'Enter a valid 10-digit number';
    if (!addressForm.house_no.trim()) errs.house_no = 'House / Flat number is required';
    if (!addressForm.street.trim()) errs.street = 'Street / Area is required';
    if (!addressForm.city.trim()) errs.city = 'City is required';
    if (!addressForm.state.trim()) errs.state = 'State is required';
    if (!addressForm.pincode.trim()) errs.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(addressForm.pincode.replace(/\D/g, ''))) errs.pincode = 'Pincode must be exactly 6 digits';
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!validateAddressForm()) return;
    try {
      const res = await api.post('/users/addresses', addressForm);
      if (res.data.success) {
        toast.success('Address added');
        setShowAddressForm(false);
        setAddressForm({ name: '', phone: '', house_no: '', street: '', city: '', state: '', pincode: '', is_default: false, address_type: 'home' });
        setAddressErrors({});
        loadAddresses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return toast.error('Please select a delivery address');
    setProcessing(true);

    try {
      // Re-fetch the cart right before ordering — guards against the race
      // where login merge hadn't finished when the page first loaded.
      await fetchCart();
      // Read the freshest items from the store after the fetch.
      const freshItems = useCartStore.getState().items;
      if (!freshItems || freshItems.length === 0) {
        toast.error('Your cart is empty. Please add items before placing an order.');
        setProcessing(false);
        return;
      }

      const orderRes = await api.post('/orders/create', {
        address_id: selectedAddress,
        payment_method: paymentMethod,
        notes: '',
        points_to_redeem: pointsEnabled ? pointsToRedeem : 0,
      });

      if (orderRes.data.success) {
        const order = orderRes.data.data;

        if (paymentMethod === 'online') {
          // Create Razorpay order
          const payRes = await api.post('/payment/create-order', {
            amount: order.total_amount,
            order_id: order.order_id,
          });

          if (payRes.data.success) {
            const options = {
              key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              amount: payRes.data.data.amount,
              currency: payRes.data.data.currency,
              name: 'Konkan Bazaar',
              description: `Order ${order.order_number}`,
              order_id: payRes.data.data.razorpay_order_id,
              handler: async (response) => {
                    try {
                      await api.post('/payment/verify', {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                        order_id: order.order_id,
                      });
                      router.push(`/order-success?order=${order.order_number}`);
                    } catch {
                      toast.error('Payment verification failed');
                      setProcessing(false);
                    }
                  },
              theme: { color: '#2D6A4F' },
              modal: { ondismiss: () => {
                setProcessing(false);
                toast.error('Payment was cancelled. Your cart is safe — you can try again.');
              }},
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
          } else {
            toast.error('Failed to initiate payment');
            setProcessing(false);
          }
        } else {
          // COD
          setProcessing(false);
          router.push(`/order-success?order=${order.order_number}`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setProcessing(false);
    }
  };

  // ── MANDATORY LOGIN GATE ──────────────────────────────────────────────
  // Guests can browse & add to cart freely, but checkout (payment) requires
  // an account. A redirect to /login is issued in the effect above; this
  // screen renders during that hop so the page is never blank.
  if (!isAuthenticated) {
    return (
      <div className="container-custom py-16 text-center animate-fade-in max-w-lg">
        <div className="mx-auto w-16 h-16 rounded-full bg-konkan-cream border border-konkan-sand flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-bold text-konkan-text-primary mb-2">Login required to checkout</h1>
        <p className="text-konkan-text-secondary mb-6">
          {items.length > 0
            ? `${items.length} item${items.length > 1 ? 's' : ''} in your cart. Sign in or create an account to place your order — your cart will carry over automatically.`
            : 'Please sign in to continue to payment.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login?redirect=/checkout" className="btn-primary inline-flex">Log in</Link>
          <Link href="/signup?redirect=/checkout" className="btn-secondary inline-flex">Sign up</Link>
        </div>
      </div>
    );
  }

  const totalAmount = summary?.total || 0;

  // ── Loyalty points math (100 pts = ₹10) ─────────────────────────────────
  const availablePoints = loyalty?.total_points || 0;
  const pointsValue = Math.floor(availablePoints / 100) * 10; // ₹ value of full balance
  // Can't redeem more than the item cost (subtotal − coupon − slab) —
  // shipping & GST stay payable. Mirrors the backend order cap exactly.
  const maxDiscountByOrder = Math.max(
    (summary?.subtotal || 0) - (summary?.coupon_discount || 0) - (summary?.slab_discount || 0),
    0
  );
  const maxPointsByOrder = Math.floor(maxDiscountByOrder / 10) * 100;
  const maxRedeemablePoints = Math.max(Math.min(Math.floor(availablePoints / 100) * 100, maxPointsByOrder), 0);
  const pointsDiscount = Math.floor(pointsToRedeem / 100) * 10; // ₹ saved with selected points
  const effectiveTotal = Math.max(totalAmount - pointsDiscount, 0);

  return (
    <div className="container-custom py-6 md:py-8 animate-fade-in">
      <Breadcrumb items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />

      <h1 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary mb-6">Checkout</h1>

      {/* Steps Progress */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.key} className="flex items-center">
            <div              className={`px-3 py-1.5 rounded-full text-sm ${
              idx <= step ? 'bg-konkan-green-primary text-white' : 'bg-konkan-cream text-konkan-text-secondary'
            }`}>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${idx < step ? 'bg-konkan-green-primary' : 'bg-konkan-sand'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Address */}
          {step === 0 && (
            <div className="bg-white rounded-xl card p-6">
              <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-4">Select Delivery Address</h2>

              {addresses.length > 0 ? (
                <div className="space-y-3 mb-4">
                  {addresses.map((addr) => (
                    <label key={addr.id} className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedAddress === addr.id ? 'border-konkan-green-primary bg-konkan-green-primary/5' : 'border-konkan-sand hover:border-konkan-green-primary/50'
                    }`}>
                      <div className="flex items-start gap-3">
                        <input type="radio" name="address" checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1 text-konkan-green-primary focus:ring-konkan-green-primary" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-konkan-text-primary">{addr.name}</span>
                            <span className="px-1.5 py-0.5 bg-konkan-cream rounded text-[10px] text-konkan-text-secondary capitalize">{addr.address_type}</span>
                            {addr.is_default === 1 && <span className="px-1.5 py-0.5 bg-konkan-green-primary/10 rounded text-[10px] text-konkan-green-primary">Default</span>}
                          </div>
                          <p className="text-sm text-konkan-text-secondary mt-1">{addr.house_no}, {addr.street}</p>
                          <p className="text-sm text-konkan-text-secondary">{addr.city}, {addr.state} — {addr.pincode}</p>
                          <p className="text-xs text-konkan-text-secondary mt-1">Phone: {addr.phone}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-konkan-text-secondary text-sm mb-4">No saved addresses. Please add one.</p>
              )}

              <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-sm text-konkan-green-primary hover:underline font-medium">
                {showAddressForm ? '− Cancel' : '+ Add New Address'}
              </button>

              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Full Name" value={addressForm.name} onChange={(e) => { setAddressForm({ ...addressForm, name: e.target.value }); if (addressErrors.name) setAddressErrors((prev) => ({ ...prev, name: '' })); }} error={addressErrors.name} />
                  <Input label="Phone" type="tel" value={addressForm.phone} onChange={(e) => { setAddressForm({ ...addressForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }); if (addressErrors.phone) setAddressErrors((prev) => ({ ...prev, phone: '' })); }} error={addressErrors.phone} maxLength={10} />
                  <Input label="House / Flat No." value={addressForm.house_no} onChange={(e) => { setAddressForm({ ...addressForm, house_no: e.target.value }); if (addressErrors.house_no) setAddressErrors((prev) => ({ ...prev, house_no: '' })); }} error={addressErrors.house_no} />
                  <Input label="Street / Area" value={addressForm.street} onChange={(e) => { setAddressForm({ ...addressForm, street: e.target.value }); if (addressErrors.street) setAddressErrors((prev) => ({ ...prev, street: '' })); }} error={addressErrors.street} />
                  <Input label="City" value={addressForm.city} onChange={(e) => { setAddressForm({ ...addressForm, city: e.target.value }); if (addressErrors.city) setAddressErrors((prev) => ({ ...prev, city: '' })); }} error={addressErrors.city} />
                  <Input label="State" value={addressForm.state} onChange={(e) => { setAddressForm({ ...addressForm, state: e.target.value }); if (addressErrors.state) setAddressErrors((prev) => ({ ...prev, state: '' })); }} error={addressErrors.state} />
                  <Input label="Pincode" value={addressForm.pincode} onChange={(e) => { setAddressForm({ ...addressForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }); if (addressErrors.pincode) setAddressErrors((prev) => ({ ...prev, pincode: '' })); }} error={addressErrors.pincode} maxLength={6} />
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-konkan-text-secondary">
                      <input type="checkbox" checked={addressForm.is_default} onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })} className="rounded" />
                      Set as default address
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" size="sm">Save Address</Button>
                  </div>
                </form>
              )}

              <div className="mt-6">
                <Button onClick={() => selectedAddress ? setStep(1) : toast.error('Select an address')} size="lg" className="w-full">
                  Continue → Order Summary
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Order Summary */}
          {step === 1 && (
            <div className="bg-white rounded-xl card p-6">
              <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-4">Review Your Order</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 bg-konkan-cream/50 rounded-xl">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0">
                      {item.image ? <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-5 h-5 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-konkan-text-primary truncate">{item.name}</p>
                      <p className="text-xs text-konkan-text-secondary">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-konkan-saffron">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Konkan Points redemption */}
              <div className="mt-6 bg-konkan-cream/40 rounded-xl border border-konkan-sand/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display font-bold text-konkan-text-primary text-sm flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-konkan-gold" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.363-1.118l-2.8-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Konkan Points
                  </h3>
                  {loyalty && availablePoints > 0 && maxRedeemablePoints > 0 && (
                    <button
                      onClick={() => {
                        const next = !pointsEnabled;
                        setPointsEnabled(next);
                        if (next) setPointsToRedeem(maxRedeemablePoints);
                        else setPointsToRedeem(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${pointsEnabled ? 'text-konkan-error hover:bg-red-50' : 'bg-konkan-green-primary text-white hover:bg-konkan-green-dark'}`}
                    >
                      {pointsEnabled ? '✕ Remove' : 'Use points'}
                    </button>
                  )}
                </div>

                {loyalty && availablePoints > 0 && maxRedeemablePoints > 0 ? (
                  <>
                    <p className="text-xs text-konkan-text-secondary mb-3">
                      You have <span className="font-semibold text-konkan-text-primary">{availablePoints} points</span>
                      (worth <span className="font-semibold text-konkan-green-primary">₹{pointsValue}</span> off). 100 points = ₹10.
                    </p>
                    {pointsEnabled ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step={100}
                          max={maxRedeemablePoints}
                          value={pointsToRedeem || ''}
                          onChange={(e) => {
                            let val = parseInt(e.target.value, 10) || 0;
                            if (val > maxRedeemablePoints) val = maxRedeemablePoints;
                            setPointsToRedeem(Math.floor(val / 100) * 100);
                          }}
                          className="w-32 px-3 py-2 text-sm rounded-xl border border-konkan-sand bg-white text-konkan-text-primary focus:ring-2 focus:ring-konkan-green-primary/30 focus:border-konkan-green-primary outline-none transition-all"
                          placeholder="Points"
                          aria-label="Points to redeem"
                        />
                        <button
                          onClick={() => setPointsToRedeem(maxRedeemablePoints)}
                          className="px-3 py-2 text-xs font-semibold text-konkan-green-primary hover:bg-konkan-green-primary/10 rounded-lg transition-colors"
                        >
                          Use Max ({maxRedeemablePoints} pts)
                        </button>
                        <span className="text-xs font-semibold text-konkan-success">
                          {pointsDiscount > 0 ? `You save ₹${pointsDiscount} on this order` : 'Enter at least 100 points'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-konkan-text-secondary">Tap “Use points” to pay a part of this order with your balance.</p>
                    )}
                  </>
                ) : loyalty ? (
                  <p className="text-xs text-konkan-text-secondary">
                    Earn points on every order — redeem them right here next time!
                  </p>
                ) : null}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button onClick={() => setStep(0)} className="text-sm text-konkan-green-primary hover:underline">← Back to Address</button>
                <Button onClick={() => setStep(2)} size="lg">Continue → Payment</Button>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 2 && (
            <div className="bg-white rounded-xl card p-6">
              <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-4">Payment Method</h2>

              <div className="space-y-3 mb-6">
                <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'online' ? 'border-konkan-green-primary bg-konkan-green-primary/5' : 'border-konkan-sand hover:border-konkan-green-primary/50'
                } ${!razorpayLoaded ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} disabled={!razorpayLoaded} className="text-konkan-green-primary focus:ring-konkan-green-primary" />
                    <div>
                      <p className="font-medium text-konkan-text-primary">Online Payment</p>
                      <p className="text-xs text-konkan-text-secondary">{razorpayLoaded ? 'Credit/Debit Card, UPI, Net Banking — Powered by Razorpay' : 'Loading payment gateway...'}</p>
                    </div>
                  </div>
                </label>

                <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'cod' ? 'border-konkan-green-primary bg-konkan-green-primary/5' : 'border-konkan-sand hover:border-konkan-green-primary/50'
                }`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="text-konkan-green-primary focus:ring-konkan-green-primary" />
                    <div>
                      <p className="font-medium text-konkan-text-primary">Cash on Delivery</p>
                      <p className="text-xs text-konkan-text-secondary">Pay when you receive your order</p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep(1)} className="text-sm text-konkan-green-primary hover:underline">← Back to Summary</button>
                <Button onClick={handlePlaceOrder} size="lg" loading={processing} disabled={!selectedAddress}>
                  {paymentMethod === 'cod' ? `Place Order • ₹${effectiveTotal}` : `Pay ₹${effectiveTotal}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          {/* Best offer suggestion — only when no coupon applied yet */}
          {!coupon && suggestedCoupons.length > 0 && (
            <div className="bg-gradient-to-r from-konkan-saffron/10 to-amber-50 rounded-xl card p-4 border border-konkan-saffron/20">
              <p className="text-[11px] font-bold uppercase tracking-wide text-konkan-saffron mb-2">
                🏷️ Best Offer For You
              </p>
              <div className="space-y-2">
                {suggestedCoupons.slice(0, 2).map((c, idx) => (
                  <div key={c.code} className={`flex items-center justify-between gap-2 rounded-lg p-2 ${idx === 0 ? 'bg-konkan-saffron/10' : 'bg-white/70'}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-konkan-green-primary">{c.code}</span>
                        {idx === 0 && <span className="px-1 py-0.5 bg-konkan-saffron text-white rounded text-[9px] font-bold">BEST</span>}
                      </div>
                      <p className="text-[11px] text-konkan-text-secondary truncate mt-0.5">
                        {c.discountAmount > 0
                          ? `You save ₹${c.discountAmount} on this order`
                          : (c.description || c.code)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApplySuggestedCoupon(c.code)}
                      disabled={applyingCoupon}
                      className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-konkan-green-primary text-white hover:bg-konkan-green-dark disabled:opacity-50 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl card p-4">
            <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-konkan-text-secondary">Items</span><span>{summary?.item_count || 0}</span></div>
              <div className="flex justify-between"><span className="text-konkan-text-secondary">Subtotal</span><span>₹{summary?.subtotal || 0}</span></div>
              {summary?.coupon_discount > 0 && (
                <div className="flex justify-between"><span className="text-konkan-text-secondary">Coupon</span><span className="text-konkan-success">-₹{summary.coupon_discount}</span></div>
              )}
              {summary?.slab_discount > 0 && (
                <div className="flex justify-between"><span className="text-konkan-text-secondary">Slab Discount ({summary.slab_percent}%)</span><span className="text-konkan-success">-₹{summary.slab_discount}</span></div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between"><span className="text-konkan-text-secondary">Konkan Points</span><span className="text-konkan-success">-₹{pointsDiscount}</span></div>
              )}
              <div className="flex justify-between"><span className="text-konkan-text-secondary">Shipping</span><span className={summary?.shipping_charge === 0 ? 'text-konkan-success' : ''}>{summary?.shipping_charge === 0 ? 'FREE' : `₹${summary?.shipping_charge || 0}`}</span></div>
              <div className="flex justify-between"><span className="text-konkan-text-secondary">GST</span><span>₹{summary?.tax_amount || 0}</span></div>
              <hr className="border-konkan-sand/50" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-konkan-saffron">₹{effectiveTotal}</span></div>
            </div>
          </div>

          <div className="bg-konkan-cream/50 rounded-xl p-4 text-sm space-y-1.5">
            <p className="flex items-center gap-1.5 text-konkan-success">✓ Free delivery above ₹499</p>
            <p className="flex items-center gap-1.5 text-konkan-green-primary">⟳ 7-day easy returns</p>
            <p className="flex items-center gap-1.5 text-konkan-green-primary">Secure checkout via Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}
