'use client';

import { useScrollRestoration } from '@/lib/hooks/useScrollRestoration';
import { PlpReferrerProvider } from '@/lib/providers/PlpReferrerProvider';

/**
 * Client wrapper for PLP pages — enables scroll restoration and
 * provides PlpReferrerProvider so product cards can save referrer info.
 */
export default function PlpScrollWrapper({ totalProducts = 0, children }) {
  useScrollRestoration();

  return (
    <PlpReferrerProvider totalProducts={totalProducts}>
      {children}
    </PlpReferrerProvider>
  );
}
