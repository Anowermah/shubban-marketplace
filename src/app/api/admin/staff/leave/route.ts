import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

// GET: Leave requests with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const leaveType = searchParams.get('leaveType');
    const staffProfileId = searchParams.get('staffProfileId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '30')));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (leaveType && leaveType !== 'ALL') where.leaveType = leaveType;
    if (staffProfileId && staffProfileId !== 'ALL') where.staffProfileId = staffProfileId;

    const [total, leaves] = await Promise.all([
      prisma.staffLeaveRequest.count({ where }),
      prisma.staffLeaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staffProfile: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
              department: { select: { id: true, name: true, code: true } },
              designation: { select: { id: true, name: true } },
            },
          },
          approvedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: leaves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Leave GET Error:', error);
    return NextResponse.json({ success: false, error: 'ছুটির আবেদন লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// POST: Submit leave request
export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'লগইন আবশ্যক' }, { status: 401 });
    }

    const body = await req.json();
    let { staffProfileId, leaveType = 'CASUAL', startDate, endDate, reason } = body;

    if (!staffProfileId) {
      const myProfile = await prisma.staffProfile.findUnique({ where: { userId: session.id } });
      if (!myProfile) {
        return NextResponse.json({ success: false, error: 'স্টাফ প্রোফাইল পাওয়া যায়নি।' }, { status: 400 });
      }
      staffProfileId = myProfile.id;
    }

    if (!startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: 'ছুটির তারিখ ও কারণ আবশ্যক' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    const leave = await prisma.staffLeaveRequest.create({
      data: {
        staffProfileId,
        leaveType,
        startDate: start,
        endDate: end,
        daysCount,
        reason,
        status: 'PENDING',
      },
      include: {
        staffProfile: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ছুটির আবেদন সফলভাবে দাখিল করা হয়েছে।',
      data: leave,
    });
  } catch (error: any) {
    console.error('Leave POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'ছুটির আবেদন জমা দেওয়া সম্ভব হয়নি।' }, { status: 500 });
  }
}

