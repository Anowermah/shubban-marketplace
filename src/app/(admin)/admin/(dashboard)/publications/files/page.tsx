import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPublicationFilesClient from './AdminPublicationFilesClient';

export const dynamic = 'force-dynamic';

export default async function AdminPublicationFilesPage() {
  const [files, issues] = await Promise.all([
    prisma.publicationFile.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.publicationIssue.findMany({
      select: { id: true, issueTitle: true, pdfUrl: true },
    }),
  ]);

  const enrichedFiles = files.map((file) => {
    const linkedIssues = issues
      .filter((i) => i.pdfUrl === file.fileUrl)
      .map((i) => ({ id: i.id, title: i.issueTitle }));
    return {
      ...file,
      usageCount: linkedIssues.length,
      linkedIssues,
      linkedArticles: [],
    };
  });

  return (
    <div className="font-bengali">
      <AdminPublicationFilesClient initialFiles={enrichedFiles} />
    </div>
  );
}
