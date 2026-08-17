'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export function QueryProviders({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              if (error?.response?.status === 429) return failureCount < 3;
              return failureCount < 1;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // On logout the backend deletes the user's notifications, so drop the
  // cached copies too — the bell badge and the notifications page clear
  // instantly instead of showing stale unread counts for the old account.
  useEffect(() => {
    const clearNotifications = () => {
      queryClient.removeQueries({ queryKey: ['notifications'] });
      queryClient.removeQueries({ queryKey: ['notif-unread-count'] });
      queryClient.removeQueries({ queryKey: ['notif-unread-count-desktop'] });
    };
    window.addEventListener('auth:logout', clearNotifications);
    return () => window.removeEventListener('auth:logout', clearNotifications);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
