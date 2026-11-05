import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'ডিপার্টমেন্ট পাওয়া যায়নি।' }, { status: 404 });
    }

    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.nameEn !== undefined) updates.nameEn = body.nameEn;
    if (body.description !== undefined) updates.description = body.description;
    if (body.headId !== undefined) updates.headId = body.headId || null;
    if (body.status) updates.status = body.status;

    const updated = await prisma.department.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      message: 'ডিপার্টমেন্ট সফলভাবে আপডেট করা হয়েছে।',
      data: updated,
    });
  } catch (error: any) {
    console.error('Department PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'ডিপার্টমেন্ট আপডেট ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'শুধুমাত্র সুপার অ্যাডমিন ডিপার্টমেন্ট মুছতে পারেন' }, { status: 403 });
    }

    const { id } = params;
    const staffCount = await prisma.staffProfile.count({ where: { departmentId: id } });
    if (staffCount > 0) {
      return NextResponse.json(
        { success: false, error: `এই ডিপার্টমেন্টে ${staffCount} জন স্টাফ নিয়োজিত থাকায় এটি সরাসরি মোছা সম্ভব নয়। প্রথমে স্টাফদের অন্য ডিপার্টমেন্টে স্থানান্তর করুন।` },
        { status: 400 }
      );
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'ডিপার্টমেন্ট সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Department DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'ডিপার্টমেন্ট মুছতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

