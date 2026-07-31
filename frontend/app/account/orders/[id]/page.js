'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import StarRating from '@/components/ui/StarRating';
import toast from 'react-hot-toast';
import Breadcrumb from '@/components/ui/Breadcrumb';

const STATUS_VARIANTS = {
  pending: 'default',
  confirmed: 'primary',
  processing: 'ocean',
  shipped: 'accent',
  delivered: 'success',
  cancelled: 'error',
};

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', params.id],
    queryFn: async () => {
      const res = await api.get(`/orders/${params.id}`);
      return res.data.data.order;
    },
    enabled: !!params.id,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl card p-6 space-y-6">
        <Skeleton variant="heading" />
        <Skeleton variant="text" className="w-1/2" />
        <div className="flex gap-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="avatar" />)}</div>
        <Skeleton variant="card" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-2xl card p-10 text-center">
        <div className="mb-4 flex justify-center">
          <svg className="w-10 h-10 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-1">Order not found</h2>
        <p className="text-sm text-konkan-text-secondary mb-4">This order may have been removed or doesn't exist.</p>
        <Link href="/account/orders"><Button>Back to Orders</Button></Link>
      </div>
    );
  }

  const timelineStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIdx = timelineStatuses.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumb items={[
        { label: 'Account', href: '/account' },
        { label: 'Orders', href: '/account/orders' },
        { label: `#${order.order_number}` },
      ]} />

      {/* Order Header */}
      <div className="bg-white rounded-2xl card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-konkan-text-primary">
              Order #{order.order_number}
            </h2>
            <p className="text-sm text-konkan-text-secondary">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Badge variant={STATUS_VARIANTS[order.status] || 'default'} className="text-sm capitalize px-4 py-1">
            {order.status}
          </Badge>
        </div>

        {/* Timeline */}
        {isCancelled ? (
          <div className="bg-red-50 rounded-xl p-4 text-sm text-red-700 flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            <div>
              <p className="font-medium">Order Cancelled</p>
              <p className="text-xs text-red-500 mt-0.5">This order was cancelled on {order.updated_at ? new Date(order.updated_at).toLocaleDateString('en-IN') : 'N/A'}</p>
            </div>
          </div>
        ) : (
          <div className="relative mt-4">
            {/* Progress Bar */}
            <div className="hidden sm:flex items-center justify-between mb-2">
              {STATUS_STEPS.map((step, idx) => (
                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all ${
                    idx <= currentIdx ? 'bg-konkan-green-primary text-white' : 'bg-konkan-sand text-konkan-text-secondary'
                  }`}>
                    {idx < currentIdx ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs">{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-[10px] mt-1 text-center font-medium ${
                    idx <= currentIdx ? 'text-konkan-green-primary' : 'text-konkan-text-secondary'
                  }`}>{step.label}</span>
                  {idx < STATUS_STEPS.length - 1 && (
                    <div className={`absolute top-4 left-[60%] w-[80%] h-0.5 -translate-y-1/2 ${
                      idx < currentIdx ? 'bg-konkan-green-primary' : 'bg-konkan-sand'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Timeline */}
            <div className="sm:hidden space-y-2 mt-2">
              {STATUS_STEPS.map((step, idx) => (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    idx <= currentIdx ? 'bg-konkan-green-primary text-white' : 'bg-konkan-sand text-konkan-text-secondary'
                  }`}>
                    {idx < currentIdx ? (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs">{idx + 1}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${idx <= currentIdx ? 'text-konkan-green-primary' : 'text-konkan-text-secondary'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Estimated Delivery */}
            {order.estimated_delivery && (
              <div className="mt-4 flex items-center gap-2 text-sm bg-konkan-cream rounded-lg p-3">
                <svg className="w-4 h-4 text-konkan-green-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>Estimated delivery: <strong>{new Date(order.estimated_delivery).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-2xl card p-6">
        <h3 className="font-display font-bold text-konkan-text-primary mb-4">Items ({order.items?.length || 0})</h3>
        <div className="space-y-3">
          {(order.items || []).map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-konkan-cream/50">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><svg className="w-5 h-5 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="text-sm font-medium text-konkan-text-primary hover:text-konkan-green-primary transition-colors line-clamp-1">
                  {item.name}
                </Link>
                {item.variant_name && (
                  <p className="text-xs text-konkan-text-secondary">{item.variant_name}: {item.variant_value}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-konkan-text-primary">₹{item.price} × {item.quantity}</span>
                </div>
              </div>
              <span className="text-sm font-bold text-konkan-saffron shrink-0">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Price Summary */}
      <div className="bg-white rounded-2xl card p-6">
        <h3 className="font-display font-bold text-konkan-text-primary mb-3">Price Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-konkan-text-secondary">Subtotal</span><span>₹{order.subtotal || 0}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span className="text-konkan-text-secondary">Discount</span><span className="text-konkan-success">-₹{order.discount}</span></div>}
          {order.coupon_discount > 0 && <div className="flex justify-between"><span className="text-konkan-text-secondary">Coupon</span><span className="text-konkan-success">-₹{order.coupon_discount}</span></div>}
          <div className="flex justify-between"><span className="text-konkan-text-secondary">Shipping</span><span className={order.shipping_charge === 0 ? 'text-konkan-success' : ''}>{order.shipping_charge === 0 ? 'FREE' : `₹${order.shipping_charge}`}</span></div>
          <div className="flex justify-between"><span className="text-konkan-text-secondary">GST</span><span>₹{order.tax_amount || 0}</span></div>
          <hr className="border-konkan-sand/50" />
          <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-konkan-saffron">₹{order.total_amount || 0}</span></div>
        </div>
      </div>

      {/* Delivery Address */}
      {order.address && (
        <div className="bg-white rounded-2xl card p-6">
          <h3 className="font-display font-bold text-konkan-text-primary mb-3">Delivery Address</h3>
          <div className="text-sm text-konkan-text-secondary space-y-0.5">
            <p className="font-medium text-konkan-text-primary">{order.address.name}</p>
            <p>{order.address.house_no}, {order.address.street}</p>
            <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
            <p>Phone: {order.address.phone}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <Button variant="outline" size="sm" onClick={async () => {
            if (confirm('Are you sure you want to cancel this order?')) {
              try {
                const res = await api.post(`/orders/${order.id}/cancel`);
                if (res.data.success) {
                  toast.success('Order cancelled');
                  router.refresh();
                }
              } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to cancel order');
              }
            }
          }}>
            Cancel Order
          </Button>
        )}
        <Link href="/account/orders"><Button variant="outline" size="sm">Back to Orders</Button></Link>
        <Link href="/products"><Button variant="ghost" size="sm">Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
