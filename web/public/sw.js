 
// Service Worker for PWA offline support
// This file will be served from the public folder and registered in the client.
const CACHE_NAME = 'poyken-ecommerce-v1';
const OFFLINE_URL = '/offline';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache essential assets (manifest, icons, etc.)
      return cache.addAll([
        '/',
        '/manifest',
        '/favicon.ico',
        '/offline',
        '/images/auth-hero-luxury.png',
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET requests
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      // Network fallback
      return fetch(request)
        .then((networkResponse) => {
          // Cache the response for future use
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // If both cache and network fail, show offline page
          return caches.match(OFFLINE_URL);
        });
    })
  );
});
