import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appType = searchParams.get('app') === 'admin' ? 'ADMIN' : 'MAIN';

    const prefs = await prisma.pushNotificationPreference.findMany({
      where: {
        userId: user.id,
        applicationType: appType,
      },
    });

    return NextResponse.json({ success: true, preferences: prefs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { applicationType = 'MAIN', category, enabled = true } = body;

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
    }

    const appType = applicationType === 'ADMIN' ? 'ADMIN' : 'MAIN';

    const pref = await prisma.pushNotificationPreference.upsert({
      where: {
        userId_applicationType_notificationCategory: {
          userId: user.id,
          applicationType: appType,
          notificationCategory: category,
        },
      },
      create: {
        userId: user.id,
        applicationType: appType,
        notificationCategory: category,
        enabled: Boolean(enabled),
      },
      update: {
        enabled: Boolean(enabled),
      },
    });

    return NextResponse.json({ success: true, preference: pref });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

