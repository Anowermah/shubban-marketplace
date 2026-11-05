import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminPromotionsManager from '@/components/admin/AdminPromotionsManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPromotionsPage() {
  const user = await getCurrentUserWithProfile();
  if (!user || !isAdmin(user.role)) {
    redirect('/admin/login?redirect=/admin/promotions');
  }

  const discountedBooks = await prisma.book.findMany({
    where: { discountPrice: { not: null } },
    include: {
      author: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const serializedBooks = discountedBooks.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    price: b.price,
    discountPrice: b.discountPrice,
    coverImage: b.coverImage,
    author: {
      id: b.author.id,
      name: b.author.name,
    },
  }));

  return <AdminPromotionsManager initialBooks={serializedBooks} />;
}
