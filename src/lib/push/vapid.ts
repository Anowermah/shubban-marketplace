import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

// 1. Environment & VAPID Configuration
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@atrbd.com';

let isVapidConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    isVapidConfigured = true;
  } catch (err) {
    console.warn('[VAPID] Invalid VAPID credentials in environment:', err);
  }
}

export function getVapidStatus() {
  return {
    isConfigured: isVapidConfigured,
    publicKey: VAPID_PUBLIC_KEY || null,
    subject: VAPID_SUBJECT,
    hasPrivateKey: Boolean(VAPID_PRIVATE_KEY),
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  category?: 'ORDERS' | 'PROMOTIONS' | 'SYSTEM' | 'SECURITY' | 'INVENTORY' | 'SHIPMENT';
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Dispatch real Web Push Notification to a subscription
 */
export async function sendWebPushNotification(
  subscription: {
    id?: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userId?: string | null;
    applicationType?: string;
  },
  payload: PushPayload
) {
  const pushConfig = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const stringPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || (subscription.applicationType === 'ADMIN' ? '/icons/admin/icon-192x192.png' : '/icons/main/icon-192x192.png'),
    badge: payload.badge || (subscription.applicationType === 'ADMIN' ? '/icons/admin/favicon-48x48.png' : '/icons/main/favicon-48x48.png'),
    url: payload.url || (subscription.applicationType === 'ADMIN' ? '/admin' : '/'),
    tag: payload.tag || `shubban-${Date.now()}`,
    actions: payload.actions,
    timestamp: Date.now(),
  });

  if (!isVapidConfigured) {
    // Log failure due to unconfigured production VAPID credentials
    const log = await prisma.pushNotificationLog.create({
      data: {
        recipientId: subscription.userId || null,
        applicationType: subscription.applicationType || 'MAIN',
        notificationCategory: payload.category || 'SYSTEM',
        title: payload.title,
        body: payload.body,
        deliveryStatus: 'FAILED',
        providerResponse: 'VAPID credentials not configured in environment variables. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.',
        sentAt: new Date(),
      },
    });
    return {
      success: false,
      error: 'VAPID credentials missing in production environment.',
      logId: log.id,
    };
  }

  try {
    const result = await webpush.sendNotification(pushConfig, stringPayload, {
      TTL: 60 * 60 * 24, // 24 hours
    });

    // Update last used on subscription
    if (subscription.id) {
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { lastUsedAt: new Date() },
      }).catch(() => {});
    }

    const log = await prisma.pushNotificationLog.create({
      data: {
        recipientId: subscription.userId || null,
        applicationType: subscription.applicationType || 'MAIN',
        notificationCategory: payload.category || 'SYSTEM',
        title: payload.title,
        body: payload.body,
        deliveryStatus: 'SENT',
        providerResponse: `HTTP ${result.statusCode}: Delivered successfully`,
        sentAt: new Date(),
      },
    });

    return {
      success: true,
      statusCode: result.statusCode,
      logId: log.id,
    };
  } catch (error: any) {
    const statusCode = error.statusCode || error.status || 500;
    const errorMessage = error.message || 'Unknown Web Push error';

    // Expired or unregistered subscription cleanup (HTTP 410 or 404)
    if (statusCode === 410 || statusCode === 404) {
      if (subscription.id) {
        await prisma.pushSubscription.update({
          where: { id: subscription.id },
          data: { subscriptionStatus: 'EXPIRED' },
        }).catch(() => {});
      }
    }

    const log = await prisma.pushNotificationLog.create({
      data: {
        recipientId: subscription.userId || null,
        applicationType: subscription.applicationType || 'MAIN',
        notificationCategory: payload.category || 'SYSTEM',
        title: payload.title,
        body: payload.body,
        deliveryStatus: 'FAILED',
        providerResponse: `HTTP ${statusCode}: ${errorMessage}`,
        retryCount: 1,
        sentAt: new Date(),
      },
    });

    return {
      success: false,
      statusCode,
      error: errorMessage,
      logId: log.id,
    };
  }
}

