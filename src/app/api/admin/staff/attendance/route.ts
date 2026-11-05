import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

// GET: Attendance records
export async function GET(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date');
    const staffProfileId = searchParams.get('staffProfileId');
    const departmentId = searchParams.get('departmentId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '30')));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (staffProfileId && staffProfileId !== 'ALL') {
      where.staffProfileId = staffProfileId;
    }

    if (departmentId && departmentId !== 'ALL') {
      where.staffProfile = { departmentId };
    }

    if (dateStr) {
      const targetDate = new Date(dateStr);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    const [total, records] = await Promise.all([
      prisma.staffAttendance.count({ where }),
      prisma.staffAttendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          staffProfile: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
              department: { select: { id: true, name: true, code: true } },
              designation: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Attendance GET Error:', error);
    return NextResponse.json({ success: false, error: 'উপস্থিতি তালিকা লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// POST: Record Attendance (Check-in, Check-out or Admin Entry)
export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ success: false, error: 'লগইন আবশ্যক' }, { status: 401 });
    }

    const body = await req.json();
    let { staffProfileId, date, checkInTime, checkOutTime, status = 'PRESENT', remarks } = body;

    // If staffProfileId not passed, find for current user
    if (!staffProfileId) {
      const myProfile = await prisma.staffProfile.findUnique({ where: { userId: session.id } });
      if (!myProfile) {
        return NextResponse.json({ success: false, error: 'আপনার কোনো স্টাফ প্রোফাইল বিদ্যমান নেই।' }, { status: 400 });
      }
      staffProfileId = myProfile.id;
    }

    const recordDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(new Date(recordDate).setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(recordDate).setHours(23, 59, 59, 999));

    // Check existing attendance for this staff today
    let attendance = await prisma.staffAttendance.findFirst({
      where: {
        staffProfileId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    if (attendance) {
      // Update checkOutTime or status
      attendance = await prisma.staffAttendance.update({
        where: { id: attendance.id },
        data: {
          checkOutTime: checkOutTime ? new Date(checkOutTime) : new Date(),
          status: status || attendance.status,
          remarks: remarks || attendance.remarks,
        },
      });
      return NextResponse.json({
        success: true,
        message: 'চেক-আউট / উপস্থিতি আপডেট সফল হয়েছে।',
        data: attendance,
      });
    } else {
      // Create new check-in
      attendance = await prisma.staffAttendance.create({
        data: {
          staffProfileId,
          date: recordDate,
          checkInTime: checkInTime ? new Date(checkInTime) : new Date(),
          checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
          status,
          remarks: remarks || null,
        },
      });
      return NextResponse.json({
        success: true,
        message: 'চেক-ইন / উপস্থিতি সফলভাবে নথিভুক্ত হয়েছে।',
        data: attendance,
      });
    }
  } catch (error: any) {
    console.error('Attendance POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'উপস্থিতি নথিভুক্ত করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

