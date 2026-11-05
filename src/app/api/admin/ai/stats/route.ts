import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const [
      totalTasks,
      completedTasks,
      pendingApprovals,
      failedTasks,
      recentTasks,
      providers,
      totalUsage,
    ] = await Promise.all([
      prisma.aiTask.count(),
      prisma.aiTask.count({ where: { status: 'COMPLETED' } }),
      prisma.aiTask.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.aiTask.count({ where: { status: 'FAILED' } }),
      prisma.aiTask.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { approval: true },
      }),
      prisma.aiProviderSetting.findMany({
        select: { providerKey: true, name: true, isEnabled: true, modelName: true },
      }),
      prisma.aiUsageLog.aggregate({
        _sum: { promptTokens: true, compTokens: true, totalCostUsd: true },
      }),
    ]);

    const totalTokens =
      (totalUsage._sum.promptTokens || 0) + (totalUsage._sum.compTokens || 0);

    return NextResponse.json({
      metrics: {
        totalTasks,
        completedTasks,
        pendingApprovals,
        failedTasks,
        totalTokens,
        estimatedCostUsd: totalUsage._sum.totalCostUsd || 0,
      },
      providers,
      recentTasks,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

