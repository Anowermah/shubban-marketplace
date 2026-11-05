/**
 * Shubban Admin — Dedicated Management Service Worker
 * Version: 1.0.0
 * Scope: /admin
 * 
 * Strict Security Principles:
 * - Strictly restricted to /admin scope
 * - Does NOT control the public storefront
 * - NEVER caches authenticated admin data, financial reports, customer info, orders, or API responses
 * - Authenticated data requests are strictly NETWORK-ONLY
 * - Only safe static application shell (icons, styles, fonts) is cached
 * - Complete cache purging on logout message
 * - Dedicated Admin Web Push alerts receiver (Orders, Stock, Security)
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

const CACHE_VERSION = 'shubban-admin-v1.0.3';
const ADMIN_STATIC_CACHE = `admin-static-${CACHE_VERSION}`;
const ADMIN_OFFLINE_URL = '/admin/offline';

// Pre-cached assets essential for Admin shell
const PRECACHE_ASSETS = [
  ADMIN_OFFLINE_URL,
  '/admin/manifest.webmanifest',
  '/icons/admin/icon-192x192.png',
  '/icons/admin/icon-512x512.png',
  '/icons/admin/icon-maskable-192x192.png',
  '/icons/admin/apple-touch-icon.png',
  '/fonts/Bornomala-Regular.woff2',
  '/fonts/Bornomala-Bold.woff2',
];

// 1. Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ADMIN_STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW Admin] Pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Event: Clean up old admin caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('admin-') && key !== ADMIN_STATIC_CACHE) {
            console.log('[SW Admin] Deleting obsolete admin cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Check if request is an admin static asset (NEVER Next.js JS chunks)
function isAdminStaticAsset(url) {
  const pathname = url.pathname;
  if (pathname.startsWith('/_next/')) return false;

  return (
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/icons/admin/') ||
    pathname.startsWith('/images/') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico')
  );
}

// 3. Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Strictly ignore anything outside the admin scope
  if (!url.pathname.startsWith('/admin')) {
    return;
  }

  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }

  // ALL Admin APIs and data endpoints are strictly NETWORK-ONLY
  if (url.pathname.startsWith('/api/')) {
    return; // Pass directly to network
  }

  // Strategy A: Static assets (scripts, styles, icons)
  if (isAdminStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(ADMIN_STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy B: Navigation requests within /admin
  // Strictly Network-First with Offline Screen Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(async () => {
          // Serve Admin offline fallback screen
          const offlineScreen = await caches.match(ADMIN_OFFLINE_URL);
          if (offlineScreen) return offlineScreen;

          return new Response(
            '<html><head><meta charset="utf-8"/><title>Admin Offline</title></head><body style="background:#0c0a09;color:#fff;font-family:sans-serif;text-align:center;padding:50px;"><h2>অ্যাডমিন সংযোগ বিচ্ছিন্ন</h2><p>অনুগ্রহ করে ইন্টারনেট সংযোগ পুনরায় পরীক্ষা করুন।</p><button onclick="window.location.reload()" style="background:#d97706;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;">পুনরায় চেষ্টা করুন</button></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }
});

// 4. Message Event: Security Purge on Logout & Skip Waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  // Complete cache purge on admin logout
  if (event.data && (event.data.type === 'CLEAR_ADMIN_CACHE' || event.data.type === 'LOGOUT')) {
    console.log('[SW Admin] Security action: Purging all admin client caches on logout');
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key.includes('admin')) {
          caches.delete(key);
        }
      });
    });
  }
});

// 5. Admin Web Push Notification Event
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'শুভ্বান অ্যাডমিন অ্যালার্ট', body: event.data ? event.data.text() : 'নতুন অ্যাডমিন বিজ্ঞপ্তি।' };
  }

  const title = data.title || 'শুভ্বান অ্যাডমিন কন্ট্রোল';
  const options = {
    body: data.body || 'নতুন অ্যাডমিন অ্যাকশন বা অর্ডার অ্যালার্ট এসেছে।',
    icon: data.icon || '/icons/admin/icon-192x192.png',
    badge: data.badge || '/icons/admin/favicon-48x48.png',
    tag: data.tag || 'shubban-admin-alert',
    requireInteraction: true, // Admin alerts stay visible until reviewed
    data: {
      url: data.url || '/admin',
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'manage', title: 'ড্যাশবোর্ড খুলুন' },
      { action: 'close', title: 'বাতিল' },
    ],
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 6. Admin Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/admin';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
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

