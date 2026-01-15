/**
 * =====================================================================
 * SERVICE WORKER - Bộ não của PWA (Progressive Web App)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVICE WORKER LÀ GÌ?
 * - Một script chạy ngầm (background) tách biệt với trang web chính.
 * - Hoạt động như một "Proxy" giữa Trình duyệt và Mạng (Internet).
 *
 * 2. CHỨC NĂNG TRONG FILE NÀY:
 * - `install`: Cache các file tĩnh quan trọng (offline page, logo, css...).
 * - `fetch`: Chặn mọi request mạng.
 *    - Nếu có trong Cache -> Trả về ngay (Siêu nhanh ⚡).
 *    - Nếu không -> Gọi ra Internet.
 *    - Nếu mất mạng -> Trả về trang "Offline" custom. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */ 
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
