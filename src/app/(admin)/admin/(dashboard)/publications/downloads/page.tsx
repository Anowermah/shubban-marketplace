import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPublicationDownloadsClient from './AdminPublicationDownloadsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPublicationDownloadsPage() {
  const [downloads, totalDownloads, issueDownloads, articleDownloads] = await Promise.all([
    prisma.publicationDownload.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        issue: {
          select: { id: true, issueTitle: true, issueNumber: true, volume: true },
        },
        article: {
          select: { id: true, title: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.publicationDownload.count(),
    prisma.publicationDownload.count({ where: { issueId: { not: null } } }),
    prisma.publicationDownload.count({ where: { articleId: { not: null } } }),
  ]);

  return (
    <div className="font-bengali">
      <AdminPublicationDownloadsClient
        initialDownloads={downloads}
        stats={{
          totalDownloads,
          issueDownloads,
          articleDownloads,
        }}
      />
    </div>
  );
}
