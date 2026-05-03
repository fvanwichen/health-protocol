// ============================================================
// sw.js — Blueprint Protocol Service Worker
// ============================================================
// Handles: offline caching, push event display, notification
// click routing. Notification SCHEDULING is handled in app.js
// via setTimeout / the Notification API directly, since
// Service-Worker-based "scheduled push" requires a remote push
// server. This SW ensures the app works offline & can display
// notifications when they arrive.
// ============================================================

const CACHE_NAME = 'blueprint-v2';

// Assets to pre-cache for offline use
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json'
];

// ── INSTALL ──────────────────────────────────────────────────
// Pre-cache all critical assets on first install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  // Activate immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// ── ACTIVATE ─────────────────────────────────────────────────
// Clean up old caches when a new SW version activates
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ── FETCH ────────────────────────────────────────────────────
// Network-first strategy with cache fallback for offline support
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── PUSH (for future remote push integration) ────────────────
self.addEventListener('push', (event) => {
  const data = event.data
    ? event.data.json()
    : { title: 'Blueprint Protocol', body: 'Time to execute.' };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%230A0A0A"/><text x="32" y="40" font-size="28" font-family="system-ui" font-weight="700" fill="%2300E5A0" text-anchor="middle">B</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%230A0A0A"/><text x="32" y="40" font-size="28" font-family="system-ui" font-weight="700" fill="%2300E5A0" text-anchor="middle">B</text></svg>',
      vibrate: [100, 50, 100],
      tag: data.tag || 'blueprint-reminder',
      renotify: true,
      data: { url: '/' }
    })
  );
});

// ── NOTIFICATION CLICK ───────────────────────────────────────
// Open or focus the app when a notification is tapped
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // If the app is already open, focus it
      for (const client of list) {
        if (client.url.includes('/') && 'focus' in client) return client.focus();
      }
      // Otherwise open a new window
      return clients.openWindow('/');
    })
  );
});

// ── MESSAGE HANDLER ──────────────────────────────────────────
// Receive messages from app.js to show notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="%230A0A0A"/><text x="32" y="40" font-size="28" font-family="system-ui" font-weight="700" fill="%2300E5A0" text-anchor="middle">B</text></svg>',
      vibrate: [100, 50, 100],
      tag: event.data.tag || 'blueprint',
      renotify: true
    });
  }
});
