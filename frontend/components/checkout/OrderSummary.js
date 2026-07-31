import Image from 'next/image';

export default function OrderSummary({ items = [], summary = {} }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl card p-4">
        <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-3">Order Summary</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-2 bg-konkan-cream/50 rounded-lg">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white shrink-0">
                {item.image ? <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-5 h-5 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
              </div>
              <div className="flex-1 min-w-0"><p className="text-xs font-medium text-konkan-text-primary truncate">{item.name}</p><p className="text-[10px] text-konkan-text-secondary">Qty: {item.quantity}</p></div>
              <span className="text-xs font-bold text-konkan-saffron">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
        <hr className="border-konkan-sand/50 my-3" />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-konkan-text-secondary">Subtotal</span><span>₹{summary.subtotal || 0}</span></div>
          {summary.coupon_discount > 0 && <div className="flex justify-between"><span className="text-konkan-text-secondary">Coupon</span><span className="text-konkan-success">-₹{summary.coupon_discount}</span></div>}
          <div className="flex justify-between"><span className="text-konkan-text-secondary">Shipping</span><span className={summary.shipping_charge === 0 ? 'text-konkan-success' : ''}>{summary.shipping_charge === 0 ? 'FREE' : `₹${summary.shipping_charge}`}</span></div>
          <div className="flex justify-between"><span className="text-konkan-text-secondary">GST</span><span>₹{summary.tax_amount || 0}</span></div>
          <hr className="border-konkan-sand/50" />
          <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-konkan-saffron">₹{summary.total || 0}</span></div>
        </div>
      </div>
      <div className="bg-konkan-cream/50 rounded-xl p-3 text-xs space-y-1.5 text-konkan-green-primary">
        <p>✓ Free delivery above ₹499</p>
        <p>⟳ 7-day easy returns</p>
        <p>Secure checkout</p>
      </div>
    </div>
  );
}
