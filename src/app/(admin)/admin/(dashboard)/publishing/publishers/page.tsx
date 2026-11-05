import React from 'react';
import { prisma } from '@/lib/prisma';
import PublishersClient from './PublishersClient';

export const dynamic = 'force-dynamic';

export default async function PublishersPage() {
  const publishers = await prisma.publisher.findMany({
    orderBy: { name: 'asc' },
    include: {
      magazines: {
        select: { id: true, title: true, frequency: true },
      },
      _count: {
        select: {
          magazines: true,
          books: true,
          members: true,
        },
      },
    },
  });

  return (
    <div className="font-bengali">
      <PublishersClient initialPublishers={publishers} />
    </div>
  );
}

