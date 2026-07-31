'use client';

import { useState } from 'react';
import Link from 'next/link';
import StarRating from '@/components/ui/StarRating';
import Button from '@/components/ui/Button';
import useCartStore from '@/lib/store/cartStore';
import toast from 'react-hot-toast';

export default function ProductDetail({ product }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [adding, setAdding] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const price = selectedVariant ? product.price + (selectedVariant.price_modifier || 0) : product.price;
  const savings = product.mrp - price;
  const discountPercent = product.discount_percent || (product.mrp > price ? Math.round(((product.mrp - price) / product.mrp) * 100) : 0);

  const handleAddToCart = async () => {
    setAdding(true);
    const res = await addItem({ product_id: product.id, quantity, variant_id: selectedVariant?.id });
    if (res.success) toast.success('Added to cart');
    else toast.error(res.message || 'Failed to add');
    setAdding(false);
  };

  const handleBuyNow = async () => {
    setAdding(true);
    const res = await addItem({ product_id: product.id, quantity, variant_id: selectedVariant?.id });
    setAdding(false);
    if (res.success) window.location.href = '/checkout';
    else toast.error(res.message || 'Failed to add');
  };

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl font-bold text-konkan-text-primary">{product.name}</h1>
      <div className="flex items-center gap-2 mt-2">
        <StarRating rating={parseFloat(product.average_rating) || 0} size="sm" />
        <span className="text-sm text-konkan-text-secondary">({product.review_count || 0} reviews)</span>
      </div>

      <div className="flex items-baseline gap-2 mt-4">
        <span className="text-2xl font-bold text-konkan-saffron">₹{price}</span>
        {product.mrp > price && <span className="text-sm text-konkan-text-secondary line-through">₹{product.mrp}</span>}
        {savings > 0 && <span className="text-xs font-semibold text-konkan-text-primary">Save ₹{savings}</span>}
      </div>

      {/* Variants */}
      {product.variants?.length > 0 && (
        <div className="mt-5"><p className="text-sm font-medium text-konkan-text-primary mb-2">Size / Variant</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button key={v.id} onClick={() => setSelectedVariant(v)}
                className={`px-4 py-2 text-sm rounded-lg border font-medium transition-all ${selectedVariant?.id === v.id ? 'border-konkan-green-primary bg-konkan-green-primary/5 text-konkan-green-primary' : 'border-konkan-sand text-konkan-text-secondary hover:border-konkan-green-primary'}`}
              >{v.variant_value} {v.price_modifier > 0 && <span className="text-konkan-saffron">+₹{v.price_modifier}</span>}</button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + Buttons */}
      <div className="flex items-center gap-3 mt-5">
        <div className="flex items-center border border-konkan-sand rounded-lg">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-2 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors">−</button>
          <span className="px-4 py-2 text-sm font-medium border-x border-konkan-sand min-w-[40px] text-center">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-2 text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-colors">+</button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-5">
        <Button size="lg" className="flex-1" onClick={handleAddToCart} loading={adding}>Add to Cart</Button>
        <Button size="lg" variant="accent" className="flex-1" onClick={handleBuyNow} loading={adding}>Buy Now</Button>
      </div>
    </div>
  );
}
