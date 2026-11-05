import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys, applicationType = 'MAIN', userAgent } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { success: false, error: 'Invalid push subscription parameters. Endpoint and keys are required.' },
        { status: 400 }
      );
    }

    const appType = applicationType === 'ADMIN' ? 'ADMIN' : 'MAIN';

    // Verify current authenticated session if available
    let userId: string | null = null;
    try {
      const user = await getCurrentUserWithProfile();
      if (user) {
        userId = user.id;
      }
    } catch (e) {
      // Guest subscriber
    }

    // Upsert subscription by endpoint
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId,
        applicationType: appType,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || req.headers.get('user-agent') || null,
        subscriptionStatus: 'ACTIVE',
      },
      update: {
        userId: userId || undefined,
        applicationType: appType,
        p256dh: keys.p256dh,
        auth: keys.auth,
        subscriptionStatus: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription registered successfully',
      subscriptionId: sub.id,
      applicationType: sub.applicationType,
    });
  } catch (err: any) {
    console.error('Error in /api/push/subscribe:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error while saving push subscription' },
      { status: 500 }
    );
  }
}

