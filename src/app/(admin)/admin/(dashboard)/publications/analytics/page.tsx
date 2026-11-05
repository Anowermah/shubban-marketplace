import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminPublicationAnalyticsClient from './AdminPublicationAnalyticsClient';

export const metadata = {
  title: 'ডিজিটাল প্রকাশনা ও পাঠক অ্যানালিটিক্স — শুব্বান প্রশাসন',
  description: 'মাসিক সাময়িকী ও প্রবন্ধের রিয়েল-টাইম পাঠক সংখ্যা, রিডিং সেশন, ডাউনলোড ও এনগেজমেন্ট রিপোর্ট।',
};

export default async function PublicationAnalyticsPage() {
  const session = await getSessionUser();
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
    redirect('/admin/login?error=unauthorized');
  }

  // Fetch initial 30 days data
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [sessions, downloads, shares, issues] = await Promise.all([
    prisma.readingSession.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        id: true,
        issueId: true,
        articleId: true,
        sessionId: true,
        ipHash: true,
        deviceType: true,
        durationSeconds: true,
        totalPagesViewed: true,
        isMeaningfulReader: true,
        completionRate: true,
        createdAt: true,
      },
    }),
    prisma.publicationDownload.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, issueId: true, ipHash: true, createdAt: true },
    }),
    prisma.publicationShare.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { id: true, issueId: true, platform: true, createdAt: true },
    }),
    prisma.publicationIssue.findMany({
      take: 20,
      orderBy: { views: 'desc' },
      include: {
        magazine: { select: { title: true } },
        _count: {
          select: { readingSessions: true, downloadsLog: true, sharesLog: true },
        },
      },
    }),
  ]);

  return (
    <AdminPublicationAnalyticsClient
      initialSessions={sessions}
      initialDownloads={downloads}
      initialShares={shares}
      publications={issues.map((iss) => ({
        id: iss.id,
        title: iss.issueTitle,
        magazine: iss.magazine.title,
        coverImage: iss.coverImage,
        views: iss.views,
        sessions: iss._count.readingSessions,
        downloads: iss.downloads,
        shares: iss._count.sharesLog,
        publicationDate: iss.publicationDate.toISOString(),
      }))}
    />
  );
}

