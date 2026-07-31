'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/lib/store/authStore';

export function useCart() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await api.get('/cart');
      return res.data.data;
    },
    enabled: isAuthenticated,
    staleTime: 30000,
  });
}
