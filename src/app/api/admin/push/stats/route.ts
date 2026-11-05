import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { getVapidStatus } from '@/lib/push/vapid';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin privileges required.' },
        { status: 403 }
      );
    }

    const [
      totalMainSubs,
      totalAdminSubs,
      activeMainSubs,
      activeAdminSubs,
      recentLogs,
      sentCount,
      failedCount,
    ] = await Promise.all([
      prisma.pushSubscription.count({ where: { applicationType: 'MAIN' } }),
      prisma.pushSubscription.count({ where: { applicationType: 'ADMIN' } }),
      prisma.pushSubscription.count({ where: { applicationType: 'MAIN', subscriptionStatus: 'ACTIVE' } }),
      prisma.pushSubscription.count({ where: { applicationType: 'ADMIN', subscriptionStatus: 'ACTIVE' } }),
      prisma.pushNotificationLog.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.pushNotificationLog.count({ where: { deliveryStatus: 'SENT' } }),
      prisma.pushNotificationLog.count({ where: { deliveryStatus: 'FAILED' } }),
    ]);

    const vapid = getVapidStatus();

    return NextResponse.json({
      success: true,
      stats: {
        totalMainSubs,
        totalAdminSubs,
        activeMainSubs,
        activeAdminSubs,
        sentCount,
        failedCount,
      },
      vapid: {
        isConfigured: vapid.isConfigured,
        publicKey: vapid.publicKey,
        subject: vapid.subject,
        hasPrivateKey: vapid.hasPrivateKey,
      },
      recentLogs,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/push/stats:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch push stats' },
      { status: 500 }
    );
  }
}

