import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminEssaysClient from './AdminEssaysClient';

export const metadata = {
  title: 'প্রবন্ধ ও গবেষণা ব্যবস্থাপনা — শুব্বান প্রশাসন',
  description: 'মননশীল সাহিত্য, দর্শন ও ইসলামী গবেষণা প্রবন্ধ প্রকাশনা ও ব্যবস্থাপনা।',
};

export default async function AdminEssaysPage() {
  const session = await getSessionUser();
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
    redirect('/admin/login?error=unauthorized');
  }

  const [articles, authors, categories, issues] = await Promise.all([
    prisma.article.findMany({
      include: {
        author: true,
        category: true,
        issue: { select: { id: true, issueTitle: true } },
      },
      orderBy: { publishedAt: 'desc' },
    }),
    prisma.author.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.publicationIssue.findMany({
      select: { id: true, issueTitle: true, volume: true },
      orderBy: { publicationDate: 'desc' },
      take: 20,
    }),
  ]);

  return (
    <AdminEssaysClient
      initialArticles={articles}
      authors={authors}
      categories={categories}
      issues={issues}
    />
  );
}

