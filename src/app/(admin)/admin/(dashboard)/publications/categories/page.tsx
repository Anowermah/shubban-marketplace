import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPublicationCategoriesClient from './AdminPublicationCategoriesClient';

export const dynamic = 'force-dynamic';

export default async function AdminPublicationCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          articles: true,
          books: true,
        },
      },
    },
  });

  const formattedCategories = categories.map((c) => ({
    ...c,
    articleCount: c._count?.articles || 0,
    bookCount: c._count?.books || 0,
  }));

  return (
    <div className="font-bengali">
      <AdminPublicationCategoriesClient initialCategories={formattedCategories} />
    </div>
  );
}
