'use client';

import { useState, useEffect } from 'react';
import { hasConsent, grantConsent, rejectConsent } from '@/lib/gtag';

/**
 * GDPR Cookie Consent Banner
 * - Shows on first visit (no localStorage flag yet)
 * - Calls GA4 Consent Mode v2 grant/reject
 * - Persists choice in localStorage so banner doesn't reappear
 * - Minimal, unobtrusive design at bottom of viewport
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if user hasn't made a choice yet
    const consent = localStorage.getItem('ga4_consent');
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    // If previously granted, make sure consent is synced
    if (consent === 'granted') {
      grantConsent();
    }
  }, []);

  const handleAccept = () => {
    grantConsent();
    setVisible(false);
  };

  const handleReject = () => {
    rejectConsent();
    setVisible(false);
  };

  const handleManage = () => {
    // Toggle to accept — simple version (full CMP would open settings)
    handleAccept();
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-slide-up"
      role="dialog"
      aria-label="Cookie Consent"
    >
      <div className="container-custom">
        <div className="bg-white/95 dark:bg-[#0f0f1a]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-konkan-sand/50 dark:border-[#2a2a40] p-5 md:p-6 max-w-3xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon */}
            <div className="shrink-0 w-10 h-10 rounded-full bg-konkan-green-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-konkan-green-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-konkan-text-primary text-sm mb-1">
                We value your privacy
              </h3>
              <p className="text-xs text-konkan-text-secondary leading-relaxed">
                We use cookies and analytics to improve your shopping experience,
                understand how you use our site, and serve personalised recommendations.
                You can accept all cookies or choose only essential ones.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
              <button
                onClick={handleReject}
                className="flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-xl border border-konkan-sand text-konkan-text-secondary hover:bg-konkan-cream transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 md:flex-none px-4 py-2 text-xs font-semibold rounded-xl bg-konkan-green-primary text-white hover:bg-konkan-green-dark transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>

          {/* Manage link */}
          <div className="mt-3 text-center md:text-right">
            <button
              onClick={handleManage}
              className="text-[10px] text-konkan-text-secondary hover:text-konkan-green-primary underline transition-colors"
            >
              Manage cookie preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
