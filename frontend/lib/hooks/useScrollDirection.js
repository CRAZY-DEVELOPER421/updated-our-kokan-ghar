'use client';

import { useState, useEffect } from 'react';

/**
 * useScrollDirection — Tracks scroll position and direction.
 *
 * Returns:
 *   isScrolled    — true when scrollY > threshold (for shadows/sticky styles)
 *   isAtTop       — true when scrollY === 0
 *   scrollDir     — 'up' | 'down' | null
 */
export default function useScrollDirection({ threshold = 5 } = {}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const [scrollDir, setScrollDir] = useState(null);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentY = window.scrollY;

          // Direction
          if (currentY > lastScrollY && currentY > threshold) {
            setScrollDir('down');
          } else if (currentY < lastScrollY) {
            setScrollDir('up');
          }

          // Position states
          setIsScrolled(currentY > threshold);
          setIsAtTop(currentY === 0);

          lastScrollY = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use passive listener for performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return { isScrolled, isAtTop, scrollDir };
}
