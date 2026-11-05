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

    const members = await prisma.publicationMember.findMany({
      where: { magazineId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, avatarUrl: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const auth = await verifyMagazineAccess(id, user);
    if (!auth.authorized || (!auth.isSuperAdmin && auth.role !== 'PUBLICATION_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, permissions } = body;

    if (!userId || !role) {
      return NextResponse.json({ success: false, error: 'ব্যবহারকারী ও রোল নির্বাচন আবশ্যক' }, { status: 400 });
    }

    const member = await prisma.publicationMember.upsert({
      where: {
        magazineId_userId: {
          magazineId: id,
          userId,
        },
      },
      create: {
        magazineId: id,
        userId,
        role,
        permissions: permissions ? JSON.stringify(permissions) : null,
        isActive: true,
      },
      update: {
        role,
        permissions: permissions ? JSON.stringify(permissions) : undefined,
        isActive: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Record audit log
    await prisma.publicationAuditLog.create({
      data: {
        magazineId: id,
        userId: user.id,
        userName: user.name || user.email,
        action: 'MEMBER_ASSIGN',
        targetType: 'MEMBER',
        targetId: member.id,
        details: JSON.stringify({ assignedUserId: userId, role }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'টিম মেম্বার সফলভাবে যুক্ত হয়েছে',
      member,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const auth = await verifyMagazineAccess(id, user);
    if (!auth.authorized || (!auth.isSuperAdmin && auth.role !== 'PUBLICATION_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    if (!memberId) {
      return NextResponse.json({ success: false, error: 'মেম্বার আইডি আবশ্যক' }, { status: 400 });
    }

    await prisma.publicationMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({
      success: true,
      message: 'মেম্বার সরানো হয়েছে',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

