'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';

/**
 * ZoomImage — A reusable image component with an e-commerce hover-zoom effect.
 *
 * On desktop, moving the cursor over the image zooms in (scale 2.2) at the exact
 * point under the cursor, mimicking the Amazon/Flipkart/Myntra magnifier experience.
 * On touch devices the effect is automatically disabled.
 *
 * Props:
 *   src          — image URL (required)
 *   alt          — alt text (required)
 *   fill         — use Next.js `fill` mode (default true)
 *   sizes        — sizes attribute for fill mode
 *   width        — pixel width (used when fill=false)
 *   height       — pixel height (used when fill=false)
 *   priority     — Next.js Image priority flag
 *   className    — classes forwarded to the <Image> element
 *   containerClassName — classes for the outer wrapper div
 *   zoomScale    — zoom multiplier (default 2.2)
 *   aspectClass  — Tailwind aspect-ratio class for the container (default 'aspect-square')
 *   roundedClass — border-radius class (default 'rounded-xl')
 *   bordered     — show a subtle border around the container (default true)
 *   objectFit    — CSS object-fit value: 'contain' (default, shows full product) or 'cover' (fills container)
 *   children     — optional overlay elements rendered inside the container
 */
export default function ZoomImage({
  src,
  alt = '',
  fill = true,
  sizes,
  width,
  height,
  priority = false,
  className = '',
  containerClassName = '',
  zoomScale = 2.2,
  aspectClass = 'aspect-square',
  roundedClass = 'rounded-xl',
  bordered = true,
  objectFit = 'contain',
  onClick,
  children,
}) {
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);

  // Detect touch device once — SSR‑safe
  const [isTouchDevice] = useState(() => {
    if (typeof window === 'undefined') return true;
    return (
      window.matchMedia('(pointer: coarse)').matches ||
      'ontouchstart' in window
    );
  });

  const containerRef = useRef(null);

  const handleMouseMove = useCallback(
    (e) => {
      if (isTouchDevice || !containerRef.current) return;
      const { left, top, width: w, height: h } =
        containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - left) / w) * 100;
      const y = ((e.clientY - top) / h) * 100;
      setZoomPos({
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      });
    },
    [isTouchDevice],
  );

  const handleMouseEnter = useCallback(() => {
    if (!isTouchDevice) setIsHovering(true);
  }, [isTouchDevice]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    setZoomPos({ x: 50, y: 50 });
  }, []);

  return (
    <div
      ref={containerRef}
      className={[
        'relative overflow-hidden cursor-zoom-in select-none',
        aspectClass,
        roundedClass,
        bordered && 'border border-konkan-sand/20',
        containerClassName,
      ]
        .filter(Boolean)
        .join(' ')}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          {...(fill
            ? {
                fill: true,
                sizes: sizes || '(max-width: 768px) 100vw, 50vw',
              }
            : { width, height })}
          className={['object-contain', className].filter(Boolean).join(' ')}
          style={{
            objectFit,
            transform:
              isHovering && !isTouchDevice
                ? `scale(${zoomScale})`
                : 'scale(1)',
            transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
            transition: 'transform 0.15s ease-out',
          }}
          priority={priority}
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-konkan-cream">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-konkan-text-secondary/40 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-konkan-text-secondary text-sm mt-1">{alt}</p>
          </div>
        </div>
      )}

      {/* Overlay children (e.g. navigation arrows, badges) */}
      {children}
    </div>
  );
}
