'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Entry splash screen — branded Konkan moment on first load of each session.
 *  - Fullscreen green brand gradient: logo tile + brand name + tagline + spinner
 *  - Auto-dismisses after 800ms (fade-out ~350ms)
 *  - Shows ONCE per browser session (sessionStorage gate)
 *  - Skip button dismisses immediately
 *  - prefers-reduced-motion respected: no scale/fade animations, shorter stay
 *
 * Mounted in the root layout so every entry (any deep link) gets it once.
 */
const SPLASH_KEY = 'kokan-ghar-splash-seen';
const SPLASH_MS = 800; // auto-dismiss delay
const FADE_MS = 350; // fade-out duration
const REDUCED_SPLASH_MS = 400; // shorter stay for reduced-motion users

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    setReducedMotion(prefersReduced);

    let seen = false;
    try {
      seen = sessionStorage.getItem(SPLASH_KEY) === '1';
    } catch {
      // sessionStorage unavailable (private mode etc.) — show anyway
    }

    if (!seen) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        try {
          sessionStorage.setItem(SPLASH_KEY, '1');
        } catch {
          // ignore — worst case the splash shows again next load
        }
      }, prefersReduced ? REDUCED_SPLASH_MS : SPLASH_MS);
      return () => clearTimeout(timer);
    }
  }, []);

  const skip = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(SPLASH_KEY, '1');
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="konkan-splash"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#14301F] via-konkan-green-primary to-konkan-green-secondary"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={
            reducedMotion
              ? { opacity: 0, transition: { duration: 0 } }
              : { opacity: 0, transition: { duration: FADE_MS / 1000, ease: 'easeIn' } }
          }
        >
          {/* Watermark — Konkan hut/palm glyph, faint */}
          <svg
            className="absolute left-1/2 top-1/2 w-[520px] h-[520px] text-white pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={0.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.06}
            style={{ transform: 'translate(-50%, -50%) rotate(-8deg)' }}
          >
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>

          {/* ── Brand block — fade + scale in ── */}
          <motion.div
            className="relative text-center px-6"
            initial={reducedMotion ? false : { scale: 0.85, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Logo on white tile — stays readable on the green gradient (light & dark) */}
            <div className="mx-auto mb-6 w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white shadow-[0_12px_50px_rgba(0,0,0,0.35)] flex items-center justify-center p-2">
              <Image
                src="/images/logo/konkan_logo.png"
                alt="Kokan Ghar"
                width={740}
                height={337}
                priority
                className="w-full h-auto object-contain"
              />
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight drop-shadow-md">
              Kokan Ghar
            </h1>
            <p className="mt-2 text-sm sm:text-base text-white/85 font-medium">
              Authentic Konkan Products Online
            </p>

            {/* Spinner */}
            <div className="mt-9 flex items-center justify-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-white/25 border-t-white animate-spin motion-reduce:animate-none" />
              <span className="text-xs text-white/60 uppercase tracking-[0.2em] font-semibold">
                Loading
              </span>
            </div>
          </motion.div>

          {/* Skip — dismiss immediately */}
          <button
            type="button"
            onClick={skip}
            className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 px-4 py-2 rounded-full text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            Skip →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
