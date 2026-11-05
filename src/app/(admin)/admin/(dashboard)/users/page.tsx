import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminUsersClient from '@/components/admin/AdminUsersClient';
import { Users } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      membershipTier: true,
      avatarUrl: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Users className="w-6 h-6 text-shubban-gold" />
          <span>ব্যবহারকারী ও অনুমতি (RBAC) প্রশাসন</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          মোট {toBengaliNumber(users.length)} জন নিবন্ধিত ব্যবহারকারীর ভূমিকা, অ্যাকাউন্ট স্ট্যাটাস ও অধিকার পরিচালনা।
        </p>
      </div>

      <AdminUsersClient
        initialUsers={users.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          phone: u.phone,
          role: u.role,
          status: u.status,
          membershipTier: u.membershipTier,
          avatarUrl: u.avatarUrl,
          createdAt: u.createdAt,
          lastLoginAt: u.lastLoginAt,
        }))}
      />
    </div>
  );
}
