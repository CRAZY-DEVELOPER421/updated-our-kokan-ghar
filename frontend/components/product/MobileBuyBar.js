'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import useCartStore from '@/lib/store/cartStore';
import useAuthStore from '@/lib/store/authStore';
import useBottomNavVisibility from '@/lib/hooks/useBottomNavVisibility';
import { getImageUrl } from '@/lib/utils';
import { trackAddToCart } from '@/lib/gtag';
import { useBuyBar } from './BuyBarContext';
import { useFlyToCart } from '@/components/ui/FlyToCart';

/**
 * Sticky mobile buy bar — Amazon/Flipkart style.
 * Sits at the bottom (above the mobile bottom-nav) and appears
 * once the user scrolls past the main ProductActions section.
 *
 * Reads cart state directly from the Zustand store — no parent-child
 * state syncing needed. When ProductActions updates the cart, this
 * component re-renders naturally on the next store update.
 */
export default function MobileBuyBar({ product, selectedVariant, variants = [], effectiveStock = 0 }) {
  const router = useRouter();
  const { visible } = useBuyBar();
  const { navVisible } = useBottomNavVisibility();
  const flyToCart = useFlyToCart();
  const items = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [isAdding, setIsAdding] = useState(false);

  const productId = product.id;

  // Resolve the active variant — prefer the one chosen in ProductActions,
  // fall back to the first in-stock variant.
  const activeVariant = selectedVariant || variants.find((v) => Number(v.stock_quantity) > 0) || variants[0] || null;

  const basePrice = Number(product.price) || 0;
  const variantPrice = activeVariant
    ? basePrice + (Number(activeVariant.price_modifier) || 0)
    : basePrice;

  // Cart item for this product + variant combination
  const cartItem = items.find(
    (item) =>
      parseInt(item.product_id) === parseInt(productId) &&
      (activeVariant
        ? parseInt(item.variant_id || 0) === parseInt(activeVariant.id)
        : !item.variant_id),
  );
  const isInCart = !!cartItem;
  const cartItemId = cartItem?.id;

  // Local quantity — starts at 1, syncs with cart when the item exists
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (cartItem?.quantity) {
      setQty(cartItem.quantity);
    }
  }, [cartItem?.quantity]);

  const decreaseQty = useCallback(() => {
    const next = Math.max(1, qty - 1);
    setQty(next);
    if (isInCart && cartItemId) updateQuantity(cartItemId, next);
  }, [qty, isInCart, cartItemId, updateQuantity]);

  const increaseQty = useCallback(() => {
    const next = Math.min(effectiveStock || 99, qty + 1);
    setQty(next);
    if (isInCart && cartItemId) updateQuantity(cartItemId, next);
  }, [qty, effectiveStock, isInCart, cartItemId, updateQuantity]);



  // ── Buy Now ─────────────────────────────────────────
  const handleBuyNow = useCallback(async () => {
    setIsAdding(true);
    const res = await addToCart(productId, activeVariant?.id || null, qty);
    setIsAdding(false);
    if (res.success) {
      trackAddToCart(
        {
          id: product.id,
          name: product.name,
          price: variantPrice,
          category_name: product.category_name || product.category || '',
          category_id: product.category_id || '',
          brand: product.brand || 'Konkan Ghar',
        },
        qty,
      );
      router.push('/checkout');
    } else if (!useAuthStore.getState().suspended) {
      toast.error(res.message || 'Failed to add to cart');
    }
  }, [productId, activeVariant, qty, addToCart, router, variantPrice, product]);

  const thumbnail = getImageUrl(product.images?.[0]?.image_url || product.primary_image);
  const outOfStock = effectiveStock === 0;

  // ── Add to Cart ─────────────────────────────────────
  const handleAddToCart = useCallback(async (e) => {
    const startRect = e?.currentTarget?.getBoundingClientRect?.();
    setIsAdding(true);
    const res = await addToCart(productId, activeVariant?.id || null, qty);
    setIsAdding(false);
    if (res.success) {
      // Fly-to-cart animation
      if (flyToCart && thumbnail && startRect) {
        flyToCart(thumbnail, startRect.left + startRect.width / 2, startRect.top + startRect.height / 2);
      }
      trackAddToCart(
        {
          id: product.id,
          name: product.name,
          price: variantPrice,
          category_name: product.category_name || product.category || '',
          category_id: product.category_id || '',
          brand: product.brand || 'Konkan Ghar',
        },
        qty,
      );
    } else if (!useAuthStore.getState().suspended) {
      toast.error(res.message || 'Failed to add to cart');
    }
  }, [productId, activeVariant, qty, addToCart, flyToCart, thumbnail, variantPrice, product]);

  return (
    <div
      className="lg:hidden fixed left-0 right-0 z-[99] transition-[transform,bottom] duration-300 ease-out"
      style={{
        bottom: navVisible ? '60px' : '0px', // sits above the bottom nav — drops to the floor when the nav hides
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: visible ? '0 -2px 12px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      <div className="bg-white border-t border-gray-200">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          {/* Thumbnail */}
          {thumbnail && (
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-konkan-cream shrink-0">
              <Image
                src={thumbnail}
                alt={product.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Price + Quantity */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-lg font-bold text-konkan-saffron tabular-nums leading-none">
              ₹{variantPrice}
            </span>
            <div className="flex items-center border border-konkan-sand rounded-md">
              <button
                onClick={decreaseQty}
                disabled={qty <= 1}
                className="w-6 h-6 flex items-center justify-center text-xs text-konkan-text-secondary hover:text-konkan-text-primary disabled:opacity-30"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-6 h-6 flex items-center justify-center text-xs font-medium border-x border-konkan-sand tabular-nums">
                {qty}
              </span>
              <button
                onClick={increaseQty}
                disabled={qty >= effectiveStock}
                className="w-6 h-6 flex items-center justify-center text-xs text-konkan-text-secondary hover:text-konkan-text-primary disabled:opacity-30"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex-1 flex flex-col gap-1.5 min-w-0">
            {/* Add to Cart */}
            {isInCart ? (
              <button
                onClick={() => router.push('/cart')}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-green-50 text-green-700 border border-green-200 active:scale-[0.98] flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Go to Cart
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isAdding || outOfStock}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-konkan-green-primary to-konkan-green-secondary text-white active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isAdding ? (
                  <svg className="w-3.5 h-3.5 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : outOfStock ? null : (
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                )}
                {outOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
              </button>
            )}

            {/* Buy Now — only when not yet in cart */}
            {!isInCart && (
              <button
                onClick={handleBuyNow}
                disabled={isAdding || outOfStock}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-konkan-saffron to-orange-500 text-white active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Buy Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
