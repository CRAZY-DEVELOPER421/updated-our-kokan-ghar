'use client';

import useScrollDirection from './useScrollDirection';

/**
 * useBottomNavVisibility — Flipkart/Instagram style mobile bottom nav.
 *
 * Rule (single source of truth shared by MobileBottomNav and anything that
 * sits above it, e.g. the PDP MobileBuyBar which offsets by 60px):
 *  - visible at the top of the page (nothing to reclaim yet)
 *  - hides while scrolling DOWN (content gets the full screen — 60px ≈ 7%)
 *  - reappears on scroll UP or when back at the top
 *
 * No "idle reveal": once hidden it stays hidden until the user scrolls up —
 * that is the point of the pattern (deliberately tucking navigation away
 * while browsing, Flipkart-style).
 */
export default function useBottomNavVisibility() {
  const { isScrolled, isAtTop, scrollDir } = useScrollDirection();

  const navVisible = !isScrolled || isAtTop || scrollDir === 'up';

  return { navVisible };
}
