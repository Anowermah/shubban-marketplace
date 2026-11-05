import { Metadata } from 'next';
import AiStudioContentStudioClient from '@/components/admin/ai-studio/AiStudioContentStudioClient';

export const metadata: Metadata = {
  title: 'কন্টেন্ট স্টুডিও | শুব্বান এআই স্টুডিও',
  description: 'দীর্ঘ প্রবন্ধ রচনা, সম্পাদকীয় খসড়া এবং ইসলামিক সাহিত্য প্রকাশনা প্রস্তুতি',
};

export const dynamic = 'force-dynamic';

export default function AiStudioContentStudioPage() {
  return <AiStudioContentStudioClient />;
}

