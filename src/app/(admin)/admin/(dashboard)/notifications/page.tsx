import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminNotificationsClient from '@/components/admin/AdminNotificationsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminNotificationsPage() {
  const user = await getCurrentUserWithProfile();
  if (!user || !isAdmin(user.role)) {
    redirect('/admin/login?redirect=/admin/notifications');
  }

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const serialized = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  }));

  return <AdminNotificationsClient initialNotifications={serialized} />;
}
