'use client';

import { useState, useEffect } from 'react';

/**
 * iOS PWA Install Banner
 * 
 * Detects iOS Safari users who haven't installed the PWA yet and shows
 * a one-time banner: "Add to Home Screen to enable notifications"
 * 
 * - Only shows on iOS Safari (not Chrome, not Android)
 * - Only shows if not in standalone mode (app not installed)
 * - Dismissed permanently after user closes it
 */
export default function IosPwaBanner() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem('kokan_ghar_ios_pwa_dismissed')) {
      return;
    }

    // Detect iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    if (isIOS && isSafari && !isStandalone) {
      // Show banner after 5 seconds
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show || dismissed) return null;

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem('kokan_ghar_ios_pwa_dismissed', 'true');
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg"
        >
          ✕
        </button>

        {/* Content */}
        <div className="flex items-start gap-3 pr-6">
          <div className="text-3xl">📱</div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              Add Kokan Ghar to Home Screen
            </h3>
            <p className="text-gray-500 text-xs mt-1 leading-relaxed">
              Tap the <strong>Share button</strong> below, then select{' '}
              <strong>&quot;Add to Home Screen&quot;</strong> to enable notifications &amp; faster loading.
            </p>

            {/* Visual instruction */}
            <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⬆️</span>
                <span>1. Tap the Share button in Safari</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">➕</span>
                <span>2. Select &quot;Add to Home Screen&quot;</span>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="mt-3 text-xs text-green-700 font-medium hover:underline"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
