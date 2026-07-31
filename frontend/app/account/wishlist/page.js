'use client';

import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get('/wishlist');
      return res.data.data?.items || res.data.data?.wishlist || [];
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId) => {
      await api.delete(`/wishlist/${productId}`);
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      const previous = queryClient.getQueryData(['wishlist']);
      // Optimistically remove from cache
      queryClient.setQueryData(['wishlist'], (old) =>
        (old || []).filter(item => {
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
      <p className="text-sm text-konkan-text-secondary mb-1">{wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} in wishlist</p>
      {wishlist.map((item) => {
        const product = item.product || item;
        const productImage = product.images?.[0]?.image_url || product.image || product.primary_image || null;
        const productPrice = product.discounted_price || product.price;
        const productMrp = product.mrp;

        return (
          <div
            key={product.id || item.id}
            className="bg-white rounded-xl card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all group"
          >
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
    </div>
  );
}
