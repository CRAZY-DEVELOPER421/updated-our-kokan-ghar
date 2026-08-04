'use client';

// This page must be dynamically rendered — contains client-only dependencies (zustand persist, window, Razorpay)
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
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

const STEPS = [
  { key: 'address', label: 'Delivery Address' },
  { key: 'summary', label: 'Order Summary' },
  { key: 'payment', label: 'Payment' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { items, summary, fetchCart } = useCartStore();

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

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login?redirect=/checkout'); return; }
    fetchCart();
    loadAddresses();
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
      const orderRes = await api.post('/orders/create', {
        address_id: selectedAddress,
        payment_method: paymentMethod,
        notes: '',
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
              modal: { ondismiss: () => setProcessing(false) },
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

  if (!isAuthenticated) return null;

  const totalAmount = summary?.total || 0;

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
                  {paymentMethod === 'cod' ? `Place Order • ₹${totalAmount}` : `Pay ₹${totalAmount}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl card p-4">
            <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-konkan-text-secondary">Items</span><span>{summary?.item_count || 0}</span></div>
              <div className="flex justify-between"><span className="text-konkan-text-secondary">Subtotal</span><span>₹{summary?.subtotal || 0}</span></div>
              {summary?.coupon_discount > 0 && (
                <div className="flex justify-between"><span className="text-konkan-text-secondary">Coupon</span><span className="text-konkan-success">-₹{summary.coupon_discount}</span></div>
              )}
              <div className="flex justify-between"><span className="text-konkan-text-secondary">Shipping</span><span className={summary?.shipping_charge === 0 ? 'text-konkan-success' : ''}>{summary?.shipping_charge === 0 ? 'FREE' : `₹${summary.shipping_charge}`}</span></div>
              <div className="flex justify-between"><span className="text-konkan-text-secondary">GST</span><span>₹{summary?.tax_amount || 0}</span></div>
              <hr className="border-konkan-sand/50" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-konkan-saffron">₹{summary?.total || 0}</span></div>
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
