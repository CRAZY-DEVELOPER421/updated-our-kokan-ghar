'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const STORAGE_PREFIX = 'scroll-pos:';

/**
 * Saves the current scroll position to sessionStorage when the user navigates
 * away from this page, and restores it when they return.
 *
 * Usage: call useScrollRestoration() in any page component that should
 * remember its scroll position (e.g. PLP /products, /categories/[slug]).
 */
export function useScrollRestoration() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const key = STORAGE_PREFIX + pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
  const hasRestored = useRef(false);

  // Restore scroll position on mount
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;

    const saved = sessionStorage.getItem(key);
    if (saved) {
      // Small delay to let the page render before scrolling
      requestAnimationFrame(() => {
        window.scrollTo(0, parseInt(saved, 10));
        sessionStorage.removeItem(key);
      });
    }
  }, [key]);

  // Save scroll position before navigating away
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    // Also save on popstate (back/forward)
    const handlePopState = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [key]);
}

/**
 * Saves a "referrer" entry so the PDP can show a "Back to results" link.
 * Call this from the PLP when a product card is clicked.
 */
export function saveReferrer(pathname, searchParams, totalProducts) {
  const url = pathname + (searchParams ? `?${searchParams}` : '');
  sessionStorage.setItem('plp-referrer', JSON.stringify({
    url,
    totalProducts,
    scrollY: window.scrollY,
    timestamp: Date.now(),
  }));
}

/**
 * Retrieves and clears the PLP referrer info (for BackToResults bar).
 */
export function getReferrer() {
  try {
    const raw = sessionStorage.getItem('plp-referrer');
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Expire after 30 minutes
    if (Date.now() - data.timestamp > 30 * 60 * 1000) {
      sessionStorage.removeItem('plp-referrer');
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Clears the saved scroll position for a given key.
 */
export function clearScrollPosition(pathname, searchParams) {
  const key = STORAGE_PREFIX + pathname + (searchParams ? `?${searchParams}` : '');
  sessionStorage.removeItem(key);
}
