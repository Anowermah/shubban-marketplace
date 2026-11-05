import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPublishersManager from '@/components/admin/AdminPublishersManager';

export const revalidate = 0;

export default async function AdminPublishersPage() {
  const [
    totalPublishers,
    activePublishers,
    inactivePublishers,
    totalBooksWithPublisher,
    totalMagazinesWithPublisher,
    publishers,
  ] = await Promise.all([
    prisma.publisher.count(),
    prisma.publisher.count({ where: { OR: [{ status: 'ACTIVE' }, { isActive: true }] } }),
    prisma.publisher.count({ where: { OR: [{ status: 'INACTIVE' }, { isActive: false }] } }),
    prisma.book.count({ where: { publisherId: { not: null } } }),
    prisma.magazine.count({ where: { publisherId: { not: null } } }),
    prisma.publisher.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: {
        _count: {
          select: {
            books: true,
            magazines: true,
          },
        },
      },
    }),
  ]);

  const totalPublishedContent = totalBooksWithPublisher + totalMagazinesWithPublisher;

  // Compute profile completion score for each publisher
  const formattedPublishers = publishers.map((pub) => {
    let score = 0;
    const totalCriteria = 10;
    if (pub.name) score++;
    if (pub.logoUrl) score++;
    if (pub.description) score++;
    if (pub.contactPerson) score++;
    if (pub.email || pub.phone) score++;
    if (pub.address || pub.city) score++;
    if (pub.website) score++;
    if (pub.regNumber || pub.establishedYear) score++;
    if (pub.facebook || pub.linkedin || pub.youtube) score++;
    if (pub.seoTitle || pub.seoDescription) score++;
    const profileCompletion = Math.round((score / totalCriteria) * 100);

    return {
      ...pub,
      totalPublications: pub._count.books + pub._count.magazines,
      profileCompletion,
    };
  });

  return (
    <AdminPublishersManager
      initialPublishers={formattedPublishers as any}
      initialStats={{
        totalPublishers,
        activePublishers,
        inactivePublishers,
        totalPublishedContent,
      }}
      initialTotalCount={totalPublishers}
    />
  );
}
