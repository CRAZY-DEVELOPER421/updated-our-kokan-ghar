'use client';

import { useState, useEffect } from 'react';

const HIDE_KEY = 'kokan_ghar_pwa_hidden';
const INSTALLED_KEY = 'kokan_ghar_pwa_installed';

export default function PwaInstallPopup() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    // Already installed as PWA? Don't show
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // User ticked "Don't show again" or already downloaded — hide forever
    if (localStorage.getItem(HIDE_KEY) || localStorage.getItem(INSTALLED_KEY)) return;

    // Listen for the browser's install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show popup on every page load
    const timer = setTimeout(() => setShow(true), 100);

    // Detect if installed
    const installedHandler = () => {
      setIsInstalled(true);
      setShow(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome / Edge — native install
      setIsInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstalling(false);
      setShow(false);
    } else {
      // iOS / others — show manual instructions alert
      alert(
        '📱 Install Kokan Ghar:\n\n' +
        'iPhone: Tap Share ⬆️ → "Add to Home Screen"\n\n' +
        'Android: Tap ⋮ menu → "Install app" or "Add to Home Screen"'
      );
      setShow(false);
    }

    // Remember that user installed/downloaded
    localStorage.setItem(INSTALLED_KEY, '1');
    // If user ticked "Don't show again", save it
    if (dontShow) {
      localStorage.setItem(HIDE_KEY, '1');
    }
  };

  const handleDismiss = () => {
    if (dontShow) {
      localStorage.setItem(HIDE_KEY, '1');
    }
    setShow(false);
  };

  if (!show || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Popup card */}
      <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-modal animate-slide-up z-10 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-konkan-green-primary via-konkan-green-light to-konkan-gold" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-all"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-5">
          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-konkan-green-primary to-konkan-green-dark flex items-center justify-center shrink-0 shadow-md">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-konkan-text-primary">
                Install Kokan Ghar
              </h3>
              <p className="text-sm text-konkan-text-secondary mt-0.5">
                Get authentic Konkan products at your fingertips
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2.5 mb-4">
            {[
              { icon: '⚡', text: 'Faster loading — works offline too' },
              { icon: '🔔', text: 'Get alerts for flash sales & new arrivals' },
              { icon: '🏠', text: 'One-tap access from your home screen' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-konkan-text-primary">
                <span className="text-base">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-4 h-4 rounded border-konkan-sand text-konkan-green-primary focus:ring-konkan-green-primary accent-[#2D6A4F] cursor-pointer"
            />
            <span className="text-xs text-konkan-text-secondary">Don't show this again</span>
          </label>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-konkan-text-secondary hover:bg-konkan-cream transition-colors border border-konkan-sand"
            >
              Not now
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-konkan-green-primary to-konkan-green-dark hover:from-konkan-green-dark hover:to-konkan-green-primary shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Installing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
