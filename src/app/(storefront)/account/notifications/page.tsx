import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import NotificationsClient from '@/components/account/NotificationsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'বিজ্ঞপ্তি সমূহ | শুব্বান লাইব্রেরী',
  description: 'আপনার অর্ডার ও অ্যাকাউন্টের জরুরি নোটিফিকেশন।',
};

export default async function NotificationsPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="font-bengali">
      <NotificationsClient initialNotifications={notifications} />
    </div>
  );
}
