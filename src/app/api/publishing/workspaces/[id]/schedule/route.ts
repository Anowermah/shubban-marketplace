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

    const schedule = await prisma.publicationSchedule.findUnique({
      where: { magazineId: id },
    });

    const latestIssue = await prisma.publicationIssue.findFirst({
      where: { magazineId: id },
      orderBy: { publicationDate: 'desc' },
    });

    const isOverdue = schedule?.nextExpectedDate ? new Date() > new Date(schedule.nextExpectedDate) : false;

    return NextResponse.json({
      success: true,
      schedule,
      latestIssue,
      isOverdue,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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

    const schedule = await prisma.publicationSchedule.upsert({
      where: { magazineId: id },
      create: {
        magazineId: id,
        frequency: body.frequency || 'MONTHLY',
        expectedDay: body.expectedDay ? Number(body.expectedDay) : 1,
        expectedMonth: body.expectedMonth ? Number(body.expectedMonth) : null,
        nextExpectedDate: body.nextExpectedDate ? new Date(body.nextExpectedDate) : null,
        editorialDeadlineDays: body.editorialDeadlineDays ? Number(body.editorialDeadlineDays) : 7,
        numberingScheme: body.numberingScheme || 'VOL_ISSUE',
        timeZone: body.timeZone || 'Asia/Dhaka',
        autoReminders: body.autoReminders !== undefined ? Boolean(body.autoReminders) : true,
      },
      update: {
        frequency: body.frequency,
        expectedDay: body.expectedDay ? Number(body.expectedDay) : undefined,
        expectedMonth: body.expectedMonth ? Number(body.expectedMonth) : undefined,
        nextExpectedDate: body.nextExpectedDate ? new Date(body.nextExpectedDate) : undefined,
        editorialDeadlineDays: body.editorialDeadlineDays ? Number(body.editorialDeadlineDays) : undefined,
        numberingScheme: body.numberingScheme,
        timeZone: body.timeZone,
        autoReminders: body.autoReminders !== undefined ? Boolean(body.autoReminders) : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'প্রকাশনা সময়সূচি আপডেট হয়েছে',
      schedule,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

