import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const magazineId = searchParams.get('magazineId') || undefined;
    const action = searchParams.get('action') || undefined;
    const search = searchParams.get('search') || undefined;

    const where: any = {};
    if (magazineId) where.magazineId = magazineId;
    if (action) where.action = action;
    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { action: { contains: search } },
        { details: { contains: search } },
      ];
    }

    const logs = await prisma.publicationAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
