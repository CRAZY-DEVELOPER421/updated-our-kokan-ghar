'use client';

import { create } from 'zustand';
import api from '@/lib/api';

const useWishlistStore = create(
  (set, get) => ({
    items: [],
    count: 0,
    isLoading: false,

    resetWishlist: () => {
      set({ items: [], count: 0 });
    },

    // Listen for auth:logout event (dispatched by API interceptor on 401)
    _init: () => {
      if (typeof window !== 'undefined') {
        window.addEventListener('auth:logout', () => {
          useWishlistStore.getState().resetWishlist();
        });
      }
    },

    fetchWishlist: async () => {
      set({ isLoading: true });
      try {
        const res = await api.get('/wishlist');
        if (res.data.success) {
          set({
            items: res.data.data.wishlist,
            count: res.data.data.wishlist.length,
            isLoading: false,
          });
        }
      } catch (error) {
        set({ isLoading: false });
        if (error.response?.status === 401) {
          set({ items: [], count: 0 });
        }
      }
    },

    toggleWishlist: async (productId) => {
      const existing = get().items.find((item) => item.product_id === parseInt(productId));
      if (existing) {
        try {
          await api.delete(`/wishlist/${productId}`);
          set((state) => {
            const newItems = state.items.filter((i) => i.product_id !== parseInt(productId));
            return { items: newItems, count: newItems.length };
          });
          return { success: true, inWishlist: false };
        } catch (error) {
          return { success: false, message: 'Failed to remove from wishlist.' };
        }
      } else {
        try {
          await api.post(`/wishlist/${productId}`);
          await get().fetchWishlist();
          return { success: true, inWishlist: true };
        } catch (error) {
          return { success: false, message: 'Failed to add to wishlist.' };
        }
      }
    },

    isInWishlist: (productId) => {
      return get().items.some((item) => item.product_id === parseInt(productId));
    },
  })
);

// Initialize auth:logout listener
useWishlistStore.getState()._init();

export default useWishlistStore;
