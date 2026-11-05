import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AiStudioKnowledgeBaseClient from '@/components/admin/ai-studio/AiStudioKnowledgeBaseClient';

export const metadata: Metadata = {
  title: 'নলেজ বেস ও আরএজি ইনজেশন | শুভ্বান এআই স্টুডিও',
  description: 'কুরআন, হাদিস, তাফসীর, সাময়িকী ও ক্যাটালগ ভেক্টর ইনডেক্সিং এবং নলেজ ভাণ্ডার',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioKnowledgeBasePage() {
  const [sources, versesCount, hadithsCount, tafsirCount, booksCount, articlesCount, magsCount] =
    await Promise.all([
      prisma.aiKnowledgeSource.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quranVerse.count(),
      prisma.hadithEntry.count(),
      prisma.tafsirEntry.count(),
      prisma.book.count(),
      prisma.article.count(),
      prisma.magazine.count(),
    ]);

  const stats = {
    versesCount,
    hadithsCount,
    tafsirCount,
    booksCount,
    articlesCount,
    magsCount,
  };

  return (
    <div className="space-y-6">
      <AiStudioKnowledgeBaseClient
        initialSources={JSON.parse(JSON.stringify(sources))}
        initialStats={stats}
      />
    </div>
  );
}

