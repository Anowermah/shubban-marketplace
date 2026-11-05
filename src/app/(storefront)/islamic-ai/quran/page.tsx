import React from 'react';
import { Metadata } from 'next';
import QuranSearchClient from '@/components/islamic-ai/QuranSearchClient';

export const metadata: Metadata = {
  title: 'কুরআনুল কারীম অনুসন্ধান ও তাফসির | শুব্বান লাইব্রেরী',
  description:
    'পবিত্র কুরআনুল কারীমের মূল আরবী পাঠ, নির্ভরযোগ্য বাংলা ও ইংরেজি তরজমা এবং অনুমোদিত তাফসিরের সমন্বিত অনুসন্ধান।',
};

export default function QuranSearchPage() {
  return <QuranSearchClient />;
}

