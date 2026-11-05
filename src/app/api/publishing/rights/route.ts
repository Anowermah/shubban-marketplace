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

    const rights = await prisma.publicationRights.findMany({
      include: {
        magazine: {
          select: {
            id: true,
            title: true,
            slug: true,
            publisher: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, rights });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch rights' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, takedownStatus, notes, licenseType, rightsHolder, allowPdfHosting } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID আবশ্যক' }, { status: 400 });
    }

    const updated = await prisma.publicationRights.update({
      where: { id },
      data: {
        ...(takedownStatus && { takedownStatus }),
        ...(notes !== undefined && { notes }),
        ...(licenseType && { licenseType }),
        ...(rightsHolder && { rightsHolder }),
        ...(allowPdfHosting !== undefined && { allowPdfHosting }),
      },
      include: {
        magazine: {
          select: {
            id: true,
            title: true,
            slug: true,
            publisher: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, rights: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update rights' },
      { status: 500 }
    );
  }
}
