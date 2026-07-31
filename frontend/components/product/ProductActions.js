'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useCartStore from '@/lib/store/cartStore';
import useAuthStore from '@/lib/store/authStore';
import useWishlistStore from '@/lib/store/wishlistStore';
import { getImageUrl } from '@/lib/utils';

export default function ProductActions({ product, stockQuantity = 0 }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const addToCart = useCartStore((s) => s.addToCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const [isAdding, setIsAdding] = useState(false);

  // Wishlist
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlist = useWishlistStore((s) =>
    s.items.some((item) => item.product_id === parseInt(product.id)),
  );
  const [wishlistToggling, setWishlistToggling] = useState(false);

  // Share
  const [sharing, setSharing] = useState(false);

  const productId = product.id;

  // Check if product is already in cart
  const cartItem = items.find(
    (item) => parseInt(item.product_id) === parseInt(productId),
  );
  const cartItemId = cartItem?.id;
  const isInCart = !!cartItem;

  // ── Quantity — sync with global cart state ───────────
  const [qty, setQty] = useState(() => cartItem?.quantity || 1);

  // Re-sync whenever cart item quantity changes externally (e.g. from cart page)
  useEffect(() => {
    if (cartItem?.quantity && cartItem.quantity !== qty) {
      setQty(cartItem.quantity);
    }
  }, [cartItem?.quantity]);

  const decreaseQty = () => {
    const nextQty = Math.max(1, qty - 1);
    setQty(nextQty);
    if (isInCart && cartItemId) {
      updateQuantity(cartItemId, nextQty);
    }
  };

  const increaseQty = () => {
    const nextQty = Math.min(stockQuantity || 99, qty + 1);
    setQty(nextQty);
    if (isInCart && cartItemId) {
      updateQuantity(cartItemId, nextQty);
    }
  };

  // ── Add to Cart ─────────────────────────────────────
  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      setTimeout(() => router.push('/login'), 1000);
      return;
    }
    setIsAdding(true);
    const res = await addToCart(productId, null, qty);
    setIsAdding(false);
    if (res.success) {
      toast.success(`${qty} × ${product.name} added to cart`);
    } else {
      toast.error(res.message || 'Failed to add to cart');
    }
  }, [isAuthenticated, productId, qty, addToCart, router, product.name]);

  // ── Buy Now ─────────────────────────────────────────
  const handleBuyNow = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to continue');
      setTimeout(() => router.push('/login'), 1000);
      return;
    }
    setIsAdding(true);
    const res = await addToCart(productId, null, qty);
    setIsAdding(false);
    if (res.success) {
      router.push('/checkout');
    } else {
      toast.error(res.message || 'Failed to add to cart');
    }
  }, [isAuthenticated, productId, qty, addToCart, router]);

  // ── Wishlist Toggle ─────────────────────────────────
  const handleWishlist = useCallback(async () => {
    if (wishlistToggling) return;
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      setTimeout(() => router.push('/login'), 1000);
      return;
    }
    setWishlistToggling(true);
    const res = await toggleWishlist(productId);
    setWishlistToggling(false);
    if (res.success) {
      toast.success(res.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
    } else {
      toast.error(res.message || 'Failed to update wishlist');
    }
  }, [isAuthenticated, productId, toggleWishlist, router]);

  // ── Share ────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);

    const url = `${window.location.origin}/products/${product.slug}`;
    const imageUrl = getImageUrl(product.primary_image || product.images?.[0]?.image_url);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const shareData = {
          title: product.name,
          text: product.short_description || `Check out ${product.name} from Konkan Ghar!`,
          url,
        };
        if (imageUrl && navigator.canShare) {
          try {
            const resp = await fetch(imageUrl);
            const blob = await resp.blob();
            const ext = blob.type.split('/')[1] || 'jpg';
            const imageFile = new File([blob], `product-${product.id}.${ext}`, { type: blob.type });
            const withImage = { ...shareData, files: [imageFile] };
            if (navigator.canShare(withImage)) {
              await navigator.share(withImage);
              setSharing(false);
              return;
            }
          } catch {}
        }
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          toast.error('Could not share');
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Product link copied to clipboard!');
      } catch {
        toast.error('Could not copy link');
      }
    }
    setSharing(false);
  }, [product, sharing]);

  // ── Shared button classes ────────────────────────────
  const secondaryBtnClass =
    'flex-1 py-3 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 border border-konkan-sand text-konkan-text-secondary hover:text-konkan-green-primary hover:border-konkan-green-primary/30 hover:bg-green-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2';

  return (
    <div className="space-y-3">
      {/* Quantity Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-konkan-text-primary">Quantity:</span>
        <div className="flex items-center border border-konkan-sand rounded-lg">
          <button
            onClick={decreaseQty}
            disabled={qty <= 1}
            className="px-3 py-1.5 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors disabled:opacity-30"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="px-4 py-1.5 text-sm font-medium border-x border-konkan-sand min-w-[40px] text-center tabular-nums">
            {qty}
          </span>
          <button
            onClick={increaseQty}
            disabled={qty >= stockQuantity}
            className="px-3 py-1.5 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors disabled:opacity-30"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {stockQuantity > 0 && stockQuantity <= 5 && (
          <span className="text-xs text-konkan-error font-medium">Only {stockQuantity} left!</span>
        )}
      </div>

      {/* Row 1: Add to Cart / Go to Cart · Wishlist · Share — in one line on mobile too */}
      <div className="flex flex-row gap-2 sm:gap-3">
        {/* Add to Cart / Go to Cart (primary, wider) */}
        <div className="flex-[2]">
          {isInCart ? (
            <Link
              href="/cart"
              className="w-full py-3 text-center text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Go to Cart
            </Link>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isAdding || stockQuantity === 0}
              className="w-full py-3 text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 bg-gradient-to-r from-konkan-green-primary to-konkan-green-secondary text-white hover:from-konkan-green-dark hover:to-konkan-green-primary active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              )}
              {stockQuantity === 0 ? 'Out of Stock' : isAdding ? 'Adding...' : 'Add to Cart'}
            </button>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          disabled={wishlistToggling}
          className={[secondaryBtnClass, isInWishlist ? 'text-red-500 border-red-200 hover:text-red-600 hover:border-red-300 hover:bg-red-50' : ''].filter(Boolean).join(' ')}
        >
          {wishlistToggling ? (
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 shrink-0"
              fill={isInWishlist ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          )}
          <span className="hidden sm:inline">Wishlist</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          disabled={sharing}
          className={secondaryBtnClass}
        >
          {sharing ? (
            <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          )}
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Row 2: Buy Now (full width) — only when product is NOT already in cart */}
      {!isInCart && (
        <button
          onClick={handleBuyNow}
          disabled={isAdding || stockQuantity === 0}
          className="w-full py-3 text-sm sm:text-base font-semibold rounded-xl transition-all duration-200 bg-gradient-to-r from-konkan-saffron to-orange-500 text-white hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Buy Now
        </button>
      )}
    </div>
  );
}
