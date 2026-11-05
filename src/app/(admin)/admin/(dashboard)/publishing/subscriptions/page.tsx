import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CentralSubscriptionsClient from './CentralSubscriptionsClient';

export const metadata: Metadata = {
  title: 'সেন্ট্রাল সাবস্ক্রিপশন ও রেভিনিউ | শুব্বান প্রকাশনা প্রশাসন',
  description: 'ডিজিটাল সাময়িকী ও জার্নালের কেন্দ্রীয় গ্রাহক সাবস্ক্রিপশন ও পেমেন্ট মনিটরিং',
};

export const dynamic = 'force-dynamic';

export default async function CentralSubscriptionsPage() {
  const [subscriptions, magazines] = await Promise.all([
    prisma.publicationSubscription.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: true,
        magazine: { select: { id: true, title: true, themeColor: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.magazine.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    }),
  ]);

  const formattedSubs = subscriptions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user.name || 'নামহীন পাঠক',
    userEmail: s.user.email,
    planName: s.plan.name,
    durationMonths: s.plan.durationMonths,
    magazineTitle: s.magazine?.title || 'সকল সাময়িকী (বান্ডিল)',
    magazineColor: s.magazine?.themeColor || '#0f3e2e',
    status: s.status,
    startDate: s.startDate.toISOString(),
    endDate: s.endDate.toISOString(),
    amountPaid: s.amountPaid,
    paymentMethod: s.paymentMethod,
    transactionId: s.transactionId,
    autoRenew: s.autoRenew,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <CentralSubscriptionsClient
      initialSubscriptions={formattedSubs}
      magazines={magazines}
    />
  );
}

