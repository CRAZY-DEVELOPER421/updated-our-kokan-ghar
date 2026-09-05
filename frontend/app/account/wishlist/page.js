'use client';

import Image from 'next/image';
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState(new Set());

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get('/wishlist');
      return res.data.data?.items || res.data.data?.wishlist || [];
    },
  });

  // ─── Selection helpers ───
  const allSelected = wishlist.length > 0 && selectedIds.size === wishlist.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  const selectedCount = selectedIds.size;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(wishlist.map((item) => {
        const product = item.product || item;
        return product.id || item.id;
      })));
    }
  }, [allSelected, wishlist]);

  const toggleItem = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // ─── Mutations ───
  const removeMutation = useMutation({
    mutationFn: async (productId) => {
      await api.delete(`/wishlist/${productId}`);
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      const previous = queryClient.getQueryData(['wishlist']);
      queryClient.setQueryData(['wishlist'], (old) =>
        (old || []).filter((item) => {
          const itemId = item.product_id || item.product?.id || item.id;
          return itemId !== productId;
        })
      );
      return { previous };
    },
    onError: (err, productId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['wishlist'], context.previous);
      }
      toast.error(err.response?.data?.message || 'Failed to remove');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success('Removed from wishlist');
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async (product) => {
      const cartStore = (await import('@/lib/store/cartStore')).default;
      const state = cartStore.getState();
      const res = await state.addToCart(product.id, product.variant_id || null, 1);
      if (!res || res.success === false) {
        throw new Error(res?.message || 'Failed to add to cart');
      }
      return res;
    },
    onSuccess: () => toast.success('Added to cart'),
    onError: (err) => toast.error(err.message || 'Failed to add to cart'),
  });

  // ─── Bulk: Add selected to cart ───
  const bulkAddToCart = useCallback(async () => {
    const selected = wishlist.filter((item) => {
      const product = item.product || item;
      return selectedIds.has(product.id || item.id);
    });
    if (selected.length === 0) return;

    let added = 0;
    let failed = 0;
    const cartStore = (await import('@/lib/store/cartStore')).default;
    const state = cartStore.getState();

    for (const item of selected) {
      const product = item.product || item;
      try {
        const res = await state.addToCart(product.id, product.variant_id || null, 1);
        if (res && res.success !== false) added++;
        else failed++;
      } catch {
        failed++;
      }
    }

    if (added > 0) toast.success(`${added} item${added > 1 ? 's' : ''} added to cart`);
    if (failed > 0) toast.error(`${failed} item${failed > 1 ? 's' : ''} failed to add`);
    clearSelection();
  }, [wishlist, selectedIds, clearSelection]);

  // ─── Bulk: Remove selected ───
  const bulkRemove = useCallback(async () => {
    const ids = wishlist
      .filter((item) => {
        const product = item.product || item;
        return selectedIds.has(product.id || item.id);
      })
      .map((item) => {
        const product = item.product || item;
        return product.id || item.id;
      });

    if (ids.length === 0) return;

    // Optimistic update
    await queryClient.cancelQueries({ queryKey: ['wishlist'] });
    const previous = queryClient.getQueryData(['wishlist']);
    queryClient.setQueryData(['wishlist'], (old) =>
      (old || []).filter((item) => {
        const product = item.product || item;
        return !ids.includes(product.id || item.id);
      })
    );

    let removed = 0;
    for (const id of ids) {
      try {
        await api.delete(`/wishlist/${id}`);
        removed++;
      } catch {
        // rollback on error
      }
    }

    if (removed > 0) {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(`${removed} item${removed > 1 ? 's' : ''} removed`);
    } else {
      queryClient.setQueryData(['wishlist'], previous);
      toast.error('Failed to remove items');
    }

    clearSelection();
  }, [wishlist, selectedIds, queryClient, clearSelection]);

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl card p-4 flex gap-4">
            <Skeleton variant="image" className="!w-20 !h-20 !rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="title" className="w-3/4" />
              <Skeleton variant="text" className="w-1/3" />
              <Skeleton variant="button" className="w-28" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── Empty state ───
  if (wishlist.length === 0) {
    return (
      <div className="bg-white rounded-2xl card p-10 text-center">
        <div className="mb-4 flex justify-center">
          <svg className="w-10 h-10 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <h2 className="font-display text-lg font-bold text-konkan-text-primary mb-1">Your wishlist is empty</h2>
        <p className="text-sm text-konkan-text-secondary mb-4">Save your favourite Konkan products here.</p>
        <Link href="/products"><Button>Browse Products</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ─── Header with Select All ─── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Select All checkbox — hidden on mobile */}
          <label className="hidden md:flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => { if (el) el.indeterminate = someSelected; }}
              onChange={toggleSelectAll}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${allSelected ? 'border-konkan-green-primary bg-konkan-green-primary' : someSelected ? 'border-konkan-green-primary bg-konkan-green-primary/20' : 'border-konkan-sand'}`}>
              {(allSelected || someSelected) && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-konkan-text-secondary group-hover:text-konkan-text-primary transition-colors">
              Select all
            </span>
          </label>

          <p className="text-sm text-konkan-text-secondary">
            {selectedCount > 0 ? (
              <span className="font-medium text-konkan-green-primary">{selectedCount} selected</span>
            ) : (
              <>{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} in wishlist</>
            )}
          </p>
        </div>

        {/* Clear selection button */}
        {selectedCount > 0 && (
          <button
            onClick={clearSelection}
            className="text-xs text-konkan-text-secondary hover:text-red-500 transition-colors md:block hidden"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* ─── Selection Toolbar — desktop only ─── */}
      {selectedCount > 0 && (
        <div className="hidden md:flex items-center gap-3 bg-konkan-green-primary/5 border border-konkan-green-primary/20 rounded-xl p-3 animate-in slide-in-from-top-2 fade-in duration-200">
          <Button
            size="sm"
            onClick={bulkAddToCart}
            disabled={addToCartMutation.isPending}
            loading={addToCartMutation.isPending}
            className="whitespace-nowrap"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            Add {selectedCount} to Cart
          </Button>
          <button
            onClick={bulkRemove}
            disabled={removeMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove ({selectedCount})
          </button>
        </div>
      )}

      {/* ─── Wishlist Items ─── */}
      {wishlist.map((item) => {
        const product = item.product || item;
        const productId = product.id || item.id;
        const productImage = product.images?.[0]?.image_url || product.image || product.primary_image || null;
        const productPrice = product.discounted_price || product.price;
        const productMrp = product.mrp;
        const isSelected = selectedIds.has(productId);

        return (
          <div
            key={productId}
            className={`bg-white rounded-xl card p-4 flex items-center gap-3 md:gap-4 transition-all group ${
              isSelected ? 'ring-2 ring-konkan-green-primary/30 bg-konkan-green-primary/5' : 'hover:shadow-card-hover'
            }`}
          >
            {/* ─── Mobile checkbox (tap zone) ─── */}
            <button
              onClick={() => toggleItem(productId)}
              className={`md:hidden w-6 h-6 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                isSelected
                  ? 'border-konkan-green-primary bg-konkan-green-primary'
                  : 'border-konkan-sand'
              }`}
              aria-label={isSelected ? 'Deselect' : 'Select'}
            >
              {isSelected && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            {/* ─── Desktop checkbox ─── */}
            <label className="hidden md:flex shrink-0 cursor-pointer" onClick={(e) => e.preventDefault()}>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleItem(productId)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${isSelected ? 'border-konkan-green-primary bg-konkan-green-primary' : 'border-konkan-sand'}`}>
                {isSelected && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </label>

            <Link href={`/products/${product.slug}`} className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden bg-konkan-cream">
              {productImage ? (
                <Image src={productImage} alt={product.name} fill sizes="96px" className="object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <Link href={`/products/${product.slug}`} className="font-display font-bold text-konkan-text-primary hover:text-konkan-green-primary transition-colors line-clamp-1 text-sm md:text-base">
                {product.name}
              </Link>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-bold text-konkan-saffron text-sm">₹{productPrice}</span>
                {productMrp > productPrice && (
                  <span className="text-xs text-konkan-text-secondary line-through">₹{productMrp}</span>
                )}
              </div>
              {product.stock_quantity !== undefined && (
                <p className={`text-xs mt-1 ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock_quantity > 0 ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => addToCartMutation.mutate(product)}
                disabled={addToCartMutation.isPending}
                loading={addToCartMutation.isPending}
                className="whitespace-nowrap min-w-[120px]"
              >
                {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
              </Button>
              <button
                onClick={() => removeMutation.mutate(product.id)}
                disabled={removeMutation.isPending}
                className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors text-center py-1"
              >
                {removeMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        );
      })}

      {/* ─── Mobile Selection Toolbar (bottom sticky) ─── */}
      {selectedCount > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-konkan-sand shadow-lg p-3 flex items-center gap-2 animate-in slide-in-from-bottom fade-in duration-200">
          <button
            onClick={clearSelection}
            className="text-xs text-konkan-text-secondary hover:text-red-500 transition-colors px-2 py-1"
          >
            Clear
          </button>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={bulkAddToCart}
            disabled={addToCartMutation.isPending}
            loading={addToCartMutation.isPending}
            className="whitespace-nowrap text-xs"
          >
            Add {selectedCount} to Cart
          </Button>
          <button
            onClick={bulkRemove}
            disabled={removeMutation.isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
