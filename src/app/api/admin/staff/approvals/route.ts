import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

// GET: List approvals with filter
export async function GET(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'FINANCE_MANAGER'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '30')));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (type && type !== 'ALL') {
      where.type = type;
    }

    const [total, approvals] = await Promise.all([
      prisma.staffApproval.count({ where }),
      prisma.staffApproval.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requestedBy: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
          reviewer: {
            select: { id: true, name: true, email: true, role: true, avatarUrl: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: approvals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Approvals GET Error:', error);
    return NextResponse.json({ success: false, error: 'অনুমোদন তালিকা লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// POST: Submit new approval request
export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'লগইন আবশ্যক' }, { status: 401 });
    }

    const body = await req.json();
    const { title, type = 'GENERAL', details } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'অনুরোধের শিরোনাম আবশ্যক' }, { status: 400 });
    }

    const approval = await prisma.staffApproval.create({
      data: {
        title,
        type,
        requestedById: session.id,
        status: 'PENDING',
        details: typeof details === 'object' ? JSON.stringify(details) : details || null,
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'অনুমোদনের জন্য সফলভাবে প্রেরণ করা হয়েছে।',
      data: approval,
    });
  } catch (error: any) {
    console.error('Approval POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'অনুমোদন অনুরোধ পাঠাতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

