'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Truck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/utils';
import StarRating from '@/components/ui/StarRating';
import FlashSaleProgressBar from '@/components/ui/FlashSaleProgressBar';
import useWishlistStore from '@/lib/store/wishlistStore';
import useCartStore from '@/lib/store/cartStore';

// ── Shared Product Card (one design for every product row on the homepage) ──
// Used by: Flash Sale, Bestsellers, Deals Under ₹999, New Arrivals, Discover
// For You. Accepts either a raw API product (price/mrp/average_rating/
// primary_image) or a flash-sale merged object (sale_price/original_price/
// rating/image) — the same design either way.
//
// The card is width-agnostic (w-full h-full) — the parent decides the width:
//   - horizontal scroll rows: wrap in <div className="w-[220px] md:w-[260px] shrink-0">
//   - mobile rows:            wrap in <div className="w-[165px] shrink-0">
//   - grids:                  render directly (w-full fills the cell)
//
// simplified — lightweight browse-only variant: only image, title, description,
// rating and price. Hides discount badge, wishlist heart, bought/delivery meta
// and the Add-to-Cart + Share actions row (used by the All Under ₹499 section).
export default function ProductCarouselCard({ product, simplified = false }) {
  const router = useRouter();
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const addToCart = useCartStore((s) => s.addToCart);
  const cartItems = useCartStore((s) => s.items);
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Normalize both raw-product and flash-sale shapes
  const id = product?.id ?? product?.product_id;
  const slug = product?.slug ?? product?.product_slug;
  const name = product?.name || '';
  const image = product?.primary_image || product?.image || '';
  const price = Number(product?.price ?? product?.sale_price) || 0;
  const mrp = Number(product?.mrp ?? product?.original_price) || 0;
  const rating = parseFloat(product?.average_rating ?? product?.rating) || 0;
  const reviewCount = Number(product?.review_count) || 0;
  const shortDescription = product?.short_description || '';
  const totalSold = Number(product?.total_sold) || 0;
  // Flash-sale scarcity data (quantity_limit + sold_count from flash_sales)
  const flashSold = Number(product?.sold_count) || 0;
  const flashLimit = Number(product?.quantity_limit) || 0;
  const freeDelivery = product?.free_delivery ?? 1;
  const deliveryLabel = product?.delivery_estimate === 'today' ? 'Today'
    : product?.delivery_estimate === 'tomorrow' ? 'Tomorrow'
    : product?.delivery_estimate || '3-5 days';

  const discount = mrp > price && price > 0 ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const isInCart = cartItems.some((i) => parseInt(i.product_id) === parseInt(id));
  const isInWishlist = useWishlistStore((s) => (id ? s.isInWishlist(id) : false));

  // Share — Web Share API → clipboard fallback (same logic as ProductCard)
  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/products/${slug}`;
    const imageUrl = getImageUrl(image);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const shareData = { title: name, text: `Check out ${name} from Konkan Ghar!`, url };
        if (imageUrl && navigator.canShare) {
          try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const ext = blob.type.split('/')[1] || 'jpg';
            const imageFile = new File([blob], `product-${id}.${ext}`, { type: blob.type });
            const withImage = { ...shareData, files: [imageFile] };
            if (navigator.canShare(withImage)) { await navigator.share(withImage); return; }
          } catch {
            // image sharing failed — fall through to text-only share
          }
        }
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') toast.error('Could not share');
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

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    setIsAdding(true);
    const result = await addToCart(id, null, 1);
    if (!result || result.success === false) {
      toast.error(result?.message || 'Failed to add to cart');
    }
    setIsAdding(false);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
  };

  return (
    <div className="group relative flex flex-col w-full h-full bg-white rounded-xl border border-gray-200/70 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-gray-900/10 hover:scale-[1.02] hover:border-gray-300 transition-all duration-150 ease-out">
      <Link href={`/products/${slug}`} className="block">
        {/* Image — square 1:1, FULL-BLEED edge-to-edge (no frame around it) */}
        <div className="relative aspect-square w-full overflow-hidden bg-[#f5f0eb]">
          {image && !imageError ? (
            <Image
              src={getImageUrl(image)}
              alt={name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Discount badge — top-left, REAL % (hidden in simplified mode) */}
          {!simplified && discount > 0 && (
            <span
              className="absolute top-2 left-2 z-10 rounded-full px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
              style={{ backgroundColor: '#E87722' }}
            >
              -{discount}%
            </span>
          )}

          {/* Wishlist heart — top-right, outlined (hidden in simplified mode) */}
          {!simplified && (
            <button
              onClick={handleWishlist}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/95 border border-gray-200 shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-150"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <svg
                className={`w-4 h-4 ${isInWishlist ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
                fill={isInWishlist ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>

        {/* Content — its own padding so the image above stays full-bleed */}
        <div className={`px-3 pt-2.5 ${simplified ? 'pb-3' : ''}`}>
          {/* Name — 14px / 500 / max 2 lines (min-h only reserves 1 line so the
              title and description sit close together — no big visual gap) */}
          <h3 className="text-sm font-medium text-gray-900 leading-snug line-clamp-2 min-h-5 mb-0.5">
            {name}
          </h3>

          {/* Short description — real data, muted, up to 2 lines */}
          {shortDescription && (
            <p className="text-xs text-gray-500 leading-snug line-clamp-2 mb-1.5">
              {shortDescription}
            </p>
          )}

          {/* Rating — real stars (half-star aware) + real review count */}
          <div className="flex items-center mb-1.5 min-h-[18px]">
            <StarRating rating={rating} count={reviewCount || 0} size="xs" />
          </div>

          {/* Price — bold + original struck-through */}
          {price > 0 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base font-bold text-gray-900 tabular-nums">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {mrp > price && (
                <span className="text-[13px] text-gray-400 line-through tabular-nums">
                  ₹{mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          )}

          {/* Flash sale progress bar — "X% sold — Only Y left" (real data) */}
          {flashLimit > 0 && (
            <div className="mb-2">
              <FlashSaleProgressBar soldCount={flashSold} quantityLimit={flashLimit} />
            </div>
          )}

          {/* Meta — REAL bought count + delivery line (hidden in simplified mode) */}
          {!simplified && (
            <div className="flex flex-col gap-0.5 mb-2">
              {totalSold > 0 && (
                <span className="text-xs text-gray-500">
                  {totalSold > 50 ? `${totalSold}+ bought` : `${totalSold} bought`}
                </span>
              )}
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Truck className={`w-3.5 h-3.5 shrink-0 ${freeDelivery ? 'text-[#16A34A]' : 'text-gray-400'}`} />
                {freeDelivery ? 'Free delivery' : 'Delivery'} • Get it by{' '}
                <span className="font-semibold text-[#16A34A]">{deliveryLabel}</span>
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Actions row — Add to Cart (3 parts) + Share (1 part) = 3:1 (hidden in simplified mode) */}
      {!simplified && (
      <div className="mt-auto flex items-center gap-1.5 px-3 pb-3">
        <button
          onClick={isInCart ? () => router.push('/cart') : handleAddToCart}
          disabled={!isInCart && isAdding}
          className={`flex-[3] py-2 rounded-lg text-[11px] min-[640px]:text-sm font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-50 ${
            isInCart ? 'bg-[#16A34A] hover:bg-[#15803D]' : 'bg-[#1B3B2F] hover:bg-[#2D6A4F]'
          }`}
        >
          {isInCart ? 'Go to Cart' : isAdding ? 'Adding…' : 'Add to Cart'}
        </button>

        {/* Share — small icon button, 1 part of the 3:1 row */}
        <button
          onClick={handleShare}
          className="flex-1 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-[#1B3B2F] hover:border-[#1B3B2F]/30 hover:bg-[#1B3B2F]/5 active:scale-95 transition-all duration-150"
          aria-label="Share product"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
      </div>
      )}
    </div>
  );
}

// ── Skeleton (same proportions as the card) ──────────────────────────────
export function ProductCarouselCardSkeleton({ simplified = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/70 overflow-hidden">
      <div className="aspect-square w-full bg-gray-100 skeleton" />
      <div className="p-3">
        <div className="skeleton h-4 w-3/4 mb-2" />
        <div className="skeleton h-3 w-1/2 mb-2" />
        <div className="skeleton h-4 w-1/3 mb-2.5" />
        {!simplified && (
          <div className="flex gap-1.5">
            <div className="skeleton h-8 flex-[3] rounded-lg" />
            <div className="skeleton h-8 flex-1 rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}
