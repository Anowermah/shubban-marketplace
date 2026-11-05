import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PublishingMagazinesClient from './PublishingMagazinesClient';

export const metadata: Metadata = {
  title: 'সকল ডিজিটাল প্রকাশনা ও সাময়িকী | শুব্বান প্রকাশনা প্রশাসন',
  description: 'কেন্দ্রীয় প্রকাশনা ডিরেক্টরি এবং ওয়ার্কস্পেস ন্যাভিগেশন',
};

export const dynamic = 'force-dynamic';

export default async function PublishingMagazinesPage() {
  const [magazines, publishers] = await Promise.all([
    prisma.magazine.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        publisher: { select: { id: true, name: true, nameEn: true, isVerified: true, logoUrl: true } },
        category: { select: { id: true, name: true } },
        schedule: true,
        _count: {
          select: {
            issues: true,
            articles: true,
            members: true,
            subscriptions: true,
          },
        },
      },
    }),
    prisma.publisher.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true, nameEn: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const formattedMagazines = magazines.map((m) => ({
    id: m.id,
    title: m.title,
    titleEn: m.titleEn,
    slug: m.slug,
    description: m.description,
    coverImage: m.coverImage,
    frequency: m.frequency,
    status: m.status,
    themeColor: m.themeColor || '#0f3e2e',
    editor: m.editor,
    isSubscribable: m.isSubscribable,
    singleIssuePrice: m.singleIssuePrice,
    monthlySubscriptionPrice: m.monthlySubscriptionPrice,
    annualSubscriptionPrice: m.annualSubscriptionPrice,
    totalSubscribers: m.totalSubscribers,
    totalRevenue: m.totalRevenue,
    createdAt: m.createdAt.toISOString(),
    publisher: m.publisher,
    category: m.category,
    schedule: m.schedule
      ? {
          frequency: m.schedule.frequency,
          nextExpectedDate: m.schedule.nextExpectedDate?.toISOString() || null,
          numberingScheme: m.schedule.numberingScheme,
          autoReminders: m.schedule.autoReminders,
        }
      : null,
    issueCount: m._count.issues,
    articleCount: m._count.articles,
    memberCount: m._count.members,
    subscriptionCount: m._count.subscriptions,
  }));

  return (
    <PublishingMagazinesClient
      initialMagazines={formattedMagazines}
      publishers={publishers}
    />
  );
}
