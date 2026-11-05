import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

// GET: List tasks with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const departmentId = searchParams.get('departmentId');
    const assigneeId = searchParams.get('assigneeId');
    const myTasksOnly = searchParams.get('myTasks') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '30')));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (myTasksOnly) {
      where.assigneeId = session.id;
    } else if (assigneeId && assigneeId !== 'ALL') {
      where.assigneeId = assigneeId;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }

    const [total, tasks] = await Promise.all([
      prisma.staffTask.count({ where }),
      prisma.staffTask.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          creator: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          assignee: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
          _count: {
            select: { comments: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Task GET Error:', error);
    return NextResponse.json({ success: false, error: 'টাস্ক তালিকা লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// POST: Create new administrative task
export async function POST(req: NextRequest) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, departmentId, assigneeId, priority = 'MEDIUM', startDate, dueDate } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'টাস্ক শিরোনাম আবশ্যক' }, { status: 400 });
    }

    const task = await prisma.staffTask.create({
      data: {
        title,
        description: description || null,
        departmentId: departmentId || null,
        creatorId: session.id,
        assigneeId: assigneeId || null,
        priority,
        status: 'TODO',
        progress: 0,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        department: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'টাস্ক সফলভাবে তৈরি ও বণ্টন করা হয়েছে।',
      data: task,
    });
  } catch (error: any) {
    console.error('Task POST Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'টাস্ক তৈরিতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

