'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      isAdminAuthenticated: false,
      adminLoginTime: null,

      // Admin password is verified by the BACKEND only. Never check it
      // client-side — putting the password in the JS bundle exposes it.
      adminLogin: async (password) => {
        try {
          const res = await api.post('/admin/login', { password });
          if (res.data?.success && res.data?.data?.accessToken) {
            localStorage.setItem('accessToken', res.data.data.accessToken);
            set({
              isAdminAuthenticated: true,
              adminLoginTime: new Date().toISOString(),
            });
            return { success: true };
          }
          return {
            success: false,
            message: res.data?.message || 'Invalid admin password.',
          };
        } catch (error) {
          return {
            success: false,
            message:
              error.response?.data?.message || 'Login failed. Please try again.',
          };
        }
      },

      adminLogout: () => {
        // Clear JWT token from localStorage so API calls stop working
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
        }
        set({ isAdminAuthenticated: false, adminLoginTime: null });
      },
    }),
    {
      name: 'konkan-admin-auth',
      partialize: (state) => ({
        isAdminAuthenticated: state.isAdminAuthenticated,
        adminLoginTime: state.adminLoginTime,
      }),
    }
  )
);

export default useAdminAuthStore;
