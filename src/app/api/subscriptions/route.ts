import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন।' }, { status: 401 });
    }

    const { planId, interval } = await req.json();

    const plan = await prisma.membershipPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      return NextResponse.json({ error: 'প্ল্যানটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const days = interval === 'YEARLY' ? 365 : 30;
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const subscription = await prisma.$transaction(async (tx) => {
      // 1. Create subscription
      const sub = await tx.subscription.create({
        data: {
          userId: session.id,
          planId: plan.id,
          interval: interval || 'MONTHLY',
          status: 'ACTIVE',
          startDate: new Date(),
          endDate,
          paymentMethod: 'bkash',
          transactionId: `SUB-${Date.now()}`,
        },
      });

      // 2. Update user membership tier
      await tx.user.update({
        where: { id: session.id },
        data: {
          membershipTier: plan.code,
          membershipExpiry: endDate,
        },
      });

      // 3. Create notification
      await tx.notification.create({
        data: {
          userId: session.id,
          title: 'মেম্বারশিপ সক্রিয় হয়েছে',
          message: `আপনার ${plan.name} সদস্যপদ সফলভাবে সক্রিয় হয়েছে। মেয়াদ: ${endDate.toLocaleDateString('bn-BD')} পর্যন্ত।`,
          type: 'SUBSCRIPTION',
          link: '/account/subscriptions',
        },
      });

      return sub;
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error('Subscription error:', error);
    return NextResponse.json({ error: 'মেম্বারশিপ চালু করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
