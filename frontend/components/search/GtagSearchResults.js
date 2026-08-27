'use client';

import { useEffect } from 'react';
import { trackViewSearchResults, trackSearch } from '@/lib/gtag';

/**
 * Fires GA4 view_search_results + search events on the search results page.
 * Rendered inside the Server Component search page to bridge the boundary.
 */
export default function GtagSearchResults({ query, items = [] }) {
  useEffect(() => {
    if (!query) return;
    // Fire the base search event (for GA4 DebugView / Realtime)
    trackSearch(query);
    // Fire view_search_results with items (for GA4 ecommerce reports)
    if (items.length > 0) {
      trackViewSearchResults(query, items);
    }
  }, [query, items.length]);

  return null;
}
