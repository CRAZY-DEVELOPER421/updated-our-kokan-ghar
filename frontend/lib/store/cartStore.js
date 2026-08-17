'use client';

import { create } from 'zustand';
import api from '@/lib/api';
import { clearGuestId } from '@/lib/guest';

const useCartStore = create(
  (set, get) => ({
    items: [],
    coupon: null,
    summary: null,
    isLoading: false,
    itemCount: 0,

    resetCart: () => {
      set({ items: [], coupon: null, summary: null, itemCount: 0 });
    },

    // Listen for auth:logout event (dispatched by API interceptor on 401)
    _init: () => {
      if (typeof window !== 'undefined') {
        window.addEventListener('auth:logout', () => {
          useCartStore.getState().resetCart();
        });
      }
    },

    fetchCart: async () => {
      set({ isLoading: true });
      try {
        const res = await api.get('/cart');
        if (res.data.success) {
          set({
            items: res.data.data.items,
            coupon: res.data.data.cart.coupon_code,
            summary: res.data.data.summary,
            itemCount: res.data.data.summary?.item_count || 0,
            isLoading: false,
          });
        }
      } catch (error) {
        set({ isLoading: false });
        if (error.response?.status === 401) {
          set({ items: [], coupon: null, summary: null, itemCount: 0 });
        }
      }
    },

    // Merge the guest cart (device id) into the logged-in user's cart.
    // Called right after login/signup so nothing is lost at checkout.
    mergeGuestCart: async () => {
      try {
        const res = await api.post('/cart/merge');
        if (res.data.success) {
          // Guest cart is now owned by the account — drop the device id so a
          // future guest session starts fresh.
          clearGuestId();
          await get().fetchCart();
          return { success: true, merged: res.data.data?.merged || 0, message: res.data.message };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to merge cart.',
        };
      }
      return { success: false, message: 'Failed to merge cart.' };
    },

    addToCart: async (productId, variantId = null, quantity = 1) => {
      try {
        const res = await api.post('/cart/items', { product_id: productId, variant_id: variantId, quantity });
        if (res.data.success) {
          await get().fetchCart();
          return { success: true, message: 'Added to cart' };
        }
      } catch (error) {
        if (error.response?.status === 401) {
          return { success: false, message: 'Please login to add items to cart.' };
        }
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to add to cart.',
        };
      }
    },

    updateQuantity: async (itemId, quantity) => {
      try {
        const res = await api.put(`/cart/items/${itemId}`, { quantity });
        if (res.data.success) {
          await get().fetchCart();
          return { success: true };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to update cart.',
        };
      }
    },

    removeItem: async (itemId) => {
      const prevItems = get().items;
      const prevCount = get().itemCount;
      set({
        items: prevItems.filter(i => i.id !== itemId),
        itemCount: Math.max(0, prevCount - 1),
      });
      try {
        await api.delete(`/cart/items/${itemId}`);
        await get().fetchCart();
        return { success: true };
      } catch (error) {
        set({ items: prevItems, itemCount: prevCount });
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to remove item.',
        };
      }
    },

    clearCart: async () => {
      const prevItems = get().items;
      const prevCoupon = get().coupon;
      const prevCount = get().itemCount;
      set({ items: [], coupon: null, summary: null, itemCount: 0 });
      try {
        await api.delete('/cart/clear');
        return { success: true };
      } catch (error) {
        set({ items: prevItems, coupon: prevCoupon, itemCount: prevCount });
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to clear cart.',
        };
      }
    },

    applyCoupon: async (code) => {
      try {
        const res = await api.post('/cart/apply-coupon', { code });
        if (res.data.success) {
          await get().fetchCart();
          return { success: true, message: res.data.message };
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Invalid coupon.',
        };
      }
    },

    removeCoupon: async () => {
      try {
        await api.delete('/cart/remove-coupon');
        set({ coupon: null });
        await get().fetchCart();
        return { success: true };
      } catch (error) {
        return { success: false, message: 'Failed to remove coupon.' };
      }
    },
  })
);

// Initialize auth:logout listener
useCartStore.getState()._init();

export default useCartStore;
