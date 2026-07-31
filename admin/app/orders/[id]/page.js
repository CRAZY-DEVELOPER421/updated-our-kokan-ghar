'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: 'bg-yellow-50 text-yellow-700', confirmed: 'bg-blue-50 text-blue-700',
  processing: 'bg-konkan-green-primary/10 text-konkan-green-primary', shipped: 'bg-purple-50 text-purple-700',
  out_for_delivery: 'bg-orange-50 text-orange-700', delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700', returned: 'bg-gray-50 text-gray-700',
};

export default function AdminOrderDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [updating, setUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const res = await api.get(`/admin/orders/${id}`);
      return res.data.data.order;
    },
  });

  const order = data;

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus, message: statusMsg || `Status updated to ${newStatus}` });
      toast.success(`Order status updated to ${newStatus}`);
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setStatusMsg('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status.'); }
    setUpdating(false);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-konkan-green-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!order) return <div className="text-center py-12 text-gray-500">Order not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className=" text-2xl font-bold text-gray-900">Order #{order.order_number}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Placed on {new Date(order.created_at).toLocaleString('en-IN')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => router.push('/orders')}>← Back</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Details + Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="bg-white rounded-xl border border-konkan-sand/60 p-5">
            <h2 className=" font-bold text-gray-900 mb-3">Order Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-xs text-gray-500">Total Amount</p><p className="font-bold text-gray-900">₹{order.total_amount}</p></div>
              <div><p className="text-xs text-gray-500">Payment</p><p className="capitalize text-gray-900">{order.payment_method}</p></div>
              <div><p className="text-xs text-gray-500">Payment Status</p><p className={`font-medium ${order.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.payment_status}</p></div>
              <div><p className="text-xs text-gray-500">Status</p><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600'}`}>{order.status}</span></div>
              {order.subtotal > 0 && <div><p className="text-xs text-gray-500">Subtotal</p><p className="text-gray-900">₹{order.subtotal}</p></div>}
              {order.coupon_discount > 0 && <div><p className="text-xs text-gray-500">Coupon</p><p className="text-green-600">-₹{order.coupon_discount}</p></div>}
              {order.coupon_code && <div><p className="text-xs text-gray-500">Coupon Code</p><p className="font-mono text-gray-900">{order.coupon_code}</p></div>}
              {order.estimated_delivery && <div><p className="text-xs text-gray-500">Est. Delivery</p><p className="text-gray-900">{new Date(order.estimated_delivery).toLocaleDateString('en-IN')}</p></div>}
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl border border-konkan-sand/60 p-5">
            <h2 className=" font-bold text-gray-900 mb-3">Items ({order.items?.length || 0})</h2>
            <div className="space-y-2">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.product_image && <img src={item.product_image} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.unit_price}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">₹{item.total_price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tracking History */}
          {order.tracking?.length > 0 && (
            <div className="bg-white rounded-xl border border-konkan-sand/60 p-5">
              <h2 className=" font-bold text-gray-900 mb-3">Tracking History</h2>
              <div className="space-y-3">
                {order.tracking.map((t, i) => (
                  <div key={t.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${i === 0 ? 'bg-konkan-green-primary' : 'bg-gray-200'}`} />
                      {i < order.tracking.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 mt-1" />}
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium text-gray-900 capitalize">{t.status}</p>
                      {t.message && <p className="text-xs text-gray-500">{t.message}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(t.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Customer + Actions */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-konkan-sand/60 p-5">
            <h2 className=" font-bold text-gray-900 mb-3">Customer</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{order.user_name}</p>
              <p className="text-gray-500">{order.user_email}</p>
              {order.user_phone && <p className="text-gray-500">{order.user_phone}</p>}
            </div>
            {order.address && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-600 mb-1">Shipping Address</p>
                <p className="text-xs text-gray-500">{order.address.house_no}, {order.address.street}</p>
                <p className="text-xs text-gray-500">{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                {order.address.phone && <p className="text-xs text-gray-500">Phone: {order.address.phone}</p>}
              </div>
            )}
          </div>

          {/* Update Status */}
          <div className="bg-white rounded-xl border border-konkan-sand/60 p-5">
            <h2 className=" font-bold text-gray-900 mb-3">Update Status</h2>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => handleStatusUpdate(s)} disabled={updating || s === order.status}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all capitalize ${s === order.status ? 'bg-konkan-green-primary text-white' : 'bg-konkan-cream text-konkan-text-secondary hover:bg-konkan-sand'}`}
                  >{s === 'out_for_delivery' ? 'Out for Delivery' : s}</button>
                ))}
              </div>
              <textarea className="w-full border border-konkan-sand/60 rounded-lg px-3 py-2 text-xs text-gray-900 resize-none h-16 focus:outline-none focus:ring-2 focus:ring-konkan-green-primary/20" value={statusMsg} onChange={e => setStatusMsg(e.target.value)} placeholder="Status update message (optional)..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
