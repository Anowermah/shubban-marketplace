import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { sendWebPushNotification } from '@/lib/push/vapid';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      body: messageBody,
      applicationType = 'MAIN',
      category = 'SYSTEM',
      target = 'ALL', // ALL | ME | USER
      targetUserId,
      url,
    } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Filter target active subscriptions
    let whereClause: any = {
      subscriptionStatus: 'ACTIVE',
      applicationType: applicationType === 'ADMIN' ? 'ADMIN' : 'MAIN',
    };

    if (target === 'ME') {
      whereClause.userId = user.id;
    } else if (target === 'USER' && targetUserId) {
      whereClause.userId = targetUserId;
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: whereClause,
      take: 100, // Safe batch limit
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sentCount: 0,
        failedCount: 0,
        message: 'No active push subscriptions found matching the target criteria.',
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      const res = await sendWebPushNotification(sub, {
        title,
        body: messageBody,
        category,
        url: url || (applicationType === 'ADMIN' ? '/admin' : '/'),
      });

      if (res.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      failedCount,
      totalMatched: subscriptions.length,
      message: `Push dispatch completed. Sent: ${sentCount}, Failed/Pending: ${failedCount}`,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/push/send:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Push dispatch failed' },
      { status: 500 }
    );
  }
}

