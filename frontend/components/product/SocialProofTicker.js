'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// Once per day per device — repeat nagging is exactly what makes these tickers
// feel fake. Gated with localStorage (project convention), not a fake timer.
const SEEN_KEY = 'konkan-social-proof-seen';
const GATE_MS = 24 * 60 * 60 * 1000;

// Human-friendly recency for the real order timestamp — keeps the ticker
// honest (no "just now" claims for a purchase from last week).
function relativeTime(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 2 * 60 * 60 * 1000) return 'just now';
  if (diff < 24 * 60 * 60 * 1000) return 'today';
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

// Subtle live-activity line: "● Recently purchased from Mapusa" (fresh orders)
// or "● Purchased from Mapusa • 3 days ago" (older ones).
// Real data only — the backend resolves the latest non-cancelled order's
// address city for this product. Appears briefly, then fades away.
export default function SocialProofTicker({ city, purchasedAt }) {
  const rel = relativeTime(purchasedAt);
  const isRecent = rel === 'just now' || rel === 'today' || rel === 'yesterday';
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!city) return;

    // Gate is written on DISMISS (not on show) — same pattern as the splash
    // screen, so React StrictMode's double effect-run behaves identically.
    let seen = false;
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      const last = parseInt(raw || '0', 10);
      seen = last > 0 && Date.now() - last < GATE_MS;
    } catch {
      // storage unavailable — still show the ticker
    }
    if (seen) return;

    // Let the page breathe before the line appears, then auto-dismiss.
    const showTimer = setTimeout(() => setVisible(true), 1500);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      try {
        localStorage.setItem(SEEN_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    }, 1500 + 6500);
    const removeTimer = setTimeout(() => setGone(true), 1500 + 6500 + 500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, [city]);

  if (gone || !city) return null;

  const fade = reduceMotion
    ? { opacity: visible ? 1 : 0 }
    : { opacity: 1, y: 0 };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          animate={fade}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 text-xs text-konkan-text-secondary"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-konkan-green-primary opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-konkan-green-primary" />
          </span>
          <span>
            {isRecent ? 'Recently purchased from' : 'Purchased from'}{' '}
            <span className="font-semibold text-konkan-text-primary">{city}</span>
            {rel && !isRecent && (
              <>
                {' '}•{' '}
                <span className="text-konkan-text-secondary">{rel}</span>
              </>
            )}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}