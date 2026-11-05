import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPublicationFeedbackClient from './AdminPublicationFeedbackClient';

export const dynamic = 'force-dynamic';

export default async function AdminPublicationFeedbackPage() {
  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      article: {
        select: { id: true, title: true, slug: true },
      },
    },
  });

  return (
    <div className="font-bengali">
      <AdminPublicationFeedbackClient initialComments={comments} />
    </div>
  );
}
