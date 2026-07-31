'use client';

import Button from '@/components/ui/Button';

export default function PaymentSection({ paymentMethod, onMethodChange, onPlaceOrder, processing, razorpayLoaded, totalAmount }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-4">Payment Method</h2>
      <div className="space-y-3 mb-6">
        <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-konkan-green-primary bg-konkan-green-primary/5' : 'border-konkan-sand hover:border-konkan-green-primary/50'} ${!razorpayLoaded ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-3">
            <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => onMethodChange('online')} disabled={!razorpayLoaded} className="text-konkan-green-primary focus:ring-konkan-green-primary" />
            <div><p className="font-medium text-konkan-text-primary">Online Payment</p><p className="text-xs text-konkan-text-secondary">{razorpayLoaded ? 'Credit/Debit Card, UPI, Net Banking — Powered by Razorpay' : 'Loading payment gateway...'}</p></div>
          </div>
        </label>
        <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-konkan-green-primary bg-konkan-green-primary/5' : 'border-konkan-sand hover:border-konkan-green-primary/50'}`}>
          <div className="flex items-center gap-3">
            <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => onMethodChange('cod')} className="text-konkan-green-primary focus:ring-konkan-green-primary" />
            <div><p className="font-medium text-konkan-text-primary">Cash on Delivery</p><p className="text-xs text-konkan-text-secondary">Pay when you receive your order</p></div>
          </div>
        </label>
      </div>
      <Button onClick={onPlaceOrder} size="lg" loading={processing} className="w-full">
        {paymentMethod === 'cod' ? `Place Order • ₹${totalAmount}` : `Pay ₹${totalAmount}`}
      </Button>
    </div>
  );
}
