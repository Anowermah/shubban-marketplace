import React from 'react';
import { prisma } from '@/lib/prisma';
import CentralPublishingClient from './CentralPublishingClient';

export const dynamic = 'force-dynamic';

export default async function CentralPublishingPage() {
  const [
    publisherCount,
    magazineCount,
    issueCount,
    articleCount,
    readingSessionCount,
    meaningfulReadersCount,
    downloadCount,
    shareCount,
    subscriptionCount,
    magazines,
    publishers,
  ] = await Promise.all([
    prisma.publisher.count(),
    prisma.magazine.count(),
    prisma.publicationIssue.count(),
    prisma.article.count(),
    prisma.readingSession.count(),
    prisma.readingSession.count({ where: { isMeaningfulReader: true } }),
    prisma.publicationDownload.count(),
    prisma.publicationShare.count(),
    prisma.publicationSubscription.count({ where: { status: 'ACTIVE' } }),
    prisma.magazine.findMany({
      include: {
        publisher: { select: { id: true, name: true, logoUrl: true } },
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
      orderBy: { createdAt: 'desc' },
    }),
    prisma.publisher.findMany({
      include: {
        _count: {
          select: {
            magazines: true,
            books: true,
            members: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="font-bengali">
      <CentralPublishingClient
        stats={{
          publisherCount,
          magazineCount,
          issueCount,
          articleCount,
          readingSessionCount,
          meaningfulReadersCount,
          downloadCount,
          shareCount,
          subscriptionCount,
        }}
        magazines={magazines}
        publishers={publishers}
      />
    </div>
  );
}

