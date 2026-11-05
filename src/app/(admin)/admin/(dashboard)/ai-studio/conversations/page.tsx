import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AiStudioConversationsClient from '@/components/admin/ai-studio/AiStudioConversationsClient';

export const metadata: Metadata = {
  title: 'কথোপকথন আর্কাইভ ও পরিচালনা | শুভ্বান এআই স্টুডিও',
  description: 'ইসলামিক এআই ও অ্যাডমিন এআই সেশনের কেন্দ্রীয় সংরক্ষণ ও অনুসন্ধান হাব',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioConversationsPage() {
  const [adminConvs, islamicConvs] = await Promise.all([
    prisma.aiConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    }),
    prisma.islamicAiConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
        _count: {
          select: { messages: true },
        },
      },
    }),
  ]);

  const mappedAdmin = adminConvs.map((ac) => ({
    id: ac.id,
    title: ac.title,
    agentKey: ac.agentKey,
    mode: ac.mode,
    isIslamicAi: false,
    messageCount: ac._count.messages,
    lastMessage: ac.messages[0]?.content.slice(0, 80) || null,
    createdAt: ac.createdAt.toISOString(),
    updatedAt: ac.updatedAt.toISOString(),
  }));

  const mappedIslamic = islamicConvs.map((ic) => ({
    id: ic.id,
    title: ic.title || 'ইসলামিক প্রশ্নোত্তর',
    agentKey: 'islamic-ai',
    mode: 'RAG_GROUNDED',
    isIslamicAi: true,
    messageCount: ic._count.messages,
    lastMessage: ic.messages[0]?.content.slice(0, 80) || null,
    createdAt: ic.createdAt.toISOString(),
    updatedAt: ic.updatedAt.toISOString(),
  }));

  const combined = [...mappedAdmin, ...mappedIslamic].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-6">
      <AiStudioConversationsClient initialConversations={JSON.parse(JSON.stringify(combined))} />
    </div>
  );
}

