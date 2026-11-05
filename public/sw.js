/**
 * Shubban Libery — Main Website Customer Service Worker
 * Version: 1.0.0
 * Scope: /
 * 
 * Strict Security Principles:
 * - NEVER caches authenticated routes (/account, /checkout, /cart, /orders, /api/auth/*, /admin/*)
 * - Safe cache-first for immutable static assets (fonts, icons, images)
 * - Freshness-aware network-first for public catalog and informational pages
 * - Offline fallback to /offline
 * - VAPID Web Push notification receiver
 */

// Development / Localhost environment check: Immediately disable and unregister self
if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      self.registration.unregister().then(() => {
        if ('caches' in self) {
          return caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
        }
      })
    );
  });
  // Do NOT intercept any fetch requests in development
} else {

const CACHE_VERSION = 'shubban-main-v1.0.3';
const STATIC_CACHE_NAME = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Pre-cached assets essential for application shell
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icons/main/icon-192x192.png',
  '/icons/main/icon-512x512.png',
  '/icons/main/icon-maskable-192x192.png',
  '/icons/main/apple-touch-icon.png',
  '/fonts/Bornomala-Regular.woff2',
  '/fonts/Bornomala-Bold.woff2',
];

// Sensitive routes and paths that must NEVER be cached by Service Worker
const EXCLUDED_PATHS = [
  '/admin',
  '/admin/',
  '/api/admin',
  '/api/auth',
  '/api/checkout',
  '/api/payments',
  '/api/cart',
  '/api/orders',
  '/api/user',
  '/cart',
  '/checkout',
  '/account',
  '/orders',
  '/login',
  '/register',
  '/seller',
  '/api/seller',
];

// 1. Install Event: Pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW Main] Some precache assets failed:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up outdated cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (
            (key.startsWith('static-') || key.startsWith('runtime-')) &&
            key !== STATIC_CACHE_NAME &&
            key !== RUNTIME_CACHE_NAME
          ) {
            console.log('[SW Main] Purging obsolete cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Determine if request is sensitive or excluded
function isExcluded(url) {
  const pathname = url.pathname;
  if (url.origin !== self.location.origin) return true;
  return EXCLUDED_PATHS.some((path) => pathname === path || pathname.startsWith(path + '/'));
}

// Helper: Check if request is for static media/fonts (NEVER Next.js JS chunks)
function isStaticAsset(url) {
  const pathname = url.pathname;
  // NEVER cache Next.js scripts or Webpack chunks in Service Worker CacheStorage
  // Browser HTTP cache natively handles immutable hashed chunks safely
  if (pathname.startsWith('/_next/')) return false;

  return (
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  );
}

// 3. Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Never intercept or cache sensitive paths or Admin routes
  if (isExcluded(url)) return;

  // Strategy A: Cache-First for static assets (fonts, images, next/static bundles)
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
            return networkResponse;
          })
          .catch(() => {
            // Return placeholder if image fails
            if (request.destination === 'image') {
              return caches.match('/icons/main/icon-192x192.png');
            }
          });
      })
    );
    return;
  }

  // Strategy B: Network-First for HTML navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response, clone into runtime cache for offline reading
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Check runtime cache for this page
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;

          // Otherwise, serve the branded offline fallback page
          const offlineFallback = await caches.match(OFFLINE_URL);
          if (offlineFallback) return offlineFallback;

          return new Response(
            '<html><head><meta charset="utf-8"/><title>Offline</title></head><body><h1>ইন্টারনেট সংযোগ বিচ্ছিন্ন</h1><p>দয়া করে ইন্টারনেট সংযোগ পরীক্ষা করুন।</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }
});

// 4. Message Event: Skip waiting & Cache Maintenance
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_USER_CACHE') {
    caches.delete(RUNTIME_CACHE_NAME);
  }
});

// 5. Push Notification Event
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'শুব্বান লাইব্রেরী', body: event.data ? event.data.text() : 'নতুন আপডেট এসেছে।' };
  }

  const title = data.title || 'শুব্বান লাইব্রেরী';
  const options = {
    body: data.body || 'আপনার অ্যাকাউন্টে নতুন আপডেট রয়েছে।',
    icon: data.icon || '/icons/main/icon-192x192.png',
    badge: data.badge || '/icons/main/favicon-48x48.png',
    tag: data.tag || 'shubban-customer-notification',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'দেখুন' },
      { action: 'dismiss', title: 'বাতিল' },
    ],
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 6. Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
}

