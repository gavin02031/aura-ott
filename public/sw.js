/* Minimal service worker for PWA install.
   iOS may not fully support SW features, but registration is safe. */
const CACHE_VERSION = 'aura-cache-v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;

// Cache only the app shell + PWA essentials.
const ASSETS = ['/','/index.html','/manifest.webmanifest','/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
      )
      .catch(() => {})
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Never serve stale cached Vite hashed assets.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(fetch(req));
    return;
  }

  // Only cache a small allowlist; everything else goes network-only.
  const shouldHandle =
    url.pathname === '/' ||
    url.pathname === '/index.html' ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/favicon.svg';

  if (!shouldHandle) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});

