import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminMagazineCreateClient from './AdminMagazineCreateClient';

export const dynamic = 'force-dynamic';

export default async function AdminMagazineCreatePage() {
  const [magazines, files] = await Promise.all([
    prisma.magazine.findMany({
      orderBy: { title: 'asc' },
    }),
    prisma.publicationFile.findMany({
      where: { mimeType: 'application/pdf' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return (
    <div className="font-bengali">
      <AdminMagazineCreateClient magazines={magazines} recentFiles={files} />
    </div>
  );
}

