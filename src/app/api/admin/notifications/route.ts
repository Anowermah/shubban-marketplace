import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 403 });
    }

    const [unreadCount, notifications] = await Promise.all([
      prisma.notification.count({
        where: { isRead: false },
      }),
      prisma.notification.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 403 });
    }

    await prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, message: 'সকল নোটিফিকেশন পঠিত হিসেবে চিহ্নিত করা হয়েছে।' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const targetId = id || body.id;
    const shouldClearAll = clearAll || body.clearAll === true;

    if (shouldClearAll) {
      const deleted = await prisma.notification.deleteMany({});
      return NextResponse.json({
        success: true,
        message: `সকল (${deleted.count}টি) নোটিফিকেশন সফলভাবে মুছে ফেলা হয়েছে!`,
      });
    }

    if (targetId) {
      await prisma.notification.delete({
        where: { id: targetId },
      });
      return NextResponse.json({
        success: true,
        message: 'নোটিফিকেশন সফলভাবে মুছে ফেলা হয়েছে!',
      });
    }

    return NextResponse.json({ error: 'মুছে ফেলার জন্য নোটিফিকেশন আইডি দিন।' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

