'use client';

/**
 * PWA Client Utilities
 * - Service worker registration for Main & Admin scopes
 * - VAPID Key URL-safe base64 conversion
 * - Push subscription and unsubscription
 * - Standalone detection
 */

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as any).MSStream
  );
}

/**
 * Register Main Website Service Worker
 */
export async function registerMainServiceWorker(
  onUpdate?: (registration: ServiceWorkerRegistration) => void
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  // Never register service worker in development or on localhost to prevent hydration mismatches and cache pollution
  if (
    process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    // Proactively clean up any stale registrations on localhost
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA Main] Service Worker registered with scope:', registration.scope);

    // Update detection
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWA Main] New update available');
          if (onUpdate) onUpdate(registration);
        }
      });
    });

    return registration;
  } catch (error) {
    console.warn('[PWA Main] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Register Admin Management Service Worker
 */
export async function registerAdminServiceWorker(
  onUpdate?: (registration: ServiceWorkerRegistration) => void
): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  // Never register service worker in development or on localhost
  if (
    process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/admin-sw.js', {
      scope: '/admin',
    });

    console.log('[PWA Admin] Service Worker registered with scope:', registration.scope);

    // Update detection
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[PWA Admin] New admin update available');
          if (onUpdate) onUpdate(registration);
        }
      });
    });

    return registration;
  } catch (error) {
    console.warn('[PWA Admin] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Subscribe to Web Push Notifications
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  applicationType: 'MAIN' | 'ADMIN' = 'MAIN'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!('PushManager' in window)) {
      return { success: false, error: 'Push notifications are not supported in this browser' };
    }

    // 1. Fetch VAPID public key
    const keyRes = await fetch('/api/push/public-key');
    const keyData = await keyRes.json();

    if (!keyData.success || !keyData.publicKey) {
      return { success: false, error: 'Push notification server is pending VAPID configuration' };
    }

    const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);

    // 2. Request browser permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'বিজ্ঞপ্তির অনুমতি দেওয়া হয়নি (Permission denied)' };
    }

    // 3. Register push manager
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      return { success: false, error: 'Invalid push subscription returned by browser' };
    }

    // 4. Send subscription to server
    const saveRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
        applicationType,
        userAgent: navigator.userAgent,
      }),
    });

    const saveData = await saveRes.json();
    return { success: saveData.success, error: saveData.error };
  } catch (err: any) {
    return { success: false, error: err.message || 'Push subscription failed' };
  }
}

/**
 * Unsubscribe from Web Push Notifications
 */
export async function unsubscribeFromPush(
  registration: ServiceWorkerRegistration
): Promise<{ success: boolean; error?: string }> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return { success: true };
    }

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

