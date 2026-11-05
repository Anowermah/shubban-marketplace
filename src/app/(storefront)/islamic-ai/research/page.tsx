import React from 'react';
import { Metadata } from 'next';
import IslamicResearchClient from '@/components/islamic-ai/IslamicResearchClient';

export const metadata: Metadata = {
  title: 'উচ্চতর ইসলামিক ফিকহ ও চার মাযহাবের গবেষণা | শুব্বান লাইব্রেরী',
  description:
    'হানাফী, মালিকী, শাফেয়ী ও হাম্বলী—চার সুন্নী মাযহাবের তুলনামূলক দৃষ্টিভঙ্গি, শাস্ত্রীয় দলিল ও গবেষণামূলক বিশ্লেষণ।',
};

export default function IslamicResearchPage() {
  return <IslamicResearchClient />;
}

