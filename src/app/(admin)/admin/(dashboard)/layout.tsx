import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserWithProfile();

  if (!user || (!isAdmin(user.role) && !user.isStaff)) {
    redirect('/admin/login?redirect=/admin');
  }

  return (
    <AdminLayoutClient
      user={{
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        avatarUrl: user.avatarUrl,
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
