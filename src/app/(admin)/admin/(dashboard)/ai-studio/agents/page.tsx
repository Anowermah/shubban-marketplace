import { Metadata } from 'next';
import { AiStudioService } from '@/lib/ai/ai-studio-service';
import AiStudioAgentsClient from './AiStudioAgentsClient';

export const metadata: Metadata = {
  title: 'এআই এজেন্ট রেজিস্ট্রি | শুভ্বান এআই স্টুডিও',
  description: '১২টি বিশেষায়িত এআই এজেন্টের অনুমতি, সিস্টেম প্রম্পট ও টুল কনফিগারেশন',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioAgentsPage() {
  const agents = await AiStudioService.getRegisteredAgents();

  return <AiStudioAgentsClient initialAgents={JSON.parse(JSON.stringify(agents))} />;
}

