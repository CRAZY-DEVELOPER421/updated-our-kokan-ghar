'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/utils';

export default function ShareButton({ product, variant = 'default' }) {
  const [sharing, setSharing] = useState(false);

  const fetchImageAsFile = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      return new File([blob], `product-${product.id}.${ext}`, { type: blob.type });
    } catch {
      return null;
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (sharing) return;
    setSharing(true);

    const url = `${window.location.origin}/products/${product.slug}`;
    const imageUrl = getImageUrl(product.primary_image || product.images?.[0]?.image_url);

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const shareData = {
          title: product.name,
          text: product.short_description || `Check out ${product.name} from Konkan Ghar!`,
          url,
        };
        // Try to include image if available (supported on mobile browsers)
        if (imageUrl && navigator.canShare) {
          const imageFile = await fetchImageAsFile(imageUrl);
          if (imageFile) {
            const withImage = { ...shareData, files: [imageFile] };
            if (navigator.canShare(withImage)) {
              await navigator.share(withImage);
              setSharing(false);
              return;
            }
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
    setSharing(false);
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl bg-konkan-cream border border-[#e5e0db] text-konkan-text-secondary hover:text-konkan-green-primary hover:border-konkan-green-primary/30 hover:bg-green-50 transition-all duration-200 shrink-0"
        aria-label="Share product"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>
    );
  }

  return (
    <button
      onClick={handleShare}
      className="w-full py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 border border-konkan-sand text-konkan-text-secondary hover:text-konkan-green-primary hover:border-konkan-green-primary/30 hover:bg-green-50 flex items-center justify-center gap-2"
      aria-label="Share product"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Share
    </button>
  );
}
