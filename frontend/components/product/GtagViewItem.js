'use client';

import { useEffect } from 'react';
import { trackViewItem } from '@/lib/gtag';

/**
 * Fires GA4 view_item event when a product detail page mounts.
 * Rendered inside the Server Component product page to bridge
 * the server → client boundary.
 */
export default function GtagViewItem({ product }) {
  useEffect(() => {
    if (product?.id) {
      trackViewItem(product);
    }
  }, [product?.id, product?.price]);

  return null;
}
