import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminSettingsClient from '@/components/admin/AdminSettingsClient';
import { Settings } from 'lucide-react';

export default async function AdminSettingsPage() {
  const settingsRecords = await prisma.siteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settingsRecords.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-shubban-gold" />
          <span>সিস্টেম কনফিগারেশন ও সেটিংস</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          ওয়েবসাইটের সাধারণ তথ্য, ডেলিভারি চার্জ এবং নীতিগত সেটিংস পরিচালনা করুন।
        </p>
      </div>

      <AdminSettingsClient initialSettings={settingsMap} />
    </div>
  );
}

