import React from 'react';
import { Metadata } from 'next';
import HadithSearchClient from '@/components/islamic-ai/HadithSearchClient';

export const metadata: Metadata = {
  title: 'সিহাহ সিত্তাহ ও প্রামাণ্য হাদিস অনুসন্ধান | শুব্বান লাইব্রেরী',
  description:
    'সহীহুল বুখারী, সহীহ মুসলিম সহ নির্ভরযোগ্য হাদিস সংকলনের মূল আরবী মতন, বাংলা অর্থ ও তাহকীক অনুসন্ধান।',
};

export default function HadithSearchPage() {
  return <HadithSearchClient />;
}

