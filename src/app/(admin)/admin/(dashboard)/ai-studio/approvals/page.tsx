import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AiStudioApprovalsClient from '@/components/admin/ai-studio/AiStudioApprovalsClient';

export const metadata: Metadata = {
  title: 'অনুমোদন কেন্দ্র (HITL) | শুভ্বান এআই স্টুডিও',
  description: 'হিউম্যান-ইন-দ্য-লুপ অনুমোদন কেন্দ্র — স্পর্শকাতর ও গুরুত্বপূর্ণ কমান্ড নিরীক্ষা',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioApprovalsPage() {
  const approvals = await prisma.aiApproval.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      task: {
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <AiStudioApprovalsClient initialApprovals={JSON.parse(JSON.stringify(approvals))} />
    </div>
  );
}

