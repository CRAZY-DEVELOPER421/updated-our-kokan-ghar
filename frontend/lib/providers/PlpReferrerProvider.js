'use client';

import { createContext, useContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { saveReferrer } from '@/lib/hooks/useScrollRestoration';

const PlpReferrerCtx = createContext(null);

/**
 * Wraps the PLP and provides saveReferrer() for product cards to call.
 * Product cards call save({ totalProducts }) before navigating to PDP.
 */
export function PlpReferrerProvider({ totalProducts = 0, children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const save = ({ totalProducts: count } = {}) => {
    saveReferrer(pathname, searchParams?.toString(), count ?? totalProducts);
  };

  return (
    <PlpReferrerCtx.Provider value={{ save, totalProducts }}>
      {children}
    </PlpReferrerCtx.Provider>
  );
}

export function usePlpReferrer() {
  return useContext(PlpReferrerCtx);
}
