'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import useWishlistStore from '@/lib/store/wishlistStore';
import useCartStore from '@/lib/store/cartStore';
import { getImageUrl } from '@/lib/utils';

export default function MobileProductCard({ product }) {
  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);

  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product?.id));
  const addToCart = useCartStore((s) => s.addToCart);

  // ── Price calculations ──
  const price = parseFloat(product?.price) || 0;
  const mrp = parseFloat(product?.mrp) || 0;
  const discountPercent = parseFloat(product?.discount_percent) || 0;
  const discount = discountPercent > 0
    ? discountPercent
    : (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);
  const hasDiscount = discount > 0 && mrp > price && price > 0;
  const rating = parseFloat(product?.average_rating || 0);
  const reviewCount = product?.review_count || 0;

  // ── Handlers ──
  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isAdding) return;
    setIsAdding(true);
    try {
      const result = await addToCart(product.id, null, 1);
      if (!result || result.success === false) {
        toast.error(result?.message || 'Failed to add to cart');
      }
    } catch (err) {
      toast.error('Failed to add to cart');
    }
    setIsAdding(false);
  };

  return (
    <div className="group w-[155px] shrink-0">
      <Link
        href={`/products/${product.slug}`}
        className="block bg-white overflow-hidden"
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {/* ── Image Section — square (1:1) ── */}
        <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: '#E8F0EC' }}>
          {product.primary_image && !imageError ? (
            <Image
              src={getImageUrl(product.primary_image)}
              alt={product.name}
              fill
              sizes="155px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
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

          {/* Discount badge — compact, top-left */}
          {hasDiscount && (
            <span
              className="absolute top-1.5 left-1.5 z-10 text-[9px] font-bold text-white leading-none"
              style={{
                backgroundColor: '#E53935',
                padding: '2px 6px',
                borderRadius: '4px',
              }}
            >
              {discount}% OFF
            </span>
          )}

          {/* Wishlist heart — compact, top-right */}
          <button
            onClick={handleWishlist}
            className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform duration-200"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              className="w-3 h-3"
              fill={isInWishlist ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
              style={{ color: isInWishlist ? '#E53935' : '#1A1A1A' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* ── Content Section — 8px padding ── */}
        <div className="p-2">
          {/* Product Name — 13px, weight 600, max 2 lines */}
          <h3
            className="font-semibold leading-snug line-clamp-2"
            style={{
              fontSize: '13px',
              color: '#1A1A1A',
              minHeight: '2.5rem',
            }}
          >
            {product.name}
          </h3>

          {/* Rating — 11px, gold star + muted count */}
          <div className="flex items-center gap-1 mt-1" style={{ minHeight: '16px' }}>
            <svg className="w-2.5 h-2.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" style={{ color: '#FFB800' }}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium" style={{ fontSize: '11px', color: '#1A1A1A' }}>
              {rating > 0 ? rating.toFixed(1) : '—'}
            </span>
            <span style={{ fontSize: '11px', color: '#8A8A8A' }}>
              ({reviewCount})
            </span>
          </div>

          {/* Price — 14px bold, 11px strikethrough */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="font-bold" style={{ fontSize: '14px', color: '#1A1A1A' }}>
              ₹{price}
            </span>
            {mrp > price && mrp > 0 && (
              <span className="line-through" style={{ fontSize: '11px', color: '#8A8A8A' }}>
                ₹{mrp}
              </span>
            )}
          </div>

          {/* Add to Cart Button — compact, 32px height */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="w-full mt-1.5 text-white font-semibold flex items-center justify-center gap-1 transition-colors active:scale-[0.98] disabled:opacity-50"
            style={{
              height: '32px',
              backgroundColor: '#1B3B2F',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          >
            {isAdding ? (
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </Link>
    </div>
  );
}
