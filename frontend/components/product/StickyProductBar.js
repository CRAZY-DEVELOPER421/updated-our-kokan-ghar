'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import useCartStore from '@/lib/store/cartStore';
import useAuthStore from '@/lib/store/authStore';
import useScrollDirection from '@/lib/hooks/useScrollDirection';
import { getImageUrl } from '@/lib/utils';
import { trackAddToCart } from '@/lib/gtag';
import { useFlyToCart } from '@/components/ui/FlyToCart';

/**
 * Sticky compact product bar — Amazon/Flipkart style (DESKTOP).
 *
 * Once the user scrolls past the buy box (>600px) while reading reviews or
 * the FAQ, a slim bar slides in just below the sticky navbar:
 * thumbnail + product name + price + Add to Cart — the CTA stays one click
 * away instead of forcing a scroll back to the top.
 *
 * Behaviour:
 *  - Appears after scrollY > 600px
 *  - Hides while actively scrolling DOWN (clean reading), slides back in
 *    ~300ms after scrolling stops (reading reviews) or on scroll UP
 *  - Sits below the navbar (top: 72px) and hides behind it via translate —
 *    the navbar's category row is always collapsed whenever this bar is
 *    visible, so the two never overlap.
 *
 * Desktop-only by design: mobile already has the bottom MobileBuyBar
 * (with qty stepper + Buy Now). Same cart logic + auto-selected first
 * in-stock variant, so the CTA charges exactly what the page shows.
 */
const SHOW_AFTER = 600; // px scrolled before the bar may appear

export default function StickyProductBar({ product, variants = [], effectiveStock = 0 }) {
  const { isScrolled, scrollDir } = useScrollDirection({ threshold: SHOW_AFTER });
  const [atRest, setAtRest] = useState(false);

  // "At rest" = no scroll activity for 300ms. The bar reappears while the
  // user is reading (stopped) even though the last scroll was downwards —
  // otherwise it would only flash during active up-scrolling.
  useEffect(() => {
    let timer;
    const armRestTimer = () => {
      setAtRest(false);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setAtRest(true), 300);
    };
    window.addEventListener('scroll', armRestTimer, { passive: true });
    armRestTimer(); // start armed — becomes true if the page loads scrolled (deep link)
    return () => {
      window.removeEventListener('scroll', armRestTimer);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Visible when far enough down, not actively scrolling down, and at rest
  const visible = isScrolled && (scrollDir !== 'down' || atRest);

  const flyToCart = useFlyToCart();
  const items = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const [isAdding, setIsAdding] = useState(false);

  const productId = product.id;

  // Same variant resolution as ProductActions/MobileBuyBar: first in-stock
  const activeVariant = variants.find((v) => Number(v.stock_quantity) > 0) || variants[0] || null;

  const basePrice = Number(product.price) || 0;
  const mrp = Number(product.mrp) || 0;
  const variantPrice = basePrice + (Number(activeVariant?.price_modifier) || 0);
  const savings = mrp > variantPrice ? mrp - variantPrice : 0;
  const outOfStock = effectiveStock === 0;

  // In-cart state for THIS product + variant
  const cartItem = items.find(
    (item) =>
      parseInt(item.product_id) === parseInt(productId) &&
      (activeVariant
        ? parseInt(item.variant_id || 0) === parseInt(activeVariant.id)
        : !item.variant_id),
  );
  const isInCart = !!cartItem;

  const thumbnail = getImageUrl(product.images?.[0]?.image_url || product.primary_image);
  const name = product.regional_name || product.name || '';
  const slug = product.slug;

  const handleAddToCart = useCallback(async (e) => {
    const startRect = e?.currentTarget?.getBoundingClientRect?.();
    setIsAdding(true);
    const res = await addToCart(productId, activeVariant?.id || null, 1);
    setIsAdding(false);
    if (res.success) {
      // Fly-to-cart animation — rect captured before await to avoid stale DOM ref
      if (flyToCart && thumbnail && startRect) {
        flyToCart(thumbnail, startRect.left + startRect.width / 2, startRect.top + startRect.height / 2);
      }
      trackAddToCart(
        {
          id: product.id,
          name,
          price: variantPrice,
          category_name: product.category_name || product.category || '',
          category_id: product.category_id || '',
          brand: product.brand || 'Konkan Ghar',
        },
        1,
      );
    } else if (!useAuthStore.getState().suspended) {
      // Suspended → the global gate popup already explains it; no error toast.
      toast.error(res.message || 'Failed to add to cart');
    }
  }, [productId, activeVariant, addToCart, flyToCart, thumbnail, variantPrice, product, name]);

  return (
    <div
      className={`hidden lg:block fixed inset-x-0 z-[45] transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0 visible' : '-translate-y-full invisible'
      }`}
      style={{ top: '72px' }} // sits directly below the sticky desktop navbar
      role="region"
      aria-label="Quick add product bar"
    >
      <div className="bg-white/95 dark:bg-[#0f0f1a]/95 backdrop-blur-md border-b border-konkan-sand/60 dark:border-[#2a2a40] shadow-[0_6px_24px_rgba(0,0,0,0.08)]">
        <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 flex items-center gap-3 h-14">
          {/* Thumbnail */}
          {thumbnail && (
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-konkan-cream dark:bg-[#1e1e30] shrink-0">
              <Image
                src={thumbnail}
                alt={name}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          )}

          {/* Name + price */}
          <div className="flex-1 min-w-0">
            <Link
              href={`/products/${slug}`}
              className="block text-sm font-semibold text-konkan-text-primary dark:text-gray-100 hover:text-konkan-green-primary transition-colors line-clamp-1"
            >
              {name}
            </Link>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-konkan-saffron tabular-nums leading-none">
                ₹{variantPrice}
              </span>
              {savings > 0 && (
                <span className="text-xs text-konkan-text-secondary line-through tabular-nums">
                  ₹{mrp}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart / Go to Cart */}
          {isInCart ? (
            <Link
              href="/cart"
              className="shrink-0 px-5 py-2.5 text-sm font-semibold rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Go to Cart
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isAdding || outOfStock}
              className="shrink-0 px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-konkan-green-primary to-konkan-green-secondary text-white hover:from-konkan-green-dark hover:to-konkan-green-primary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isAdding ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : outOfStock ? null : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              )}
              {outOfStock ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
