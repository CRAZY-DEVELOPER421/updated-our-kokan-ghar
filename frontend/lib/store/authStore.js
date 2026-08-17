'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';
import useCartStore from './cartStore';
import useWishlistStore from './wishlistStore';

// Extract structured suspension info from an API error payload (or a plain
// object), so every code path stores the same shape.
const toSuspension = (payload = {}) => ({
  message: payload?.message || 'Your account has been suspended. Please contact support.',
  suspendUntil: payload?.suspendUntil || null,
  permanent: !!payload?.permanent,
});

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      // True when the signed-in (or attempted-login) account is suspended.
      // Kept separate from isAuthenticated so the navbar can show a
      // "Suspended + countdown" chip instead of the profile dropdown.
      suspended: false,
      suspension: null, // { message, suspendUntil, permanent }
      isLoading: false,
      _hasHydrated: false,

      setHydrated: () => set({ _hasHydrated: true }),

      markSuspended: (payload) =>
        set({ suspended: true, suspension: toSuspension(payload) }),

      clearSuspended: () => set({ suspended: false, suspension: null }),

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
            // Merge any guest cart into this account, then fetch user data
            await useCartStore.getState().mergeGuestCart();
            useWishlistStore.getState().fetchWishlist();
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          // Suspended account — remember it so the navbar can show the
          // "Suspended + timer" chip even without a successful login.
          if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_SUSPENDED') {
            get().markSuspended(error.response.data);
            return {
              success: false,
              message: error.response?.data?.message || 'Your account has been suspended.',
              status: 403,
              suspended: true,
              suspension: toSuspension(error.response.data),
            };
          }
          return {
            success: false,
            message: error.response?.data?.message || 'Login failed.',
            status: error.response?.status,
            // e.g. 'OAUTH_ONLY_ACCOUNT' — the login page shows a friendly popup
            // (Continue with Google / Forgot Password) instead of a red toast.
            code: error.response?.data?.code,
          };
        }
      },

      register: async (name, email, password, phone, referralCode) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', { name, email, password, phone, referral_code: referralCode || undefined });
          if (res.data.success) {
            localStorage.setItem('accessToken', res.data.data.accessToken);
            set({
              user: res.data.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
            // Merge any guest cart into this account, then fetch user data
            await useCartStore.getState().mergeGuestCart();
            useWishlistStore.getState().fetchWishlist();
            return { success: true };
          }
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Registration failed.',
            status: error.response?.status,
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
        set({ user: null, isAuthenticated: false, suspended: false, suspension: null });
        window.dispatchEvent(new Event('auth:logout'));
      },

      fetchProfile: async (silent = false) => {
        try {
          // silent=true is used for background re-syncs (e.g. on app mount):
          // the interceptor won't fire the global suspension popup for it.
          const res = await api.get('/users/profile', {
            headers: silent ? { 'X-Silent-Suspension': '1' } : {},
          });
          if (res.data.success) {
            // A successful profile fetch means the account is active again
            // (backend auto-reactivates expired timed suspensions).
            set({ user: res.data.data.user, isAuthenticated: true, suspended: false, suspension: null });
          }
        } catch (error) {
          if (error.response?.status === 401) {
            set({ user: null, isAuthenticated: false, suspended: false, suspension: null });
            localStorage.removeItem('accessToken');
          } else if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_SUSPENDED') {
            get().markSuspended(error.response.data);
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
        suspended: state.suspended,
        suspension: state.suspension,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      },
    }
  )
);

export default useAuthStore;
