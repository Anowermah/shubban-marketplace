import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPublicationTagsClient from './AdminPublicationTagsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPublicationTagsPage() {
  const tags = await prisma.publicationTag.findMany({
    orderBy: { usageCount: 'desc' },
  });

  return (
    <div className="font-bengali">
      <AdminPublicationTagsClient initialTags={tags} />
    </div>
  );
}

