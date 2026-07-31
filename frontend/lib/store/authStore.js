'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import useCartStore from './cartStore';
import useWishlistStore from './wishlistStore';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHydrated: () => set({ _hasHydrated: true }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          if (res.data.success) {
            localStorage.setItem('accessToken', res.data.data.accessToken);
            set({
              user: res.data.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            // Fetch user-specific data from server (not localStorage)
            useCartStore.getState().fetchCart();
            useWishlistStore.getState().fetchWishlist();
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Login failed.',
          };
        }
      },

      register: async (name, email, password, phone) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', { name, email, password, phone });
          if (res.data.success) {
            localStorage.setItem('accessToken', res.data.data.accessToken);
            set({
              user: res.data.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            // Fetch user-specific data from server (not localStorage)
            useCartStore.getState().fetchCart();
            useWishlistStore.getState().fetchWishlist();
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Registration failed.',
          };
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (e) {
          // ignore
        }
        localStorage.removeItem('accessToken');
        // Reset cart & wishlist in-memory state
        useCartStore.getState().resetCart();
        useWishlistStore.getState().resetWishlist();
        set({ user: null, isAuthenticated: false });
        window.dispatchEvent(new Event('auth:logout'));
      },

      fetchProfile: async () => {
        try {
          const res = await api.get('/users/profile');
          if (res.data.success) {
            set({ user: res.data.data.user, isAuthenticated: true });
          }
        } catch (error) {
          if (error.response?.status === 401) {
            set({ user: null, isAuthenticated: false });
            localStorage.removeItem('accessToken');
          }
        }
      },

      updateProfile: async (data) => {
        try {
          const res = await api.put('/users/profile', data);
          if (res.data.success) {
            set({ user: res.data.data.user });
            return { success: true };
          }
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || 'Update failed.',
          };
        }
      },
    }),
    {
      name: 'konkan-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      },
    }
  )
);

export default useAuthStore;
