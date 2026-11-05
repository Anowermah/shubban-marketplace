import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'শুধুমাত্র অ্যাডমিন ছুটির আবেদন অনুমোদন বা বাতিল করতে পারেন' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, decisionRemarks } = body;

    if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'অবৈধ স্ট্যাটাস' }, { status: 400 });
    }

    const leave = await prisma.staffLeaveRequest.findUnique({ where: { id } });
    if (!leave) {
      return NextResponse.json({ success: false, error: 'ছুটির আবেদন পাওয়া যায়নি।' }, { status: 404 });
    }

    const updated = await prisma.staffLeaveRequest.update({
      where: { id },
      data: {
        status,
        approvedById: session.id,
        decisionRemarks: decisionRemarks || null,
        decisionAt: new Date(),
      },
      include: {
        staffProfile: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    // If approved, update staffProfile status to ON_LEAVE if today is within leave range
    if (status === 'APPROVED') {
      const now = new Date();
      if (now >= leave.startDate && now <= leave.endDate) {
        await prisma.staffProfile.update({
          where: { id: leave.staffProfileId },
          data: { employmentStatus: 'ON_LEAVE' },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `ছুটির আবেদন সফলভাবে ${status === 'APPROVED' ? 'অনুমোদন' : status === 'REJECTED' ? 'প্রত্যাখ্যান' : 'বাতিল'} করা হয়েছে।`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Leave Decision Error:', error);
    return NextResponse.json({ success: false, error: 'ছুটির সিদ্ধান্ত গ্রহণে ত্রুটি হয়েছে।' }, { status: 500 });
  }
}

