import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPublicationAuthorsClient from './AdminPublicationAuthorsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPublicationAuthorsPage() {
  const authors = await prisma.author.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          articles: true,
          books: true,
        },
      },
    },
    take: 100,
  });

  const formattedAuthors = authors.map((a) => ({
    ...a,
    articleCount: a._count?.articles || 0,
    bookCount: a._count?.books || 0,
  }));

  return (
    <div className="font-bengali">
      <AdminPublicationAuthorsClient initialAuthors={formattedAuthors} />
    </div>
  );
}

