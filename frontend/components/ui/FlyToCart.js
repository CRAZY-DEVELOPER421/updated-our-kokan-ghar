'use client';

import { createContext, useContext, useRef, useCallback, useState, useEffect } from 'react';
import { animate } from 'framer-motion';

// ── Context ─────────────────────────────────────────────────────────
const FlyToCartCtx = createContext(null);

/**
 * Provider — wraps the app and exposes `flyToCart(src, x, y)`.
 * The flying clone is rendered once at the end of the layout.
 */
export function FlyToCartProvider({ children }) {
  const [anim, setAnim] = useState(null);

  const flyToCart = useCallback((src, startX, startY) => {
    if (!src) return;
    setAnim({ src, startX, startY, key: Date.now() });
  }, []);

  return (
    <FlyToCartCtx.Provider value={flyToCart}>
      {children}
      <FlyClone anim={anim} onDone={() => setAnim(null)} />
    </FlyToCartCtx.Provider>
  );
}

export function useFlyToCart() {
  return useContext(FlyToCartCtx);
}

// ── Flying clone ────────────────────────────────────────────────────
function FlyClone({ anim, onDone }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!anim || !ref.current) return;

    const el = ref.current;
    // Find the VISIBLE fly-cart-target (both Navbar + MobileHeader have one;
    // one is display:none on each viewport). Pick the visible one.
    const candidates = document.querySelectorAll('#fly-cart-target');
    let target = null;
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) { target = el; break; }
    }
    if (!target) { onDone(); return; }

    const targetRect = target.getBoundingClientRect();
    const tx = targetRect.left + targetRect.width / 2 - anim.startX;
    const ty = targetRect.top + targetRect.height / 2 - anim.startY;

    const controls = animate(
      el,
      {
        x: [0, tx * 0.5, tx],
        y: [0, ty - 80, ty],
        scale: [1, 1.2, 0.2],
        opacity: [1, 1, 0],
      },
      {
        duration: 1.5,
        ease: [0.22, 1, 0.36, 1],
        onComplete: () => {
          window.dispatchEvent(new Event('fly-cart-done'));
          onDone();
        },
      },
    );

    return () => controls.stop();
  }, [anim, onDone]);

  if (!anim) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: anim.startX - 40,
        top: anim.startY - 40,
        width: 80,
        height: 80,
        zIndex: 9999,
        pointerEvents: 'none',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 0 30px 10px rgba(58, 125, 92, 0.6), 0 4px 20px rgba(0,0,0,0.3)',
        border: '3px solid #3A7D5C',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={anim.src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        draggable={false}
      />
    </div>
  );
}

// ── Hook for add-to-cart buttons ────────────────────────────────────
/**
 * useAddToCartFly — wraps the addToCart call with the fly animation.
 *
 * Usage:
 *   const { wrappedAddToCart } = useAddToCartFly();
 *   const res = await wrappedAddToCart(addToCart, productId, variantId, qty, imageUrl, buttonRef);
 */

