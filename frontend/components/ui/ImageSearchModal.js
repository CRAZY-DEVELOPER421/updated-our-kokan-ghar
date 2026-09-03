'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useImageSearch from '@/lib/hooks/useImageSearch';

/**
 * Image search modal — centered popup, shows visually similar products.
 */
export default function ImageSearchModal({ isOpen, onClose, imageFile }) {
  const { searchByImage, isSearching, results, error, clearResults } = useImageSearch();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzed, setAnalyzed] = useState(false);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      setAnalyzed(false);
      clearResults();
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  useEffect(() => {
    if (isOpen && imageFile && !analyzed) {
      const t = setTimeout(() => {
        searchByImage(imageFile).then(() => setAnalyzed(true));
      }, 500);
      return () => clearTimeout(t);
    }
  }, [isOpen, imageFile, analyzed, searchByImage]);

  useEffect(() => {
    if (!isOpen) { clearResults(); setAnalyzed(false); }
  }, [isOpen, clearResults]);

  const formatPrice = (p) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p);
  const productCount = results?.products?.length || 0;

  if (!isOpen || !imageFile) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-konkan-sand/50 shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-konkan-green-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
            </svg>
            <h3 className="font-display font-bold text-konkan-text-primary text-sm">Similar Products</h3>
            {productCount > 0 && (
              <span className="text-[10px] bg-konkan-green-primary/10 text-konkan-green-primary px-2 py-0.5 rounded-full font-medium">
                {productCount} found
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-konkan-sand/40 text-konkan-text-secondary transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image preview strip */}
        <div className="relative bg-konkan-cream/30 shrink-0 px-4 py-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob: URLs are not supported by next/image */}
            <img src={previewUrl} alt="Uploaded" className="w-14 h-14 rounded-lg object-cover border border-konkan-sand/30" />
            <div className="flex-1">
              {isSearching ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-konkan-green-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-konkan-text-secondary animate-pulse">Finding similar products...</span>
                </div>
              ) : results ? (
                <p className="text-xs text-konkan-text-secondary">
                  {productCount > 0 ? `${productCount} similar products found` : 'No similar products found'}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 py-3">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Searching */}
          {isSearching && (
            <div className="text-center py-6">
              <p className="text-sm text-konkan-text-secondary animate-pulse">Images compare ho rahi hain...</p>
            </div>
          )}

          {/* Product list */}
          {!isSearching && results && productCount > 0 && (
            <div className="space-y-2">
              {results.products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`} onClick={onClose}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-konkan-sand/50 hover:border-konkan-green-primary hover:shadow-sm transition-all group">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-konkan-cream shrink-0">
                    <Image src={product.primary_image} alt={product.name} fill sizes="48px" unoptimized
                      className="object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => { e.currentTarget.src = '/images/placeholder.png'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-konkan-text-primary truncate group-hover:text-konkan-green-primary transition-colors">{product.name}</p>
                    <p className="text-[10px] text-konkan-text-secondary/60 mt-0.5">{product.category_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-bold text-konkan-green-primary">{formatPrice(product.price)}</span>
                      {product.mrp > product.price && (
                        <span className="text-[10px] text-konkan-text-secondary/40 line-through">{formatPrice(product.mrp)}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      product.similarity >= 80 ? 'bg-green-100 text-green-700'
                      : product.similarity >= 60 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                    }`}>{product.similarity}%</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* No match */}
          {!isSearching && results && productCount === 0 && (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-konkan-sand/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-konkan-text-secondary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm text-konkan-text-secondary font-medium mb-1">Is image se match nahi mila</p>
              <p className="text-[11px] text-konkan-text-secondary/50 mb-3">Humare paas is tarah ka product abhi available nahi hai</p>
              <div className="bg-konkan-cream/50 rounded-lg px-3 py-2 inline-block">
                <p className="text-[10px] text-konkan-text-secondary/50">💡 Tip: Clear side photo ya different angle try karein</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-konkan-sand/30 text-center shrink-0">
          <p className="text-[10px] text-konkan-text-secondary/40">Bahar click karein band karne ke liye</p>
        </div>
      </div>
    </div>
  );
}
