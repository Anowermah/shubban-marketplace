import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminAuthorsManager, {
  AuthorItem,
  AuthorStats,
  PaginationInfo,
} from '@/components/admin/AdminAuthorsManager';

export const revalidate = 0;

export default async function AdminAuthorsPage() {
  const [totalAuthors, activeAuthors, inactiveAuthors, totalPublishedArticles, initialAuthorRecords] =
    await Promise.all([
      prisma.author.count(),
      prisma.author.count({ where: { OR: [{ status: 'ACTIVE' }, { isActive: true }] } }),
      prisma.author.count({ where: { OR: [{ status: 'INACTIVE' }, { isActive: false }] } }),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
      prisma.author.findMany({
        take: 25,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              books: true,
              articles: true,
              papers: true,
            },
          },
          articles: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              publishedAt: true,
              createdAt: true,
            },
            take: 1,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
    ]);

  const formattedAuthors: AuthorItem[] = initialAuthorRecords.map((auth) => {
    let score = 0;
    const totalCriteria = 10;
    if (auth.name) score++;
    if (auth.photoUrl) score++;
    if (auth.designation) score++;
    if (auth.email) score++;
    if (auth.bio) score++;
    if (auth.bioDetails) score++;
    if (auth.expertise) score++;
    if (auth.workplace || auth.education) score++;
    if (auth.website || auth.facebook || auth.linkedin) score++;
    if (auth.seoTitle || auth.seoDescription) score++;
    const profileCompletion = Math.round((score / totalCriteria) * 100);

    const latestArticle = auth.articles[0] || null;

    return {
      ...auth,
      latestArticle,
      profileCompletion,
    };
  });

  const stats: AuthorStats = {
    totalAuthors,
    activeAuthors,
    inactiveAuthors,
    totalPublishedArticles,
  };

  const pagination: PaginationInfo = {
    total: totalAuthors,
    page: 1,
    limit: 25,
    totalPages: Math.ceil(totalAuthors / 25) || 1,
  };

  return (
    <AdminAuthorsManager
      initialAuthors={formattedAuthors}
      initialStats={stats}
      initialPagination={pagination}
    />
  );
}
