import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import AiStudioProvidersClient from '@/components/admin/ai-studio/AiStudioProvidersClient';

export const metadata: Metadata = {
  title: 'প্রোভাইডার ও মডেল সংযোগ | শুভ্বান এআই স্টুডিও',
  description: 'লোকাল আরএজি, জেমিনাই, ওপেনএআই, অ্যানথ্রপিক ও ওলামা এআই ইঞ্জিন কনফিগারেশন',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioProvidersPage() {
  const providers = await prisma.aiProviderConfig.findMany({
    orderBy: { isDefault: 'desc' },
  });

  return (
    <div className="space-y-6">
      <AiStudioProvidersClient initialProviders={JSON.parse(JSON.stringify(providers))} />
    </div>
  );
}

