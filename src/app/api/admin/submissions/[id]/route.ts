import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientIp = getClientIp(req);
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { status, reviewNotes } = await req.json();

    const submission = await prisma.submission.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(reviewNotes !== undefined ? { reviewNotes } : {}),
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'SUBMISSION_UPDATED',
          entity: 'Submission',
          entityId: params.id,
          details: JSON.stringify({
            status,
            hasNotes: !!reviewNotes,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    return NextResponse.json({ error: 'পাণ্ডুলিপি আপডেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clientIp = getClientIp(req);
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const existing = await prisma.submission.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'পাণ্ডুলিপিটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    await prisma.submission.delete({
      where: { id: params.id },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'SUBMISSION_DELETED',
          entity: 'Submission',
          entityId: params.id,
          details: JSON.stringify({
            title: existing.title,
            authorId: existing.userId,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'পাণ্ডুলিপি সফলভাবে মুছে ফেলা হয়েছে!',
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return NextResponse.json({ error: 'পাণ্ডুলিপি মুছতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
