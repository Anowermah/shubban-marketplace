import { Metadata } from 'next';
import AiStudioResearchClient from '@/components/admin/ai-studio/AiStudioResearchClient';

export const metadata: Metadata = {
  title: 'রিসার্চ ও তুলনামূলক ফিকহ | শুভ্বান এআই স্টুডিও',
  description: 'চার মাযহাবের প্রামাণ্য দলীল, ফকীহগণের ঐকমত্য ও প্রাচীন নির্ভরযোগ্য তাফসীর-হাদিস গবেষণা',
};

export const dynamic = 'force-dynamic';

export default function AiStudioResearchPage() {
  return <AiStudioResearchClient />;
}

