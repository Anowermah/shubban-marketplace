import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: 'Endpoint is required to unsubscribe.' },
        { status: 400 }
      );
    }

    await prisma.pushSubscription.updateMany({
      where: { endpoint },
      data: {
        subscriptionStatus: 'UNSUBSCRIBED',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription successfully unsubscribed',
    });
  } catch (err: any) {
    console.error('Error in /api/push/unsubscribe:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

