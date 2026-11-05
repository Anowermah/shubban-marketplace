import { Metadata } from 'next';
import { AiStudioService } from '@/lib/ai/ai-studio-service';
import AiStudioDashboardClient from './AiStudioDashboardClient';

export const metadata: Metadata = {
  title: 'এআই স্টুডিও ড্যাশবোর্ড | শুব্বান এআই কনসোল',
  description: 'সেন্ট্রাল এআই ইকোসিস্টেম, ১২টি বিশেষায়িত এজেন্ট ও অটোনোমাস কমান্ড মনিটর',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioDashboardPage() {
  const [stats, agents] = await Promise.all([
    AiStudioService.getStudioStats(),
    AiStudioService.getRegisteredAgents(),
  ]);

  return (
    <AiStudioDashboardClient
      initialStats={JSON.parse(JSON.stringify(stats))}
      initialAgents={JSON.parse(JSON.stringify(agents))}
    />
  );
}

