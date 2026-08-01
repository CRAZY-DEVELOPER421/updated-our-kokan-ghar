'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import useCartStore from '@/lib/store/cartStore';
import { getImageUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function BuyAgainPage() {
  const addToCart = useCartStore((s) => s.addToCart);
  const [addingId, setAddingId] = useState(null);
  const [addedAll, setAddedAll] = useState(false);

  const { data: items, isLoading } = useQuery({
    queryKey: ['buy-again'],
    queryFn: async () => {
      // Fetch recent orders, then their item lists (list API doesn't include items)
      const listRes = await api.get('/orders?limit=10');
      const orders = listRes.data.data?.orders || [];

      const details = await Promise.all(
        orders
          .filter((o) => o.status !== 'cancelled' && o.status !== 'return_requested')
          .map((o) =>
            api.get(`/orders/${o.order_number}`).catch(() => null)
          )
      );

      // Aggregate by product so each product appears once with total qty
      const map = new Map();
      details.filter(Boolean).forEach((res) => {
        const order = res.data?.data?.order;
        (order?.items || []).forEach((it) => {
          const pid = it.product_id;
          if (!pid) return;
          const existing = map.get(pid);
          if (existing) {
            existing.quantity += it.quantity;
          } else {
            map.set(pid, {
              product_id: pid,
              product_name: it.product_name,
              product_image: it.product_image,
              unit_price: it.unit_price,
              quantity: it.quantity,
            });
          }
        });
      });

      return Array.from(map.values());
    },
  });

  const handleAdd = async (item) => {
    if (addingId) return;
    setAddingId(item.product_id);
    try {
      const res = await addToCart(item.product_id, null, 1);
      if (res.success) {
        toast.success(`${item.product_name} added to cart`);
      } else {
        toast.error(res.message || 'Failed to add to cart');
      }
    } finally {
      setAddingId(null);
    }
  };

  const handleAddAll = async () => {
    if (!items?.length) return;
    let ok = 0;
    for (const item of items) {
      const res = await addToCart(item.product_id, null, 1);
      if (res.success) ok += 1;
    }
    if (ok > 0) {
      setAddedAll(true);
      toast.success(`${ok} item${ok > 1 ? 's' : ''} added to cart`);
    } else {
      toast.error('Could not add items to cart');
    }
  };

  const totalPrice = useMemo(
    () => (items || []).reduce((sum, it) => sum + Number(it.unit_price || 0), 0),
    [items]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl card p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="image" />
            <div className="flex-1 space-y-1"><Skeleton variant="title" /><Skeleton variant="text" className="w-1/3" /></div>
          </div>
        ))}
      </div>
    );
  }

  if (!items?.length) {
    return (
      <div className="bg-white rounded-2xl card p-10 text-center">
        <div className="mb-4 flex justify-center">
          <svg className="w-10 h-10 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-1">Nothing to buy again yet</h2>
        <p className="text-sm text-konkan-text-secondary mb-4">Items from your past orders will show up here for quick re-ordering.</p>
        <Link href="/products"><Button>Start Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-lg text-konkan-text-primary">Buy Again</h2>
          <p className="text-xs text-konkan-text-secondary">
            {items.length} product{items.length > 1 ? 's' : ''} · ₹{totalPrice.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {addedAll ? (
            <Link href="/cart">
              <Button size="sm">Go to Cart</Button>
            </Link>
          ) : (
            <Button size="sm" onClick={handleAddAll}>Add All to Cart</Button>
          )}
        </div>
      </div>

      {/* Product list */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.product_id} className="flex items-center gap-3 bg-white rounded-xl card p-3 hover:shadow-card-hover transition-all">
            {/* Image */}
            <div className="w-16 h-16 rounded-lg bg-konkan-cream overflow-hidden shrink-0 flex items-center justify-center">
              {item.product_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={getImageUrl(item.product_image)} alt={item.product_name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-konkan-sand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-konkan-text-primary line-clamp-2">{item.product_name}</p>
              <p className="text-xs text-konkan-text-secondary mt-0.5">
                ₹{Number(item.unit_price || 0).toLocaleString('en-IN')} · bought {item.quantity}×
              </p>
            </div>

            {/* Action */}
            <div className="shrink-0">
              <Button size="sm" variant="outline" disabled={addingId !== null} onClick={() => handleAdd(item)}>
                {addingId === item.product_id ? 'Adding…' : 'Add'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
