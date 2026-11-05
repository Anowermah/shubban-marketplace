import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { verifyMagazineAccess } from '@/lib/services/publishingService';
import MagazineWorkspaceClient from './MagazineWorkspaceClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const mag = await prisma.magazine.findUnique({
    where: { id },
    select: { title: true },
  });

  return {
    title: mag ? `${mag.title} — প্রকাশনা ওয়ার্কস্পেস` : 'সাময়িকী ওয়ার্কস্পেস',
    description: 'স্বতন্ত্র ডিজিটাল সাময়িকী ও জার্নাল ম্যানেজমেন্ট ওয়ার্কস্পেস',
  };
}

export default async function MagazineWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/admin/login');
  }

  const { id } = await params;

  // Tenant access verification
  const auth = await verifyMagazineAccess(id, user);
  if (!auth.authorized) {
    return (
      <div className="p-8 text-center max-w-lg mx-auto my-12 bg-white dark:bg-stone-900 rounded-3xl border border-rose-200 dark:border-rose-900">
        <h2 className="text-xl font-bold text-rose-600 mb-2">প্রবেশাধিকার সংরক্ষিত</h2>
        <p className="text-xs text-stone-500 mb-4">
          আপনার এই সাময়িকী ওয়ার্কস্পেসে প্রবেশের অনুমোদন নেই। অনুগ্রহ করে সেন্ট্রাল এডমিনের সাথে যোগাযোগ করুন।
        </p>
        <a
          href="/admin/publishing"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold"
        >
          সেন্ট্রাল প্রকাশনায় ফিরে যান
        </a>
      </div>
    );
  }

  const [magazine, issues, articles, files, members, settings, plans, rights, schedule, allUsers] =
    await Promise.all([
      prisma.magazine.findUnique({
        where: { id },
        include: {
          publisher: true,
          category: true,
        },
      }),
      prisma.publicationIssue.findMany({
        where: { magazineId: id },
        orderBy: { publicationDate: 'desc' },
        take: 50,
      }),
      prisma.article.findMany({
        where: { magazineId: id },
        orderBy: { publishedAt: 'desc' },
        take: 50,
        include: {
          author: { select: { id: true, name: true, photoUrl: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.publicationFile.findMany({
        where: { magazineId: id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.publicationMember.findMany({
        where: { magazineId: id },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        },
      }),
      prisma.magazineSetting.findMany({
        where: { magazineId: id },
      }),
      prisma.publicationSubscriptionPlan.findMany({
        where: { magazineId: id },
        orderBy: { durationMonths: 'asc' },
      }),
      prisma.publicationRights.findFirst({
        where: { magazineId: id },
      }),
      prisma.publicationSchedule.findUnique({
        where: { magazineId: id },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        take: 100,
        orderBy: { name: 'asc' },
      }),
    ]);

  if (!magazine) {
    notFound();
  }

  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <MagazineWorkspaceClient
      magazine={JSON.parse(JSON.stringify(magazine))}
      issues={JSON.parse(JSON.stringify(issues))}
      articles={JSON.parse(JSON.stringify(articles))}
      files={JSON.parse(JSON.stringify(files))}
      members={JSON.parse(JSON.stringify(members))}
      settings={settingsMap}
      plans={JSON.parse(JSON.stringify(plans))}
      rights={rights ? JSON.parse(JSON.stringify(rights)) : null}
      schedule={schedule ? JSON.parse(JSON.stringify(schedule)) : null}
      allUsers={allUsers}
      userRole={auth.isSuperAdmin ? 'SUPER_ADMIN' : auth.role || 'MEMBER'}
    />
  );
}

