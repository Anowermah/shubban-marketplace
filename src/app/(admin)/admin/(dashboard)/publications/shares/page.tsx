import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPublicationSharesClient from './AdminPublicationSharesClient';

export const dynamic = 'force-dynamic';

export default async function AdminPublicationSharesPage() {
  const [shares, totalShares, fbCount, waCount, copyCount, nativeCount] = await Promise.all([
    prisma.publicationShare.findMany({
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
    prisma.publicationShare.count(),
    prisma.publicationShare.count({ where: { platform: 'FACEBOOK' } }),
    prisma.publicationShare.count({ where: { platform: 'WHATSAPP' } }),
    prisma.publicationShare.count({ where: { platform: 'COPY_LINK' } }),
    prisma.publicationShare.count({ where: { platform: 'NATIVE' } }),
  ]);

  return (
    <div className="font-bengali">
      <AdminPublicationSharesClient
        initialShares={shares}
        stats={{
          totalShares,
          byPlatform: {
            FACEBOOK: fbCount,
            WHATSAPP: waCount,
            COPY_LINK: copyCount,
            NATIVE: nativeCount,
          },
        }}
      />
    </div>
  );
}
