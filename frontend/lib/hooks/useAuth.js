'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/lib/store/authStore';

export function useProfile() {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/profile');
      return res.data.data.user;
    },
    enabled: isAuthenticated,
    staleTime: 300000,
  });
}

export function useAddresses() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await api.get('/users/addresses');
      return res.data.data.addresses;
    },
    enabled: isAuthenticated,
  });
}

export function useLoyalty() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['loyalty'],
    queryFn: async () => {
      const res = await api.get('/users/loyalty');
      return res.data.data.loyalty;
    },
    enabled: isAuthenticated,
    staleTime: 60000,
  });
}
