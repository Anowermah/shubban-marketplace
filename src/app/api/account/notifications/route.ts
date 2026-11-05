import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'লগইন আবশ্যক।' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: session.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'বিজ্ঞপ্তি লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'লগইন আবশ্যক।' }, { status: 401 });
    }

    const body = await req.json();

    if (body.markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: session.id, isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'সমস্ত বিজ্ঞপ্তি পঠিত হিসেবে চিহ্নিত করা হয়েছে।' });
    }

    if (body.notificationId) {
      await prisma.notification.updateMany({
        where: { id: body.notificationId, userId: session.id },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'বিজ্ঞপ্তিটি পঠিত হিসেবে চিহ্নিত করা হয়েছে।' });
    }

    return NextResponse.json({ error: 'সঠিক ডেটা প্রদান করুন।' }, { status: 400 });
  } catch (error) {
    console.error('Update notification error:', error);
    return NextResponse.json({ error: 'বিজ্ঞপ্তি আপডেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

