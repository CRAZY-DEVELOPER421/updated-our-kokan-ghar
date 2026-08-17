'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';

/* ─── Safe store accessors (no hooks — won't crash) ─── */
function getAuthStore() {
  try { return require('@/lib/store/authStore').default; } catch { return null; }
}
function getCartStore() {
  try { return require('@/lib/store/cartStore').default; } catch { return null; }
}
function getWishlistStore() {
  try { return require('@/lib/store/wishlistStore').default; } catch { return null; }
}

export default function ProductQuickViewModal({ product, isOpen, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const router = useRouter();

  if (!product) return null;

  const images = product.images?.length > 0
    ? product.images.map(i => i.image_url)
    : product.primary_image
      ? [product.primary_image]
      : [];

  const discount = product.discount_percent || (product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);
  const rating = parseFloat(product.average_rating) || 0;
  const reviewCount = product.review_count || 0;
  const totalSold = product.total_sold || 0;

  /* ── Check wishlist on open ── */
  useEffect(() => {
    if (isOpen && product?.id) {
      setQuantity(1);
      setSelectedImage(0);
      try {
        const wStore = getWishlistStore();
        if (wStore) setIsWishlisted(wStore.getState().isInWishlist(product.id));
      } catch (e) {}
    }
  }, [isOpen, product?.id]);

  /* ── Handlers ── */
  const handleAddToCart = async () => {
    try {
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
      if (!wStore) { setWishlistLoading(false); return; }
      const result = await wStore.getState().toggleWishlist(product.id);
      if (result?.success) {
        setIsWishlisted(result.inWishlist);
        toast.success(result.inWishlist ? 'Saved to wishlist' : 'Removed from wishlist');
      }
    } catch (err) {}
    setWishlistLoading(false);
  };

  if (!isOpen) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      {/* ── Backdrop ── */}
      <DialogPrimitive.Backdrop className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm data-open:animate-fade-in data-closed:animate-[fadeIn_200ms_ease-out_reverse] data-closed:[animation-fill-mode:forwards]" />

      {/* ── Portal ── */}
      <DialogPrimitive.Portal>
        {/* ── Modal Content ── */}
        <DialogPrimitive.Popup
          className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-0 sm:p-4 outline-none"
        >
          <div
            className="relative w-full sm:max-w-[95%] md:max-w-[900px] lg:max-w-[1000px] bg-white sm:rounded-2xl rounded-t-2xl shadow-modal max-h-[100dvh] sm:max-h-[90vh] flex flex-col overflow-hidden data-open:animate-slide-up data-closed:animate-[slideUp_200ms_ease-out_reverse] data-closed:[animation-fill-mode:forwards] sm:data-open:animate-[slideUp_250ms_ease-out] sm:data-closed:animate-[slideUp_200ms_ease-out_reverse]"
          >
            {/* ── Close Button (fixed) ── */}
            <DialogPrimitive.Close className="absolute top-3 right-3 z-20 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.15)] hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200 text-konkan-text-secondary hover:text-konkan-text-primary outline-none focus-visible:ring-2 focus-visible:ring-konkan-green-primary">
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </DialogPrimitive.Close>

            {/* ── Scrollable Body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="flex flex-col md:flex-row">
                {/* ════════ LEFT: Image ════════ */}
                <div className="w-full md:w-1/2 md:sticky md:top-0 md:self-start p-4 md:p-6">
                  {/* Main Image */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-konkan-cream mb-3 group">
                    {images[selectedImage] ? (
                      <Image
                        src={images[selectedImage]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-16 h-16 text-konkan-text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 text-xs font-bold bg-gradient-to-r from-[#E87722] to-[#d95f0e] text-white px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(232,119,34,0.35)] z-10">
                        -{discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {images.map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`relative w-14 h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                            idx === selectedImage
                              ? 'border-konkan-green-primary ring-2 ring-konkan-green-primary/30'
                              : 'border-transparent hover:border-konkan-sand'
                          }`}
                        >
                          <Image src={url} alt={`${product.name} ${idx + 1}`} fill sizes="56px" className="object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ════════ RIGHT: Info ════════ */}
                <div className="w-full md:w-1/2 p-4 md:p-6 md:pl-0 flex flex-col gap-4">
                  {/* Product Name */}
                  <div>
                    <h2 className="font-display text-xl md:text-2xl font-bold text-konkan-text-primary leading-tight">
                      {product.name}
                    </h2>
                    {/* Rating + Reviews + Sold */}
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
                      <div className="flex items-center gap-1">
                        <StarRating rating={rating} size="sm" />
                        <span className="text-sm font-semibold text-konkan-text-primary ml-1">
                          {rating > 0 ? rating.toFixed(1) : '0.0'}
                        </span>
                      </div>
                      <span className="text-sm text-konkan-text-secondary">({reviewCount} reviews)</span>
                      {totalSold > 0 && (
                        <span className="text-sm text-konkan-text-secondary">{totalSold} sold</span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-bold text-konkan-saffron">₹{product.price}</span>
                    {product.mrp > product.price && (
                      <span className="text-lg text-konkan-text-secondary line-through">₹{product.mrp}</span>
                    )}
                    {product.mrp > product.price && (
                      <span className="text-xs font-semibold text-konkan-success bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        Save ₹{product.mrp - product.price}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {product.stock_quantity > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-konkan-success shadow-[0_0_6px_rgba(22,163,74,0.4)]" />
                      <span className="text-sm font-medium text-konkan-success">
                        In Stock
                      </span>
                      {product.stock_quantity < 20 && (
                        <span className="text-xs text-konkan-error font-medium">
                          Only {product.stock_quantity} left!
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-konkan-error" />
                      <span className="text-sm font-medium text-konkan-error">Out of Stock</span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm text-konkan-text-secondary leading-relaxed">
                    {product.short_description || product.description || ''}
                  </p>

                  {/* Weight / Unit */}
                  {product.weight_grams && (
                    <div className="flex items-center gap-2 text-sm bg-konkan-cream px-3.5 py-2.5 rounded-xl">
                      <svg className="w-4 h-4 shrink-0 text-konkan-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      <span><strong>{product.weight_grams}g</strong> | {product.unit || 'Unit'}</span>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-konkan-text-primary">Qty:</span>
                    <div className="flex items-center border border-konkan-sand rounded-xl bg-white">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3.5 py-2 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors rounded-l-xl text-lg"
                      >
                        −
                      </button>
                      <span className="px-5 py-2 text-sm font-semibold border-x border-konkan-sand min-w-[48px] text-center tabular-nums">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                        className="px-3.5 py-2 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors rounded-r-xl text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2.5 pt-1">
                    {/* Add to Cart */}
                    <Button
                      variant="accent"
                      size="lg"
                      className="w-full !text-base !font-semibold !py-3.5"
                      onClick={handleAddToCart}
                      disabled={adding || product.stock_quantity <= 0}
                      loading={adding}
                    >
                      {product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>

                    {/* Wishlist */}
                    <button
                      onClick={handleToggleWishlist}
                      disabled={wishlistLoading}
                      className={`flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 w-full border ${
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
                        <svg className={`w-[18px] h-[18px] ${isWishlisted ? 'fill-red-500' : ''}`} fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )}
                      {wishlistLoading ? 'Please wait...' : isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}
                    </button>

                    {/* Divider */}
                    <div className="relative my-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-konkan-sand/50" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-xs text-konkan-text-secondary">or</span>
                      </div>
                    </div>

                    {/* View Full Details */}
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
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
