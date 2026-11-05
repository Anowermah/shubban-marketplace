import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminPublicationSettingsClient from './AdminPublicationSettingsClient';

export const dynamic = 'force-dynamic';

export default async function AdminPublicationSettingsPage() {
  const dbSettings = await prisma.publicationSetting.findMany();
  const settingsMap: Record<string, string> = {
    defaultAllowDownload: 'true',
    defaultRequireLogin: 'false',
    defaultReadOnline: 'true',
    readerHeartbeatSeconds: '15',
    meaningfulReadSeconds: '30',
    meaningfulPageCount: '3',
    watermarkEnabled: 'false',
    watermarkText: 'শুব্বান ডিজিটাল লাইব্রেরি',
    defaultMagazineLanguage: 'bn',
    seoPublicationTitle: 'শুব্বান প্রকাশনা ও ডিজিটাল লাইব্রেরি',
  };

  dbSettings.forEach((item) => {
    settingsMap[item.key] = item.value;
  });

  return (
    <div className="font-bengali">
      <AdminPublicationSettingsClient initialSettings={settingsMap} />
    </div>
  );
}

