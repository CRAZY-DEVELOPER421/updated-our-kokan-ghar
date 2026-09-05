'use client';

import dynamic from 'next/dynamic';
import { useBuyBar } from './BuyBarContext';
import { useFlyToCart } from '@/components/ui/FlyToCart';

const ProductActions = dynamic(() => import('./ProductActions'), {
  loading: () => <div className="skeleton h-40 w-full rounded-xl" />,
});

/**
 * Wraps ProductActions with the IntersectionObserver ref from BuyBarContext
 * and passes flyToCart as a prop (avoids context issues with dynamic imports).
 */
export default function ProductActionsWrapper({ product, stockQuantity, variants }) {
  const { actionsRef } = useBuyBar();
  const flyToCart = useFlyToCart();

  return (
    <div ref={actionsRef}>
      <ProductActions
        product={product}
        stockQuantity={stockQuantity}
        variants={variants}
        flyToCart={flyToCart}
      />
    </div>
  );
}
