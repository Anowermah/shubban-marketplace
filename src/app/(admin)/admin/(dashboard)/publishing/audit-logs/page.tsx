import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import CentralAuditLogsClient from './CentralAuditLogsClient';

export const metadata: Metadata = {
  title: 'সেন্ট্রাল প্রকাশনা অডিট লগ ও অ্যাক্টিভিটি হিস্ট্রি | শুব্বান প্রকাশনা প্রশাসন',
  description: 'সকল ডিজিটাল প্রকাশনার অপরিবর্তনযোগ্য ইভেন্ট ট্রেইল ও অডিট হিস্ট্রি',
};

export const dynamic = 'force-dynamic';

export default async function CentralAuditLogsPage() {
  const [logs, magazines] = await Promise.all([
    prisma.publicationAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.magazine.findMany({
      select: { id: true, title: true, themeColor: true },
      orderBy: { title: 'asc' },
    }),
  ]);

  const magMap = new Map(magazines.map((m) => [m.id, m]));

  const formattedLogs = logs.map((log) => ({
    id: log.id,
    magazineId: log.magazineId,
    magazineTitle: log.magazineId ? magMap.get(log.magazineId)?.title || 'নির্দিষ্ট প্রকাশনা' : 'প্ল্যাটফর্ম-ব্যাপী',
    magazineColor: log.magazineId ? magMap.get(log.magazineId)?.themeColor || '#0f3e2e' : '#0f3e2e',
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    details: log.details,
    userName: log.userName || 'System',
    ipHash: log.ipHash,
    createdAt: log.createdAt.toISOString(),
  }));

  return (
    <CentralAuditLogsClient
      initialLogs={formattedLogs}
      magazines={magazines}
    />
  );
}
