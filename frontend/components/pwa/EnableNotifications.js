'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export default function EnableNotifications({ className = '', variant = 'banner' }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      setIsSubscribed(false);
    }
  }

  async function handleEnable() {
    setLoading(true);
    setStatusMsg('');

    try {
      // 1. Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setStatusMsg('Notification permission denied. You can enable it later from browser settings.');
        setLoading(false);
        return;
      }

      // 2. Register service worker (if not already)
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      // 3. Subscribe to push
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
      if (!vapidPublicKey) {
        setStatusMsg('VAPID key not configured. Please check environment settings.');
        setLoading(false);
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 4. Send subscription to backend
      const subJson = subscription.toJSON();
      await axios.post(`${API_URL}/push/subscribe`, {
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        device_info: navigator.userAgent.substring(0, 200),
      });

      setIsSubscribed(true);
      setShowBanner(false);
      setStatusMsg('✅ Notifications enabled! You\'ll receive alerts for flash sales and order updates.');
    } catch (err) {
      console.error('Push subscription error:', err);
      setStatusMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        // Notify backend to remove
        await axios.post(`${API_URL}/push/unsubscribe`, {
          endpoint: sub.endpoint,
        }).catch(() => {}); // ignore if backend fails
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
      setPermission('default');
      setStatusMsg('Notifications disabled.');
    } catch {
      setStatusMsg('Error disabling notifications.');
    } finally {
      setLoading(false);
    }
  }

  // Don't render if push not supported
  if (!isSupported) return null;

  // Already subscribed — show small status
  if (isSubscribed && variant === 'banner') {
    return (
      <div className={`flex items-center gap-2 text-xs text-konkan-green-primary ${className}`}>
        <span className="w-2 h-2 rounded-full bg-konkan-green-primary animate-pulse" />
        Notifications active
        <button onClick={handleDisable} className="text-konkan-text-secondary hover:text-konkan-error underline ml-1">
          Disable
        </button>
      </div>
    );
  }

  // Banner variant — inline bar
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-konkan-green-primary/10 to-konkan-gold/10 border border-konkan-green-primary/20 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-konkan-green-primary/10 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-konkan-green-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-konkan-text-primary">Stay Updated!</p>
            <p className="text-xs text-konkan-text-secondary">Get alerts for flash sales, new arrivals & order updates</p>
          </div>
          <button
            onClick={handleEnable}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-konkan-green-primary hover:bg-konkan-green-dark transition-colors disabled:opacity-50 shrink-0"
          >
            {loading ? 'Enabling...' : 'Enable'}
          </button>
        </div>
        {statusMsg && (
          <p className={`text-xs mt-2 ${statusMsg.includes('✅') ? 'text-konkan-success' : 'text-konkan-error'}`}>
            {statusMsg}
          </p>
        )}
      </div>
    );
  }

  // Button variant — simple button
  return (
    <div className={className}>
      <button
        onClick={handleEnable}
        disabled={loading || permission === 'denied'}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-konkan-sand hover:border-konkan-green-primary hover:text-konkan-green-primary transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {loading ? 'Enabling...' : permission === 'denied' ? 'Notifications Blocked' : 'Enable Notifications'}
      </button>
      {statusMsg && (
        <p className={`text-xs mt-1 ${statusMsg.includes('✅') ? 'text-konkan-success' : 'text-konkan-error'}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}
