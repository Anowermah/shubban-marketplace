import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { id } = params;

    const staff = await prisma.staffProfile.findFirst({
      where: {
        OR: [{ id }, { userId: id }, { employeeId: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            avatarUrl: true,
            status: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        department: true,
        designation: true,
        supervisor: {
          include: {
            user: { select: { name: true, email: true } },
            designation: { select: { name: true } },
          },
        },
        subordinates: {
          include: {
            user: { select: { name: true, email: true } },
            designation: { select: { name: true } },
          },
        },
        attendances: {
          take: 30,
          orderBy: { date: 'desc' },
        },
        leaveRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: 'স্টাফ প্রোফাইল পাওয়া যায়নি।' }, { status: 404 });
    }

    // Also fetch tasks assigned to this staff member's user
    const tasks = await prisma.staffTask.findMany({
      where: { assigneeId: staff.userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...staff,
        assignedTasks: tasks,
      },
    });
  } catch (error: any) {
    console.error('Staff Profile GET Error:', error);
    return NextResponse.json({ success: false, error: 'স্টাফ তথ্য লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'শুধুমাত্র অ্যাডমিন স্টাফ তথ্য পরিবর্তন করতে পারেন' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const staff = await prisma.staffProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: 'স্টাফ প্রোফাইল পাওয়া যায়নি।' }, { status: 404 });
    }

    // Update User fields if provided
    const userUpdates: any = {};
    if (body.name) userUpdates.name = body.name;
    if (body.phone !== undefined) userUpdates.phone = body.phone;
    if (body.role && session.role === 'SUPER_ADMIN') userUpdates.role = body.role;
    if (body.userStatus) userUpdates.status = body.userStatus;

    if (Object.keys(userUpdates).length > 0) {
      await prisma.user.update({
        where: { id: staff.userId },
        data: userUpdates,
      });
    }

    // Update StaffProfile fields
    const staffUpdates: any = {};
    if (body.departmentId !== undefined) staffUpdates.departmentId = body.departmentId || null;
    if (body.designationId !== undefined) staffUpdates.designationId = body.designationId || null;
    if (body.supervisorId !== undefined) staffUpdates.supervisorId = body.supervisorId || null;
    if (body.employmentType) staffUpdates.employmentType = body.employmentType;
    if (body.employmentStatus) staffUpdates.employmentStatus = body.employmentStatus;
    if (body.joiningDate) staffUpdates.joiningDate = new Date(body.joiningDate);
    if (body.workResponsibilities !== undefined) staffUpdates.workResponsibilities = body.workResponsibilities;
    if (body.emergencyContact !== undefined) {
      staffUpdates.emergencyContact = typeof body.emergencyContact === 'object' 
        ? JSON.stringify(body.emergencyContact) 
        : body.emergencyContact;
    }
    if (body.professionalBio !== undefined) staffUpdates.professionalBio = body.professionalBio;
    if (body.internalNotes !== undefined) staffUpdates.internalNotes = body.internalNotes;
    if (body.salaryGrade !== undefined) staffUpdates.salaryGrade = body.salaryGrade;

    const updatedProfile = await prisma.staffProfile.update({
      where: { id: staff.id },
      data: staffUpdates,
      include: {
        user: true,
        department: true,
        designation: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'স্টাফ প্রোফাইল সফলভাবে আপডেট করা হয়েছে।',
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error('Staff Profile PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'স্টাফ আপডেট ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'শুধুমাত্র সুপার অ্যাডমিন স্টাফ অপসারণ করতে পারেন' }, { status: 403 });
    }

    const { id } = params;
    const staff = await prisma.staffProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] },
    });

    if (!staff) {
      return NextResponse.json({ success: false, error: 'স্টাফ প্রোফাইল পাওয়া যায়নি।' }, { status: 404 });
    }

    // Soft archive: set status to TERMINATED
    await prisma.staffProfile.update({
      where: { id: staff.id },
      data: { employmentStatus: 'TERMINATED' },
    });

    return NextResponse.json({
      success: true,
      message: 'স্টাফ সফলভাবে আর্কাইভ / টার্মিনেট করা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Staff DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'স্টাফ অপসারণে ত্রুটি হয়েছে।' }, { status: 500 });
  }
}

