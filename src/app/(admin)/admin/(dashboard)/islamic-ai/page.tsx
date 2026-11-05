import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import AdminIslamicAiClient from '@/components/admin/AdminIslamicAiClient';

export const dynamic = 'force-dynamic';

export default async function AdminIslamicAiPage() {
  const session = await getSessionUser();
  if (!session || !isAdmin(session.role)) {
    redirect('/admin/login?redirect=/admin/islamic-ai');
  }

  const [
    totalVerses,
    totalHadiths,
    totalCollections,
    totalScholarlyTopics,
    totalConversations,
    totalMessages,
    feedbackReports,
    collections,
  ] = await Promise.all([
    prisma.quranVerse.count(),
    prisma.hadithEntry.count(),
    prisma.hadithCollection.count(),
    prisma.scholarlyReference.count(),
    prisma.islamicAiConversation.count(),
    prisma.islamicAiMessage.count(),
    prisma.islamicAiFeedback.findMany({
      where: { reportedError: true },
      take: 10,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.hadithCollection.findMany({
      include: { _count: { select: { entries: true } } },
    }),
  ]);

  const stats = {
    metrics: {
      totalVerses,
      totalHadiths,
      totalCollections,
      totalScholarlyTopics,
      totalConversations,
      totalMessages,
      errorReportsCount: feedbackReports.length,
    },
    collections,
    recentReports: feedbackReports,
  };

  return <AdminIslamicAiClient stats={stats} />;
}

