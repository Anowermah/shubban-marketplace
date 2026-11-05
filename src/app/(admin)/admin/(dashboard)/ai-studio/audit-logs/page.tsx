import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AiStudioAuditLogsClient from '@/components/admin/ai-studio/AiStudioAuditLogsClient';

export const metadata: Metadata = {
  title: 'এআই অডিট লগ ও ট্র্যাকার | শুভ্বান এআই স্টুডিও',
  description: 'অটোনোমাস কমান্ড এক্সিকিউশন, টুলস হিস্ট্রি ও সেফটি মোড নিরীক্ষা ট্রেইল',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioAuditLogsPage() {
  const logs = await prisma.aiTask.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      steps: {
        orderBy: { stepOrder: 'asc' },
      },
      toolExecutions: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return (
    <div className="space-y-6">
      <AiStudioAuditLogsClient initialLogs={JSON.parse(JSON.stringify(logs))} />
    </div>
  );
}

