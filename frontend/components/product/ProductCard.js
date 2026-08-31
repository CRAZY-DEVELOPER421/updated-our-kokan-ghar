'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import useWishlistStore from '@/lib/store/wishlistStore';
import useAuthStore from '@/lib/store/authStore';
import useCartStore from '@/lib/store/cartStore';
import useCompareStore from '@/lib/store/compareStore';
import { getImageUrl } from '@/lib/utils';
import { PRODUCT_BLUR } from '@/lib/blur';
import FlashSaleProgressBar from '@/components/ui/FlashSaleProgressBar';
import ProductQuickViewModal from '@/components/product/ProductQuickViewModal';
import { usePlpReferrer } from '@/lib/providers/PlpReferrerProvider';

const WEIGHT_OPTIONS = [
  { label: '3kg', value: 3 },
  { label: '6kg', value: 6 },
  { label: '12kg', value: 12 },
];

export default function ProductCard({ product, view = 'grid' }) {
  const plpRef = usePlpReferrer();
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [stepperQty, setStepperQty] = useState(0);
  const [showGoToCart, setShowGoToCart] = useState(false);
  const inactivityTimerRef = useRef(null);

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/products/${product.slug}`;
    const imageUrl = getImageUrl(product.primary_image || product.images?.[0]?.image_url);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const shareData = {
          title: product.name,
          text: product.short_description || `Check out ${product.name} from Konkan Ghar!`,
          url,
        };
        // Try to include product image (supported on mobile browsers)
        if (imageUrl && navigator.canShare) {
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const ext = blob.type.split('/')[1] || 'jpg';
            const imageFile = new File([blob], `product-${product.id}.${ext}`, { type: blob.type });
            const withImage = { ...shareData, files: [imageFile] };
            if (navigator.canShare(withImage)) {
              await navigator.share(withImage);
              return;
            }
          } catch {
            // image sharing failed — fall through to text-only share
          }
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
  };

  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product?.id));
  const addToCart = useCartStore((s) => s.addToCart);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const cartItems = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const compareToggle = useCompareStore((s) => s.toggleProduct);
  const isComparing = useCompareStore((s) => s.selectedIds.includes(product?.id));
  const isInCart = cartItems.some(item => parseInt(item.product_id) === parseInt(product?.id));
  const cartItem = cartItems.find(item => parseInt(item.product_id) === parseInt(product?.id));
  const cartItemId = cartItem?.id;

  // Auto-select default weight on mount
  useEffect(() => {
    if (!selectedWeight) {
      setSelectedWeight(WEIGHT_OPTIONS[0].value);
    }
  }, []);

  // Fetch fresh data on mount. Cart is fetched for GUESTS too (device-id
  // guest cart) so the navbar badge + in-cart state stay correct; wishlist
  // is account-only.
  useEffect(() => {
    fetchCart();
    if (isAuthenticated) {
      fetchWishlist();
    }
  }, [isAuthenticated]);

  // Sync stepper quantity with cart item
  useEffect(() => {
    if (isInCart && cartItem) {
      setStepperQty(cartItem.quantity);
    } else {
      setStepperQty(0);
      setShowGoToCart(false);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }
  }, [isInCart, cartItem?.id, cartItem?.quantity]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      setShowGoToCart(true);
    }, 10000);
  }, []);

  const handleStepperIncrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItemId) return;
    const newQty = stepperQty + 1;
    setStepperQty(newQty);
    await updateQuantity(cartItemId, newQty);
    resetInactivityTimer();
  };

  const handleStepperDecrement = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!cartItemId) return;
    if (stepperQty <= 1) {
      await removeItem(cartItemId);
      setStepperQty(0);
      setShowGoToCart(false);
    } else {
      const newQty = stepperQty - 1;
      setStepperQty(newQty);
      await updateQuantity(cartItemId, newQty);
      resetInactivityTimer();
    }
  };

  const handleGoToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/cart');
  };

  // ── Safe number conversion ──────────────────────────────
  // If the product has an ACTIVE flash sale, its sale price wins over the
  // regular price — cards in the all-products grid show the flash price,
  // the strikethrough original, and the scarcity bar.
  const flashSale = product?.flash_sale;
  const hasFlash = !!flashSale && Number(flashSale?.sale_price) > 0;
  const price = hasFlash ? parseFloat(flashSale.sale_price) : (parseFloat(product?.price) || 0);
  const mrp = hasFlash && flashSale?.original_price
    ? parseFloat(flashSale.original_price)
    : (parseFloat(product?.mrp) || 0);
  const discountPercent = parseFloat(product?.discount_percent) || 0;

  const discount = discountPercent > 0
    ? discountPercent
    : (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

  // ── Stock urgency ──
  const stockQty = parseInt(product?.stock_quantity, 10) || 0;
  const isOutOfStock = stockQty === 0;
  const isLowStock = stockQty > 0 && stockQty <= 5;

  const savings = mrp - price;
  const hasDiscount = discount > 0 && mrp > price && price > 0;
  const rating = parseFloat(product?.average_rating || 0);
  const reviewCount = product?.review_count || 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    if (!selectedWeight) {
      toast.error('Please select a weight/quantity first');
      return;
    }
    setIsAdding(true);
    try {
      const quantity = selectedWeight;
      const result = await addToCart(product.id, null, quantity);
      if (!result || result.success === false) {
        // Suspended → the global gate popup already explains it; no error toast.
        // Read live store state — the suspension is detected during the request.
        if (!useAuthStore.getState().suspended) toast.error(result?.message || 'Failed to add to cart');
        return;
      }
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      toast.error('Failed to add to cart');
    }
    setIsAdding(false);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const result = compareToggle(product.id);
    if (result?.error) toast.error(result.error);
  };

  const handleWeightSelect = (e, weight) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedWeight(weight === selectedWeight ? null : weight);
  };

  // ─── Horizontal Mobile List View (horizontal card: image left, content right) ──
  if (view === 'list') {
    const handleListAddToCart = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isAdding) return;
      setIsAdding(true);
      try {
        const result = await addToCart(product.id, null, 1);
        if (!result || result.success === false) {
          // Suspended → the global gate popup already explains it; no error toast.
          // Read live store state — the suspension is detected during the request.
          if (!useAuthStore.getState().suspended) toast.error(result?.message || 'Failed to add to cart');
          setIsAdding(false);
          return;
        }
        setAdded(true);
        setTimeout(() => setAdded(false), 2500);
      } catch (err) {
        toast.error('Failed to add to cart');
      }
      setIsAdding(false);
    };

    return (
      <Link
        href={`/products/${product.slug}`}
        className="block bg-white dark:bg-[#1a1a2e]"
        onClick={() => plpRef?.save?.()}
      >
        {/* Fixed card height (120px) + overflow-hidden: every card stays this exact height regardless of title/content length; ~104px usable area = 95px image + 8px breathing room each side + slack for the ~95px text block */}
        <div className="flex gap-2.5 px-3 py-2 h-[120px] overflow-hidden">
          {/* ── Left: Product Image (95px square, rounded 8px) ── */}
          <div className="relative w-[95px] h-[95px] shrink-0 rounded-lg overflow-hidden bg-[#f5f0eb]">
            {product.primary_image && !imageError ? (
              <Image
                src={getImageUrl(product.primary_image)}
                alt={product.name}
                fill
                sizes="95px"
                className="object-cover"
                loading="lazy"
                placeholder="blur"
                blurDataURL={PRODUCT_BLUR}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}
                  style={{ color: '#8A8A8A', opacity: 0.4 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Flash Sale badge — top-left, red, most prominent */}
            {hasFlash && (
              <span
                className="absolute top-1 left-1 z-10 text-[9px] font-bold text-white px-1.5 py-[3px] rounded-[4px] leading-none shadow-sm flex items-center gap-0.5"
                style={{ backgroundColor: '#E53935' }}
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Flash
              </span>
            )}

            {/* Discount badge — top-left corner, orange bg, white bold */}
            {hasDiscount && !hasFlash && (
              <span
                className="absolute top-1 left-1 z-10 text-[10px] font-bold text-white px-1.5 py-[3px] rounded-[4px] leading-none shadow-sm"
                style={{ backgroundColor: '#E87722' }}
              >
                -{discount}%
              </span>
            )}

            {/* Low stock badge */}
            {isLowStock && (
              <span
                className="absolute bottom-1 left-1 z-10 text-[8px] font-bold text-white px-1.5 py-[2px] rounded-[3px] leading-none shadow-sm flex items-center gap-0.5"
                style={{ backgroundColor: '#DC2626' }}
              >
                Only {stockQty} left
              </span>
            )}

            {/* Out of stock overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[2] rounded-lg">
                <span className="bg-black/70 text-white text-[9px] font-bold px-2 py-1 rounded-full">
                  Out of Stock
                </span>
              </div>
            )}

            {/* Wishlist heart — top-right corner, white circle outline */}
            <button
              onClick={handleWishlist}
              className="absolute top-1 right-1 z-10 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-sm"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg
                className={`w-3 h-3 ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
                fill={isInWishlist ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* ── Right: Content Block (reduced sizes for mobile) ── */}
          <div className="flex-1 min-w-0 flex flex-col" style={{ gap: '2px' }}>
            {/* Product title — bold, 13px, capped to 1 line with ellipsis so the text block never grows taller than the fixed 95px image */}
            <h3
              className="font-bold leading-tight line-clamp-1"
              style={{ fontSize: '13px', color: '#1A1A1A' }}
            >
              {product.name}
            </h3>

            {/* Rating row — small stars + review count in blue */}
            <div className="flex items-center gap-0.5">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-2.5 h-2.5"
                    fill={star <= Math.round(rating) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: star <= Math.round(rating) ? '#FFB800' : '#CCCCCC' }}
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="font-semibold" style={{ fontSize: '10px', color: '#1A1A1A' }}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
              <span style={{ fontSize: '10px', color: '#2563EB' }}>
                ({reviewCount})
              </span>
            </div>

            {/* Social proof subtext — smallest size */}
            {product.total_sold > 0 && (
              <span style={{ fontSize: '10px', color: '#666666', lineHeight: 1.2 }}>
                {product.total_sold > 50 ? `${product.total_sold}+ bought` : `${product.total_sold} sold`}
              </span>
            )}

            {/* Price block: current price (most prominent), strikethrough, savings */}
            <div className="flex items-center gap-1 flex-wrap" style={{ marginTop: '1px' }}>
              <span className="font-bold" style={{ fontSize: '15px', color: '#1A1A1A', lineHeight: 1.2 }}>
                ₹{price}
              </span>
              {mrp > price && mrp > 0 && (
                <span className="line-through" style={{ fontSize: '10px', color: '#999999' }}>
                  ₹{mrp}
                </span>
              )}
              {hasDiscount && savings > 0 && (
                <span className="font-semibold" style={{ fontSize: '10px', color: '#16A34A' }}>
                  Save ₹{savings}
                </span>
              )}
            </div>

            {/* Flash sale scarcity bar — compact on the list view */}
            {hasFlash && (
              <div style={{ maxWidth: '180px', marginTop: '4px' }}>
                <FlashSaleProgressBar
                  soldCount={flashSale.sold_count}
                  quantityLimit={flashSale.quantity_limit}
                  compact
                />
              </div>
            )}

            {/* Delivery line + Add to Cart button — same row, bottom-anchored */}
            <div className="flex items-end justify-between" style={{ marginTop: '1px' }}>
              {/* Delivery line — smallest text */}
              <span style={{ fontSize: '10px', color: '#666666', lineHeight: 1.2 }}>
                Free delivery • Get it by{' '}
                <span className="font-semibold" style={{ color: '#16A34A' }}>Tomorrow</span>
              </span>

              {/* Add to Cart / Stepper — compact, right-aligned */}
              <div className="shrink-0 ml-1">
                {isInCart || added ? (
                  <div
                    className="flex items-center rounded-lg overflow-hidden border"
                    style={{ borderColor: '#22C55E', height: '28px' }}
                  >
                    <button
                      onClick={handleStepperDecrement}
                      className="w-7 h-full flex items-center justify-center font-bold transition-colors"
                      style={{ color: '#16A34A', backgroundColor: '#F0FDF4', fontSize: '13px' }}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span
                      className="min-w-[20px] text-center font-bold tabular-nums h-full flex items-center justify-center"
                      style={{ color: '#166534', backgroundColor: '#FFFFFF', borderLeft: '1px solid #BBF7D0', borderRight: '1px solid #BBF7D0', fontSize: '10px' }}
                    >
                      {stepperQty || 1}
                    </span>
                    <button
                      onClick={handleStepperIncrement}
                      className="w-7 h-full flex items-center justify-center font-bold transition-colors"
                      style={{ color: '#16A34A', backgroundColor: '#F0FDF4', fontSize: '13px' }}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleListAddToCart}
                    disabled={isAdding || isOutOfStock}
                    className="text-white font-semibold rounded-lg transition-colors active:scale-[0.97] disabled:opacity-50"
                    style={{
                      backgroundColor: isOutOfStock ? '#9CA3AF' : '#1B3B2F',
                      padding: '5px 12px',
                      fontSize: '11px',
                      borderRadius: '6px',
                    }}
                  >
                    {isAdding ? (
                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      isOutOfStock ? 'Out of Stock' : 'Add to Cart'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Divider line between cards */}
        <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '0' }} />
      </Link>
    );
  }

  // ─── Premium Grid View ──────────────────────────────────
  return (
    <div className="group relative h-full max-[768px]:h-auto">
      <Link
        href={`/products/${product.slug}`}
        className="block h-full max-[768px]:h-auto"
        onClick={() => plpRef?.save?.()}
      >
        <div className={`relative bg-white dark:bg-[#1a1a2e] rounded-[20px] overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ease-out flex flex-col h-full max-[768px]:h-auto border ${
          isOutOfStock ? 'opacity-60 grayscale hover:scale-100 hover:shadow-card border-gray-200' : 'hover:scale-[1.02] hover:border-konkan-green-primary/20 hover:ring-1 hover:ring-konkan-green-primary/10 border-transparent'
        } ${isInCart && !isOutOfStock ? 'max-[768px]:border-green-500/30 max-[768px]:ring-2 max-[768px]:ring-green-500/30' : ''}`}>
          {/* Image Section - fixed height */}
          <div className="relative max-[768px]:h-[135px] h-40 sm:h-48 md:h-56 shrink-0 overflow-hidden bg-[#f5f0eb] dark:bg-[#12121f]">
            {product.primary_image && !imageError ? (
              <div className="relative w-full h-full">
                {!imageLoaded && (
                  <div className="absolute inset-0 skeleton" />
                )}
                <Image
                  src={getImageUrl(product.primary_image)}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className={`object-cover transition-all duration-500 group-hover:scale-110 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  loading="lazy"
                  placeholder="blur"
                  blurDataURL={PRODUCT_BLUR}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-12 h-12 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Badge Stack - Left */}
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
              {hasFlash && (
                <span className="text-[9px] sm:text-[11px] font-bold bg-gradient-to-r from-[#E53935] to-[#c62828] text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-[0_2px_8px_rgba(229,57,53,0.4)] flex items-center gap-1 whitespace-nowrap">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Flash Sale
                </span>
              )}
              {hasDiscount && (
                <span className="text-[10px] sm:text-xs font-bold bg-gradient-to-r from-[#E87722] to-[#d95f0e] text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-[0_2px_8px_rgba(232,119,34,0.35)]">
                  -{discount}%
                </span>
              )}
              {product.is_bestseller && (
                <span className="text-[9px] sm:text-[10px] font-semibold bg-gradient-to-r from-[#F4A261] to-[#e8954f] text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-[0_2px_6px_rgba(244,162,97,0.3)] flex items-center gap-1">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Bestseller
                </span>
              )}
              {product.is_seasonal && (
                <span className="text-[9px] sm:text-[10px] font-semibold bg-gradient-to-r from-[#7c3aed] to-[#6d28d9] text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-[0_2px_6px_rgba(124,58,237,0.3)]">
                  Seasonal
                </span>
              )}
              {isLowStock && (
                <span className="text-[9px] sm:text-[10px] font-bold bg-gradient-to-r from-[#DC2626] to-[#b91c1c] text-white px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-[0_2px_6px_rgba(220,38,38,0.4)] flex items-center gap-1 whitespace-nowrap animate-pulse">
                  <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Only {stockQty} left
                </span>
              )}
            </div>

            {/* Wishlist Button — floating on image top-right (mobile + desktop) */}
            <button
              onClick={handleWishlist}
              className="max-[768px]:flex lg:flex absolute max-[768px]:top-2.5 max-[768px]:right-2.5 top-2 right-2 sm:top-3 sm:right-3 z-20 max-[768px]:w-6 max-[768px]:h-6 w-7 h-7 sm:w-9 sm:h-9 bg-white/90 backdrop-blur-sm rounded-full items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg
                className={`max-[768px]:w-3 max-[768px]:h-3 w-[18px] h-[18px] transition-all duration-200 ${
                  isInWishlist ? 'text-red-500 fill-red-500' : 'text-[#666]'
                }`}
                fill={isInWishlist ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* Mobile floating Add to cart — '+' button / quantity stepper / Go to Cart based on state */}
            {!isInCart || showGoToCart ? (
              /* '+' button (not in cart) OR 'Go to Cart' (after 10s inactivity) */
              <button
                onClick={showGoToCart ? handleGoToCart : handleAddToCart}
                disabled={!showGoToCart && isAdding}
                className="flex sm:hidden absolute bottom-1.5 right-1.5 z-20 w-7 h-7 rounded-full bg-gradient-to-r from-konkan-green-primary to-konkan-green-secondary text-white items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all duration-150"
                aria-label={showGoToCart ? 'Go to cart' : 'Add to cart'}
              >
                {showGoToCart ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : isAdding ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                )}
              </button>
            ) : (
              /* Quantity stepper pill when item is in cart */
              <div className="flex sm:hidden absolute bottom-1.5 right-1.5 z-20 h-7 rounded-full bg-konkan-green-primary shadow-lg items-center overflow-hidden">
                <button
                  onClick={handleStepperDecrement}
                  className="w-6 h-full flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 transition-colors"
                  aria-label="Decrease quantity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                  </svg>
                </button>
                <span className="min-w-[22px] text-center text-[11px] font-bold text-white tabular-nums">
                  {stepperQty}
                </span>
                <button
                  onClick={handleStepperIncrement}
                  className="w-6 h-full flex items-center justify-center text-white hover:bg-white/20 active:bg-white/30 transition-colors"
                  aria-label="Increase quantity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            )}

            {/* Compare Button — bottom-left of image, clearly separate from wishlist */}
            <button
              onClick={handleCompare}
              className={`absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all duration-200 shadow-md ${
                isComparing
                  ? 'bg-konkan-green-primary text-white'
                  : 'bg-white/95 backdrop-blur-sm text-gray-600 hover:bg-konkan-green-primary hover:text-white'
              }`}
              aria-label={isComparing ? 'Remove from compare' : 'Add to compare'}
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill={isComparing ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="hidden sm:inline">Compare</span>
            </button>

            {/* Bottom Overlay Gradient — enhances on hover */}
            <div className="absolute inset-x-0 bottom-0 h-20 sm:h-28 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none z-[1] opacity-60 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Out of Stock overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[3]">
                <span className="bg-black/70 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full backdrop-blur-sm">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Content Section - flex column that pushes buttons to bottom */}
          <div className="max-[768px]:px-2 max-[768px]:pt-1.5 max-[768px]:pb-1.5 max-[768px]:flex-none sm:px-4 sm:pt-3 sm:pb-4 bg-white dark:bg-[#1a1a2e] flex flex-col flex-1">
            {/* Location Badge — always same height, empty if missing */}
            <div className="min-h-[20px] sm:min-h-[24px] max-[768px]:mb-0.5 mb-1 sm:mb-2">
              {product.region_origin && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-konkan-text-secondary bg-konkan-cream px-1.5 sm:px-2 py-0.5 rounded-full truncate max-w-full max-[768px]:text-[9px] max-[768px]:px-1 max-[768px]:py-[1px]">
                  <svg className="w-3 h-3 max-[768px]:w-2 max-[768px]:h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {product.region_origin}
                </span>
              )}
            </div>

            {/* Product Title - fixed 2-line height */}
            <h3 className="text-konkan-text-primary dark:text-gray-100 font-bold max-[768px]:text-[12px] max-[768px]:leading-[1.2] text-[13px] sm:text-sm md:text-base leading-snug line-clamp-2 max-[768px]:mb-0.5 mb-1 sm:mb-2 min-h-[2rem] sm:min-h-[2.5rem] group-hover:text-konkan-green-primary transition-colors duration-200">
              {product.name}
            </h3>

            {/* Rating Section — same height even if no reviews */}
            <div className="flex items-center gap-1 sm:gap-1.5 max-[768px]:mb-0.5 mb-1.5 sm:mb-2.5 min-h-[18px] sm:min-h-[22px]">
              <div className="flex items-center gap-0.5">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#F4A261] max-[768px]:w-2.5 max-[768px]:h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-konkan-text-primary max-[768px]:text-[9px] text-[11px] sm:text-xs font-semibold">{rating > 0 ? rating.toFixed(1) : '0.0'}</span>
              </div>
              <span className="text-konkan-text-secondary text-[10px] sm:text-[11px] max-[768px]:text-[8px]">({reviewCount})</span>
              {product.total_sold > 0 && (
                <span className="text-konkan-text-secondary text-[10px] sm:text-[11px] hidden sm:inline">| {product.total_sold} sold</span>
              )}
            </div>

            {/* Price Section */}
            <div className="flex items-center flex-wrap gap-x-1.5 sm:gap-x-2 gap-y-1 max-[768px]:mb-1 mb-2 sm:mb-3 min-h-[1.25rem] sm:min-h-[1.75rem]">
              {price > 0 ? (
                <span className="text-[#F4A261] max-[768px]:text-sm text-base sm:text-lg font-bold">₹{price}</span>
              ) : (
                <span className="text-[#F4A261] max-[768px]:text-sm text-base sm:text-lg font-bold">—</span>
              )}
              {mrp > price && mrp > 0 && (
                <span className="text-konkan-text-secondary max-[768px]:text-[9px] text-[10px] sm:text-xs line-through">₹{mrp}</span>
              )}
              {hasDiscount && savings > 0 && (
                <span className="inline-flex items-center text-[9px] sm:text-[10px] font-semibold text-konkan-text-primary max-[768px]:text-[8px]">
                  Save ₹{savings}
                </span>
              )}
            </div>

            {/* Flash sale scarcity bar — "X% sold — Only Y left" (real data) */}
            {hasFlash && (
              <div className="max-w-[180px] max-[768px]:max-w-[160px] max-[768px]:mb-1 mb-2 sm:mb-2.5">
                <FlashSaleProgressBar
                  soldCount={flashSale.sold_count}
                  quantityLimit={flashSale.quantity_limit}
                />
              </div>
            )}

            {/* Weight Selector — hidden on mobile, visible on desktop */}
            <div className="flex items-center gap-1.5 mb-3 min-h-[36px] max-[768px]:hidden">
              <div className="hidden sm:flex items-center gap-1.5 w-full">
                {WEIGHT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={(e) => handleWeightSelect(e, opt.value)}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-all duration-200 ${
                      selectedWeight === opt.value
                        ? 'bg-konkan-green-primary text-white shadow-[0_2px_8px_rgba(45,106,79,0.25)]'
                        : 'bg-transparent text-konkan-text-secondary border border-[#ddd] hover:border-konkan-green-primary hover:text-konkan-green-primary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacer pushes buttons to bottom — hidden on mobile (no action row visible) */}
            <div className="flex-1 min-h-[4px] max-[768px]:hidden" />

            {/* Action Buttons - always at bottom — hidden on mobile (replaced by floating + and wishlist on image) */}
            <div className="flex items-center gap-1.5 sm:gap-2 mt-auto shrink-0 max-[768px]:hidden">
              {/* Desktop Add to Cart / Go to Cart — hidden on mobile (replaced by floating + button) */}
              <div className="max-[768px]:hidden flex-1 flex">
                {isInCart || added ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push('/cart');
                    }}
                    className="flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:border-green-300 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">Go to Cart</span>
                  </button>
                ) : (                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding || isOutOfStock}
                    className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-200 ${
                      isOutOfStock
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : added
                          ? 'bg-green-600 text-white'
                          : 'bg-gradient-to-r from-konkan-green-primary to-konkan-green-secondary text-white hover:from-konkan-green-dark hover:to-konkan-green-primary active:scale-[0.98] shadow-[0_4px_12px_rgba(45,106,79,0.25)]'
                    }`}>
                    {isAdding ? (
                      <span className="flex items-center justify-center gap-1">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                        {isOutOfStock ? 'Out of Stock' : 'Add'}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Share — only in product details, hidden from card on mobile */}
              <button
                onClick={handleShare}
                className="max-[768px]:hidden shrink-0 w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-konkan-cream border border-[#e5e0db] text-gray-400 hover:text-konkan-green-primary hover:border-konkan-green-primary/30 hover:bg-green-50 transition-all duration-200"
                aria-label="Share product"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>

              {/* Quick View — desktop only */}
              <button
                onClick={handleQuickView}
                className="hidden lg:flex w-9 h-9 sm:w-11 sm:h-11 items-center justify-center rounded-xl bg-konkan-cream border border-[#e5e0db] text-konkan-text-secondary hover:text-konkan-green-primary hover:border-konkan-green-primary/30 hover:bg-green-50 transition-all duration-200 shrink-0"
                aria-label="Quick view"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Link>

      <ProductQuickViewModal product={product} isOpen={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
    </div>
  );
}
