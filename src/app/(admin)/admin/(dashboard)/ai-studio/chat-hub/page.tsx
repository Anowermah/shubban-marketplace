import { Metadata } from 'next';
import { AiStudioService } from '@/lib/ai/ai-studio-service';
import { AiChatService } from '@/lib/ai/ai-chat-service';
import { prisma } from '@/lib/prisma';
import AiStudioChatHubClient from '@/components/admin/ai-studio/AiStudioChatHubClient';

export const metadata: Metadata = {
  title: 'সেন্ট্রাল এআই চ্যাট হাব | শুভ্বান এআই স্টুডিও',
  description: '১২টি বিশেষায়িত এআই এজেন্ট ও সমন্বিত ইসলামিক নলেজ সিস্টেমের সেন্ট্রাল চ্যাট হাব',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioChatHubPage() {
  const [agents, studioConvs, islamicConvs] = await Promise.all([
    AiStudioService.getRegisteredAgents(),
    AiChatService.listConversations({ limit: 30 }),
    prisma.islamicAiConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 15,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, sender: true },
        },
      },
    }),
  ]);

  const mappedIslamic = islamicConvs.map((ic) => ({
    id: `islamic_${ic.id}`,
    title: ic.title || 'ইসলামিক প্রশ্নোত্তর',
    agentKey: 'islamic-ai',
    mode: 'RAG_GROUNDED',
    isPinned: false,
    isIslamicAi: true,
    lastMessage: ic.messages[0] ? ic.messages[0].content.slice(0, 80) : null,
    updatedAt: ic.updatedAt.toISOString(),
  }));

  const allConversations = [
    ...studioConvs.conversations.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    ...mappedIslamic,
  ];

  return (
    <div className="space-y-4">
      <AiStudioChatHubClient
        initialAgents={JSON.parse(JSON.stringify(agents))}
        initialConversations={JSON.parse(JSON.stringify(allConversations))}
      />
    </div>
  );
}

