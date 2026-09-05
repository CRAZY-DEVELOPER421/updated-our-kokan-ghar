'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

/**
 * ProductLightbox — Fullscreen image viewer with swipe + pinch-zoom.
 *
 * Opens as a fixed overlay. Supports:
 * - Next / prev arrows (desktop + mobile tap)
 * - Swipe left/right on mobile
 * - Pinch-zoom with pan when zoomed in
 * - Keyboard navigation (← → Escape)
 * - Image counter (1 / N)
 * - Body scroll lock while open
 */
export default function ProductLightbox({ images = [], initialIndex = 0, name = 'Product', onClose }) {
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });

  const touchStart = useRef(null);
  const pinchStart = useRef(null);
  const panStart = useRef(null);
  const isSwiping = useRef(false);
  const isPinching = useRef(false);
  const containerRef = useRef(null);

  const total = images.length;
  const current = images[index];
  const src = current?.image_url ? getImageUrl(current.image_url) : null;

  // ── Body scroll lock ──────────────────────────────────
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ── Reset zoom when image changes ─────────────────────
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [index]);

  // ── Keyboard navigation ───────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, index, total]);

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % total);
  }, [total]);

  // ── Touch: swipe (single finger) ─────────────────────
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Pinch start
      isPinching.current = true;
      isSwiping.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = {
        dist: Math.hypot(dx, dy),
        scale,
        cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        cy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      return;
    }
    if (e.touches.length === 1) {
      isSwiping.current = true;
      isPinching.current = false;
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      if (scale > 1) {
        panStart.current = { x: translate.x, y: translate.y };
      }
    }
  }, [scale, translate]);

  const onTouchMove = useCallback((e) => {
    // ── Pinch zoom ──
    if (isPinching.current && e.touches.length === 2 && pinchStart.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStart.current.dist;
      const newScale = Math.min(5, Math.max(1, pinchStart.current.scale * ratio));
      setScale(newScale);
      if (newScale <= 1) setTranslate({ x: 0, y: 0 });
      return;
    }

    // ── Pan when zoomed ──
    if (scale > 1 && e.touches.length === 1 && panStart.current) {
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;
      setTranslate({
        x: panStart.current.x + dx,
        y: panStart.current.y + dy,
      });
      return;
    }

    // ── Swipe detection ──
    if (!touchStart.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    const dy = e.touches[0].clientY - touchStart.current.y;
    // Only horizontal swipe — ignore vertical scrolls
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      e.preventDefault();
    }
  }, [scale]);

  const onTouchEnd = useCallback((e) => {
    // Pinch end
    if (isPinching.current) {
      isPinching.current = false;
      pinchStart.current = null;
      // Snap back if zoomed out
      if (scale <= 1.1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      }
      return;
    }

    // Pan end — clamp within bounds
    if (scale > 1 && panStart.current) {
      panStart.current = null;
      return;
    }

    // Swipe end
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const elapsed = Date.now() - touchStart.current.time;
    const velocity = Math.abs(dx) / elapsed;

    // Quick flick OR long drag (>50px)
    if ((velocity > 0.3 && Math.abs(dx) > 20) || Math.abs(dx) > 50) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
    isSwiping.current = false;
  }, [scale, goNext, goPrev]);

  // ── Double-tap to toggle zoom ────────────────────────
  const lastTap = useRef(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (scale > 1) {
        setScale(1);
        setTranslate({ x: 0, y: 0 });
      } else {
        setScale(2.5);
      }
    }
    lastTap.current = now;
  }, [scale]);

  // ── Prevent default on pinch to stop browser zoom ────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e) => { if (e.touches.length === 2) e.preventDefault(); };
    el.addEventListener('touchmove', prevent, { passive: false });
    return () => el.removeEventListener('touchmove', prevent);
  }, []);

  if (!src) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[210] w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        aria-label="Close lightbox"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image counter */}
      <div className="absolute top-4 left-4 z-[210] px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">
        {index + 1} / {total}
      </div>

      {/* Prev arrow */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-[210] w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          aria-label="Previous image"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {total > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-[210] w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
          aria-label="Next image"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Main image — tap for double-tap zoom, pinch for pinch-zoom */}
      <div
        className="relative w-full h-full flex items-center justify-center p-12 md:p-20"
        onClick={handleDoubleTap}
      >
        <div
          style={{
            transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
            transition: isPinching.current ? 'none' : 'transform 0.2s ease-out',
            transformOrigin: 'center center',
          }}
        >
          <Image
            src={src}
            alt={current?.alt_text || name}
            width={1200}
            height={1200}
            className="max-h-[80vh] w-auto object-contain pointer-events-none"
            draggable={false}
            priority
            unoptimized
          />
        </div>
      </div>

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-[210] flex justify-center gap-2 px-4 overflow-x-auto scrollbar-hide">
          {images.map((img, idx) => {
            const thumbSrc = img.image_url ? getImageUrl(img.image_url) : null;
            return (
              <button
                key={idx}
                onClick={() => setIndex(idx)}
                className={`relative w-12 h-12 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === index
                    ? 'border-white ring-1 ring-white/50 scale-110'
                    : 'border-white/30 opacity-60 hover:opacity-100'
                }`}
              >
                {thumbSrc && (
                  <Image
                    src={thumbSrc}
                    alt={img.alt_text || `${name} ${idx + 1}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                    loading="lazy"
                    unoptimized
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
