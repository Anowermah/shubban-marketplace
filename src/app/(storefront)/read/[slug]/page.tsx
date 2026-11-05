import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import DigitalPdfReader from '@/components/reader/DigitalPdfReader';

interface ReadPageProps {
  params: {
    slug: string;
  };
}

export default async function ReadPage({ params }: ReadPageProps) {
  const { slug } = params;

  const book = await prisma.book.findUnique({
    where: { slug },
    include: {
      author: true,
    },
  });

  if (!book) {
    notFound();
  }

  const sessionUser = await getSessionUser();

  let hasAccess = book.isFree;

  if (sessionUser) {
    // Admins always have access
    if (sessionUser.role === 'SUPER_ADMIN' || sessionUser.role === 'ADMIN') {
      hasAccess = true;
    }
    // Subscribers have access to all digital books
    if (['DIGITAL', 'PREMIUM', 'INSTITUTIONAL'].includes(sessionUser.membershipTier)) {
      hasAccess = true;
    }
    // Check if user purchased this specific book
    if (!hasAccess) {
      const entitlement = await prisma.digitalEntitlement.findFirst({
        where: {
          userId: sessionUser.id,
          bookId: book.id,
        },
      });
      if (entitlement) {
        hasAccess = true;
      }
    }
  }

  return (
    <div className="w-full h-screen bg-stone-900">
      <DigitalPdfReader
        book={{
          id: book.id,
          title: book.title,
          slug: book.slug,
          fullPdfUrl: book.fullPdfUrl,
          samplePdfUrl: book.samplePdfUrl,
          isFree: book.isFree,
          pages: book.pages,
          toc: book.toc,
          author: {
            name: book.author.name,
            slug: book.author.slug,
          },
        }}
        hasAccess={hasAccess}
        userRole={sessionUser?.role}
      />
    </div>
  );
}
