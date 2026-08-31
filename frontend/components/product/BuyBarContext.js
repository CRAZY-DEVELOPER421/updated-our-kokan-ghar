'use client';

import { createContext, useContext, useState, useRef, useEffect } from 'react';

const BuyBarContext = createContext({ visible: false });

export function useBuyBar() {
  return useContext(BuyBarContext);
}

/**
 * Wraps the product detail page to provide mobile buy-bar visibility state.
 * Uses IntersectionObserver: when the actionsRef element scrolls out of
 * the viewport on mobile, the sticky bar appears above the bottom nav.
 */
export function BuyBarProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const actionsRef = useRef(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    const el = actionsRef.current;
    if (!el) return;

    // Skip on desktop — the bar is hidden via CSS but we also avoid
    // attaching an observer that never fires.
    const mql = window.matchMedia('(min-width: 1024px)');
    if (mql.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const next = !entry.isIntersecting;
        if (next !== visibleRef.current) {
          visibleRef.current = next;
          setVisible(next);
        }
      },
      { threshold: 0, rootMargin: '0px 0px -60px 0px' }, // -60px for bottom nav height
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <BuyBarContext.Provider value={{ visible, actionsRef }}>
      {children}
    </BuyBarContext.Provider>
  );
}
