'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const HIDE_KEY = 'kokan_ghar_notif_prompt_hidden';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function FloatingNotifPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(''); // 'success' | 'error' | ''
  const [statusMsg, setStatusMsg] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Push not supported
    if (!('serviceWorker' in navigator && 'PushManager' in window)) return;

    // User permanently dismissed
    if (localStorage.getItem(HIDE_KEY)) return;

    // Already subscribed — don't show
    checkSubscription();

    // Show after 5 seconds
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setIsSubscribed(true);
        setShow(false);
      }
    } catch {
      // not subscribed
    }
  }

  async function handleAllow() {
    setLoading(true);
    setStatus('');
    try {
      // 1. Request permission
      const result = await Notification.requestPermission();
      if (result !== 'granted') {
        setStatus('error');
        setStatusMsg('Permission denied. Enable from browser settings.');
        setLoading(false);
        return;
      }

      // 2. Register service worker and wait until active
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const reg = await navigator.serviceWorker.ready; // waits for active SW

      // 3. Subscribe to push
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
      if (!vapidKey) {
        setStatus('error');
        setStatusMsg('VAPID key not configured.');
        setLoading(false);
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // 4. Save to backend
      const subJson = subscription.toJSON();
      await axios.post(`${API_URL}/push/subscribe`, {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        device_info: navigator.userAgent.substring(0, 200),
      });

      setIsSubscribed(true);
      setStatus('success');
      setStatusMsg('Done! You\'ll get alerts for sales & orders.');
      setTimeout(() => setShow(false), 2500);
    } catch (err) {
      console.error('Push subscribe error:', err);
      setStatus('error');
      setStatusMsg('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss(permanent = false) {
    if (permanent) {
      localStorage.setItem(HIDE_KEY, '1');
    }
    setShow(false);
  }

  // Don't show if already subscribed or hidden
  if (!show || isSubscribed) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[200] w-[320px] max-w-[calc(100vw-2rem)]">
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.15)] border border-konkan-sand/50 overflow-hidden animate-slide-up" style={{ animation: 'notifPulse 2.5s ease-in-out infinite' }}>
        <style>{`
          @keyframes notifPulse {
            0%, 100% { transform: scale(1); box-shadow: 0 8px 30px rgba(0,0,0,0.15); }
            50% { transform: scale(1.03); box-shadow: 0 10px 40px rgba(0,0,0,0.25); }
          }
        `}</style>
        <div className="p-4">
          {/* Close button */}
          <button
            onClick={() => handleDismiss(false)}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-konkan-text-secondary hover:text-konkan-text-primary hover:bg-konkan-cream transition-all"
            aria-label="Close"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-start gap-3">
            {/* Bell icon */}
            <div className="w-10 h-10 rounded-xl bg-konkan-green-primary/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-konkan-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-konkan-text-primary leading-tight">
                Get Notified!
              </p>
              <p className="text-xs text-konkan-text-secondary mt-0.5 leading-relaxed">
                Flash sales, new arrivals & order updates — straight to your device.
              </p>
            </div>
          </div>

          {/* Status message */}
          {statusMsg && (
            <p className={`text-xs mt-2.5 px-1 ${status === 'success' ? 'text-konkan-success' : 'text-konkan-error'}`}>
              {statusMsg}
            </p>
          )}

          {/* Buttons */}
          {!statusMsg && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleDismiss(true)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-konkan-text-secondary hover:bg-konkan-cream transition-colors border border-konkan-sand"
              >
                Not now
              </button>
              <button
                onClick={handleAllow}
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-konkan-green-primary hover:bg-konkan-green-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enabling...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Allow
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
