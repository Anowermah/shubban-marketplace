import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { verifyMagazineAccess } from '@/lib/services/publishingService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const auth = await verifyMagazineAccess(id, user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const skip = (page - 1) * limit;

    const where: any = { magazineId: id };
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.publicationAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.publicationAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

