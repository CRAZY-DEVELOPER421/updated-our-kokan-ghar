'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/**
 * Shared hook to fetch public site settings (logo, contact info, social links).
 * Cached for 5 minutes so headers/footers don't refetch on every navigation.
 */
export function useSiteSettings() {
  return useQuery({
    queryKey: ['public-settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export default useSiteSettings;
