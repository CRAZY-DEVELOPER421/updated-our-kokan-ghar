'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import ZoomImage from '@/components/ui/ZoomImage';

export default function ProductImages({ images = [], name = 'Product' }) {
  const [selected, setSelected] = useState(0);

  const displayImages = images.length > 0
    ? images
    : [{ image_url: null, alt_text: name }];

  const current = displayImages[selected];

  return (
    <div className="space-y-3 w-full max-w-[500px] mx-auto md:mx-0">
      {/* Main Image with Zoom */}
      <ZoomImage
        src={current?.image_url ? getImageUrl(current.image_url) : null}
        alt={current?.alt_text || name}
        sizes="(max-width: 768px) 100vw, 50vw"
        priority
        roundedClass="rounded-2xl"
        zoomScale={2.2}
        containerClassName="bg-gray-50"
      >
        {/* Navigation arrows */}
        {displayImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(s => (s - 1 + displayImages.length) % displayImages.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors z-10"
              aria-label="Previous image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(s => (s + 1) % displayImages.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors z-10"
              aria-label="Next image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </ZoomImage>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(idx)}
              className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                idx === selected
                  ? 'border-konkan-green-primary ring-2 ring-konkan-green-primary/30'
                  : 'border-transparent hover:border-konkan-sand'
              }`}
            >
              {img.image_url ? (
                <Image src={getImageUrl(img.image_url)} alt={img.alt_text || `${name} ${idx + 1}`} fill sizes="64px" className="object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-konkan-cream flex items-center justify-center">
                    <svg className="w-6 h-6 text-konkan-text-secondary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Image count */}
      {displayImages.length > 1 && (
        <p className="text-center text-xs text-konkan-text-secondary">
          {selected + 1} / {displayImages.length}
        </p>
      )}
    </div>
  );
}
