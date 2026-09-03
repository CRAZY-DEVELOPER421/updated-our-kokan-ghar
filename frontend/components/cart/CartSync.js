'use client';

import { useEffect } from 'react';
import useCartStore from '@/lib/store/cartStore';

// Fetches the cart once on app load so in-cart state (navbar badge, card
// steppers, drawer) is correct on the first page — including the homepage,
// whose product rows otherwise never see existing cart items.
export default function CartSync() {
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return null;
}