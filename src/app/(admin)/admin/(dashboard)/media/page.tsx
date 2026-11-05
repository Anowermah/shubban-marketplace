import React from 'react';
import { getVerifiedSessionUser, isAdmin, isStaff } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { mediaService } from '@/lib/media/media-service';
import AdminMediaManagerClient from '@/components/admin/media/AdminMediaManagerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'সেন্ট্রাল মিডিয়া লাইব্রেরি ও ডিজিটাল অ্যাসেট ম্যানেজমেন্ট — Shubban DAM',
};

export default async function AdminMediaPage() {
  const user = await getVerifiedSessionUser();
  if (!user || (!isAdmin(user.role) && !isStaff(user.role))) {
    redirect('/admin/login');
  }

  const initialStats = await mediaService.getDashboardStats();

  return (
    <div className="font-bengali">
      <AdminMediaManagerClient initialStats={initialStats} />
    </div>
  );
}

