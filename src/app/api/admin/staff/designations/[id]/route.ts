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

    const existing = await prisma.designation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'পদবি পাওয়া যায়নি।' }, { status: 404 });
    }

    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.nameEn !== undefined) updates.nameEn = body.nameEn;
    if (body.departmentId) updates.departmentId = body.departmentId;
    if (body.level !== undefined) updates.level = parseInt(String(body.level)) || 1;
    if (body.description !== undefined) updates.description = body.description;

    const updated = await prisma.designation.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      message: 'পদবি সফলভাবে আপডেট করা হয়েছে।',
      data: updated,
    });
  } catch (error: any) {
    console.error('Designation PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'পদবি আপডেট ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'শুধুমাত্র সুপার অ্যাডমিন পদবি মুছতে পারেন' }, { status: 403 });
    }

    const { id } = params;
    const staffCount = await prisma.staffProfile.count({ where: { designationId: id } });
    if (staffCount > 0) {
      return NextResponse.json(
        { success: false, error: `এই পদবিতে ${staffCount} জন স্টাফ নিযুক্ত রয়েছেন। পদবিটি সরাসরি মোছা সম্ভব নয়।` },
        { status: 400 }
      );
    }

    await prisma.designation.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'পদবি সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Designation DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'পদবি মুছতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

