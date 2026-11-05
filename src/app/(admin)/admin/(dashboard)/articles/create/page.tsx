import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminArticleCreateClient from './AdminArticleCreateClient';

export const dynamic = 'force-dynamic';

export default async function AdminArticleCreatePage() {
  const [authors, categories, issues, books] = await Promise.all([
    prisma.author.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
    }),
    prisma.publicationIssue.findMany({
      include: { magazine: true },
      orderBy: { publicationDate: 'desc' },
      take: 50,
    }),
    prisma.book.findMany({
      select: { id: true, title: true, price: true, coverImage: true },
      orderBy: { title: 'asc' },
      take: 100,
    }),
  ]);

  return (
    <div className="font-bengali">
      <AdminArticleCreateClient
        authors={authors}
        categories={categories}
        issues={issues}
        books={books}
      />
    </div>
  );
}
