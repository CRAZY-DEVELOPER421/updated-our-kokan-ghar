'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';

// Safe store accessors (no hooks — won't crash)
function getAuthStore() {
  try { return require('@/lib/store/authStore').default; } catch { return null; }
}
function getCartStore() {
  try { return require('@/lib/store/cartStore').default; } catch { return null; }
}
function getWishlistStore() {
  try { return require('@/lib/store/wishlistStore').default; } catch { return null; }
}

export default function QuickView({ product, isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const router = useRouter();

  if (!product) return null;

  const discount = product.discount_percent || (product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);

  // Check wishlist status when modal opens
  useEffect(() => {
    if (isOpen && product?.id) {
      try {
        const wStore = getWishlistStore();
        if (wStore) setIsWishlisted(wStore.getState().isInWishlist(product.id));
      } catch (e) {
        // store not initialised yet — wishlist state stays false
      }
    }
  }, [isOpen, product?.id]);

  const handleAddToCart = async () => {
    try {
      const authStore = getAuthStore();
      if (!authStore?.getState().isAuthenticated) {
        toast.error('Please login to add items to cart');
        setTimeout(() => router.push('/login'), 1000);
        return;
      }
      setAdding(true);
      const cartStore = getCartStore();
      if (!cartStore) { toast.error('Something went wrong'); setAdding(false); return; }
      const result = await cartStore.getState().addToCart(product.id, null, quantity);
      if (!result || result.success === false) {
        toast.error(result?.message || 'Failed to add to cart');
        setAdding(false);
        return;
      }
      setAdding(false);
      toast.success(
        <div className="flex items-center gap-3">
          <span>{quantity} item{quantity > 1 ? 's' : ''} added to cart</span>
          <Link href="/cart" className="text-white/80 hover:text-white underline font-medium" onClick={() => toast.dismiss()}>
            View Cart
          </Link>
        </div>,
        { duration: 4000 }
      );
      onClose();
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      setAdding(false);
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const authStore = getAuthStore();
      if (!authStore?.getState().isAuthenticated) {
        toast.error('Please login to add to wishlist');
        setTimeout(() => router.push('/login'), 1000);
        return;
      }
      setWishlistLoading(true);
      const wStore = getWishlistStore();
      if (!wStore) { toast.error('Something went wrong'); setWishlistLoading(false); return; }
      const result = await wStore.getState().toggleWishlist(product.id);
      if (result?.success) {
        setIsWishlisted(result.inWishlist);
        toast.success(result.inWishlist ? 'Added to wishlist ❤️' : 'Removed from wishlist');
      } else {
        toast.error(result?.message || 'Failed to update wishlist');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    }
    setWishlistLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Image */}
        <div className="relative w-full md:w-1/2 aspect-square rounded-xl overflow-hidden bg-konkan-cream shrink-0">
          {product.images?.[0]?.image_url || product.primary_image ? (
            <Image src={getImageUrl(product.images?.[0]?.image_url || product.primary_image)} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-3 left-3 text-xs font-bold bg-gradient-to-r from-[#E87722] to-[#d95f0e] text-white px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(232,119,34,0.35)]">
              -{discount}% OFF
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4 w-full md:w-1/2">
          <div>
            <h2 className="font-display text-xl font-bold text-konkan-text-primary pr-2">{product.name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={parseFloat(product.average_rating) || 0} size="sm" />
              <span className="text-sm text-konkan-text-secondary">({product.review_count || 0} reviews)</span>
            </div>
          </div>

          <p className="text-sm text-konkan-text-secondary leading-relaxed line-clamp-3">
            {product.short_description || product.description || ''}
          </p>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl font-bold text-konkan-saffron">₹{product.price}</span>
            {product.mrp > product.price && (
              <span className="text-base text-konkan-text-secondary line-through">₹{product.mrp}</span>
            )}
            {product.mrp > product.price && (
              <span className="text-xs font-semibold text-konkan-success bg-konkan-green-primary/10 px-2 py-0.5 rounded-full">
                Save ₹{product.mrp - product.price}
              </span>
            )}
          </div>

          {product.stock_quantity > 0 ? (
            <span className="flex items-center gap-1.5 text-sm text-konkan-success">
              <span className="w-2 h-2 rounded-full bg-konkan-success" />
              In Stock ({product.stock_quantity} available)
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-konkan-error">
              <span className="w-2 h-2 rounded-full bg-konkan-error" />
              Out of Stock
            </span>
          )}

          {product.weight_grams && (
            <div className="flex items-center gap-2 text-sm text-konkan-text-secondary bg-konkan-cream px-3 py-2 rounded-lg">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span><strong>{product.weight_grams}g</strong> | {product.unit}</span>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-konkan-text-primary shrink-0">Qty:</span>
            <div className="flex items-center border border-konkan-sand rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1.5 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors rounded-l-lg"
              >
                −
              </button>
              <span className="px-4 py-1.5 text-sm font-medium border-x border-konkan-sand min-w-[40px] text-center tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                className="px-3 py-1.5 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors rounded-r-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="accent"
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={adding || product.stock_quantity <= 0}
              loading={adding}
            >
              {product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>

            {/* Wishlist Button */}
            <button
              onClick={handleToggleWishlist}
              disabled={wishlistLoading}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-xl transition-all duration-200 w-full border ${
                isWishlisted
                  ? 'text-red-500 border-red-200 bg-red-50 hover:bg-red-100'
                  : 'text-konkan-text-secondary border-konkan-sand hover:text-red-500 hover:border-red-200 hover:bg-red-50'
              }`}
            >
              {wishlistLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              {wishlistLoading ? 'Please wait...' : isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-konkan-sand/50" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-konkan-text-secondary">or</span>
              </div>
            </div>

            <Link
              href={`/products/${product.slug}`}
              onClick={onClose}
              className="group flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-konkan-green-primary bg-konkan-green-primary/5 hover:bg-konkan-green-primary/10 rounded-xl transition-all duration-200 active:scale-[0.98]"
            >
              <span>View Full Details</span>
              <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
