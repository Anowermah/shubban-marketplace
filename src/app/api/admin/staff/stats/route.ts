import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalStaff,
      activeStaff,
      onLeaveStaff,
      probationStaff,
      totalDepartments,
      departments,
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      pendingApprovals,
      todayAttendance,
      pendingLeaves,
      recentTasks,
      recentStaff,
    ] = await Promise.all([
      prisma.staffProfile.count(),
      prisma.staffProfile.count({ where: { employmentStatus: 'ACTIVE' } }),
      prisma.staffProfile.count({ where: { employmentStatus: 'ON_LEAVE' } }),
      prisma.staffProfile.count({ where: { employmentStatus: 'PROBATION' } }),
      prisma.department.count(),
      prisma.department.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          code: true,
          _count: {
            select: { staffMembers: true, tasks: true },
          },
        },
      }),
      prisma.staffTask.count(),
      prisma.staffTask.count({ where: { status: 'TODO' } }),
      prisma.staffTask.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.staffTask.count({ where: { status: 'COMPLETED' } }),
      prisma.staffApproval.count({ where: { status: 'PENDING' } }),
      prisma.staffAttendance.count({
        where: {
          date: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.staffLeaveRequest.count({ where: { status: 'PENDING' } }),
      prisma.staffTask.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          assignee: { select: { name: true, avatarUrl: true } },
          department: { select: { name: true } },
        },
      }),
      prisma.staffProfile.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true, avatarUrl: true, role: true } },
          department: { select: { name: true } },
          designation: { select: { name: true } },
        },
      }),
    ]);

    // Calculate task completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        staff: {
          total: totalStaff,
          active: activeStaff,
          onLeave: onLeaveStaff,
          probation: probationStaff,
        },
        departments: {
          total: totalDepartments,
          breakdown: departments,
        },
        tasks: {
          total: totalTasks,
          todo: todoTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          completionRate,
          recent: recentTasks,
        },
        approvals: {
          pending: pendingApprovals,
        },
        leaves: {
          pending: pendingLeaves,
        },
        attendance: {
          todayCount: todayAttendance,
        },
        recentStaff,
      },
    });
  } catch (error: any) {
    console.error('Staff Stats GET Error:', error);
    return NextResponse.json({ success: false, error: 'পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

