/**
 * GRT Portal – Service Worker
 * Strategy:
 *  - App shell (HTML, CSS, JS, icons, manifest) → Cache First (with network fallback)
 *  - API calls (/api/*) → Network Only (always fresh data)
 *  - All other requests → Network First with cache fallback
 */

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `grt-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `grt-runtime-${CACHE_VERSION}`;

// Files to pre-cache on install (app shell)
const SHELL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/favicon.ico',
  '/logo.png',
  '/apple-touch-icon.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// ─── Install: pre-cache the app shell ────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: remove old caches ─────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [SHELL_CACHE, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !validCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: routing strategy ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // API calls → Network Only (no cache)
  if (url.pathname.startsWith('/api')) {
    event.respondWith(fetch(request));
    return;
  }

  // Navigation requests (HTML pages) → Network First, fallback to shell cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a fresh copy
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match('/') || caches.match(request);
        })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) → Cache First
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|webp|avif)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request).then((response) => {
          // Only cache successful responses
          if (!response || response.status !== 200 || response.type === 'opaque') {
            return response;
          }
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          return response;
        });
      })
    );
    return;
  }

  // Everything else → Network First with runtime cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ─── Background Sync placeholder (future use) ────────────────────
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
});

// ─── Message handler (skip waiting for instant updates) ──────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

