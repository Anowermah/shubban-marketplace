import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminAppearanceClient from '@/components/admin/AdminAppearanceClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function AdminAppearancePage() {
  const user = await getCurrentUserWithProfile();
  if (!user || !isAdmin(user.role)) {
    redirect('/admin/login?redirect=/admin/appearance');
  }

  const settingsRecords = await prisma.siteSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settingsRecords.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  return <AdminAppearanceClient initialSettings={settingsMap} />;
}
