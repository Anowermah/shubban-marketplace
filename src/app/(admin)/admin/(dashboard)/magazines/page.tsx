import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminMagazinesClient from './AdminMagazinesClient';

export const metadata = {
  title: 'মাসিক সাময়িকী ও প্রকাশনা ব্যবস্থাপনা — শুব্বান প্রশাসন',
  description: 'মাসিক সাময়িকী, সংখ্যা প্রকাশ, PDF আপলোড, পারমিশন ও এক্সেস কন্ট্রোল ব্যবস্থাপনা।',
};

export default async function AdminMagazinesPage() {
  const session = await getSessionUser();
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
    redirect('/admin/login?error=unauthorized');
  }

  const [magazines, issues, categories, publishers] = await Promise.all([
    prisma.magazine.findMany({
      include: {
        category: true,
        publisher: true,
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.publicationIssue.findMany({
      include: {
        magazine: true,
        _count: { select: { articles: true, readingSessions: true, downloadsLog: true } },
      },
      orderBy: { publicationDate: 'desc' },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
    prisma.publisher.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <AdminMagazinesClient
      initialMagazines={magazines}
      initialIssues={issues}
      categories={categories}
      publishers={publishers}
    />
  );
}

