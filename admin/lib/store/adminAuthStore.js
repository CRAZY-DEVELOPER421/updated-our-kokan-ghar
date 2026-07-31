'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_KEY || 'sakshisawant';

const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      isAdminAuthenticated: false,
      adminLoginTime: null,

      adminLogin: async (password) => {
        if (password === ADMIN_PASSWORD) {
          set({
            isAdminAuthenticated: true,
            adminLoginTime: new Date().toISOString(),
          });
          return { success: true };
        }
        return { success: false, message: 'Invalid admin password.' };
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
