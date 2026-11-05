import { Metadata } from 'next';
import { getIslamicAiSettings } from '@/lib/islamic-ai/settings';
import AiStudioSettingsClient from '@/components/admin/ai-studio/AiStudioSettingsClient';

export const metadata: Metadata = {
  title: 'এআই স্টুডিও সেটিংস ও গভর্নেন্স | শুভ্বান এআই স্টুডিও',
  description: 'পাবলিক এআই এক্সেস কন্ট্রোল, দৈনিক কোটা, জিরো হ্যালুসিনেশন ও রক্ষণাবেক্ষণ মোড',
};

export const dynamic = 'force-dynamic';

export default async function AiStudioSettingsPage() {
  const settings = await getIslamicAiSettings();

  return (
    <div className="space-y-6">
      <AiStudioSettingsClient initialSettings={JSON.parse(JSON.stringify(settings))} />
    </div>
  );
}

