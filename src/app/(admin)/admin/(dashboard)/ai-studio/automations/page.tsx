import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AiStudioAutomationsClient from '@/components/admin/ai-studio/AiStudioAutomationsClient';

export const metadata: Metadata = {
  title: 'স্বয়ংক্রিয় শিডিউলার ও ওয়ার্কফ্লো | শুভ্বান এআই স্টুডিও',
  description: 'দৈনিক বিক্রয় রিপোর্ট, ইনভেন্টরি এলার্ট ও প্রকাশনা রিমাইন্ডার অটোমেশন',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioAutomationsPage() {
  let workflows = await prisma.aiAutomationWorkflow.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <AiStudioAutomationsClient initialWorkflows={JSON.parse(JSON.stringify(workflows))} />
    </div>
  );
}

