// Kokan Ghar Service Worker — Push Notifications + Caching + Rich Notifications
const CACHE_NAME = 'kokan-ghar-v2';
const STATIC_ASSETS = [
  '/',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/favicon.svg',
];

// Install — cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Don't fail install if caching fails (e.g. offline)
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Push — show rich notification with actions + image
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Kokan Ghar', body: event.data.text() };
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/icon-192x192.png',
    image: data.image || null,  // Rich notification large image
    vibrate: [100, 50, 100],
    tag: data.tag || 'kokan-ghar-notification',
    renotify: true,
    requireInteraction: false,
    data: {
      url: data.url || '/',
      campaignId: data.data?.campaignId || null,
      dateOfArrival: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Kokan Ghar', options)
  );
});

// Notification click — open the URL + track click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  const campaignId = event.notification.data?.campaignId;
  const fullUrl = new URL(url, self.location.origin).href;

  // Track click via API (fire-and-forget)
  if (campaignId) {
    fetch(`${self.location.origin}/api/push/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId }),
    }).catch(() => {});
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          return client.navigate(fullUrl);
        }
      }
      // Otherwise open new window
      return clients.openWindow(fullUrl);
    })
  );
});

// Badge count — update app icon badge when push is received
self.addEventListener('push', (event) => {
  // Set badge count (where supported)
  if (self.registration.setAppBadge) {
    self.registration.setAppBadge(1).catch(() => {});
  }
});

// Clear badge when notification is clicked or all are dismissed
self.addEventListener('notificationclose', (event) => {
  // Badge auto-clears when all notifications are dismissed
});
