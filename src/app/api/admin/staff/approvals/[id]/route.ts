import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'শুধুমাত্র অ্যাডমিন অনুরোধ পর্যালোচনা ও অনুমোদন করতে পারেন' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { status, remarks } = body;

    if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'অবৈধ স্ট্যাটাস' }, { status: 400 });
    }

    const approval = await prisma.staffApproval.findUnique({ where: { id } });
    if (!approval) {
      return NextResponse.json({ success: false, error: 'অনুরোধ পাওয়া যায়নি।' }, { status: 404 });
    }

    const updated = await prisma.staffApproval.update({
      where: { id },
      data: {
        status,
        remarks: remarks || null,
        reviewerId: session.id,
        decisionAt: new Date(),
      },
      include: {
        requestedBy: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: `অনুরোধ সফলভাবে ${status === 'APPROVED' ? 'অনুমোদন' : status === 'REJECTED' ? 'প্রত্যাখ্যান' : 'বাতিল'} করা হয়েছে।`,
      data: updated,
    });
  } catch (error: any) {
    console.error('Approval Review Error:', error);
    return NextResponse.json({ success: false, error: 'অনুমোদন পর্যালোচনায় ত্রুটি হয়েছে।' }, { status: 500 });
  }
}

