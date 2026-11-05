import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminReviewsClient from '@/components/admin/AdminReviewsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdminReviewsPageProps {
  searchParams: {
    page?: string;
    q?: string;
    rating?: string;
  };
}

export default async function AdminReviewsPage({ searchParams }: AdminReviewsPageProps) {
  const user = await getCurrentUserWithProfile();
  if (!user || !isAdmin(user.role)) {
    redirect('/admin/login?redirect=/admin/reviews');
  }

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = 15;
  const search = searchParams.q?.trim() || '';
  const ratingParam = searchParams.rating?.trim() || '';

  const where: any = {};
  if (ratingParam) {
    const parsedRating = parseInt(ratingParam, 10);
    if (!isNaN(parsedRating)) {
      where.rating = parsedRating;
    }
  }

  if (search) {
    where.OR = [
      { comment: { contains: search } },
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { book: { title: { contains: search } } },
    ];
  }

  const [totalReviews, reviews] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        book: { select: { id: true, title: true, slug: true, coverImage: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const serializedReviews = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    isVerified: r.isVerified,
    createdAt: r.createdAt.toISOString(),
    user: {
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
      avatarUrl: r.user.avatarUrl,
    },
    book: {
      id: r.book.id,
      title: r.book.title,
      slug: r.book.slug,
      coverImage: r.book.coverImage,
    },
  }));

  return (
    <AdminReviewsClient
      initialReviews={serializedReviews}
      initialTotal={totalReviews}
      initialPage={currentPage}
      initialLimit={pageSize}
    />
  );
}
