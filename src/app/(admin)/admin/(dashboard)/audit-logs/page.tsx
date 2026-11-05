import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminAuditLogsClient from '@/components/admin/AdminAuditLogsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface AdminAuditLogsPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  const user = await getCurrentUserWithProfile();
  if (!user || !isAdmin(user.role)) {
    redirect('/admin/login?redirect=/admin/audit-logs');
  }

  const currentPage = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = 20;

  const [totalLogs, logs, distinctActions, distinctEntities] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
      },
    }),
    prisma.auditLog.findMany({
      select: { action: true },
      distinct: ['action'],
      take: 50,
      orderBy: { action: 'asc' },
    }),
    prisma.auditLog.findMany({
      select: { entity: true },
      distinct: ['entity'],
      take: 50,
      orderBy: { entity: 'asc' },
    }),
  ]);

  const serializedLogs = logs.map((l) => ({
    id: l.id,
    userId: l.userId,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    details: l.details,
    ipAddress: l.ipAddress,
    createdAt: l.createdAt.toISOString(),
    user: l.user,
  }));

  return (
    <AdminAuditLogsClient
      initialLogs={serializedLogs}
      initialTotal={totalLogs}
      initialPage={currentPage}
      initialLimit={pageSize}
      availableActions={distinctActions.map((a) => a.action)}
      availableEntities={distinctEntities.map((e) => e.entity)}
      operatorRole={user.role}
    />
  );
}
