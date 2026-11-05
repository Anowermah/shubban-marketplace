import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { id } = params;
    const task = await prisma.staffTask.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        department: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, error: 'টাস্ক পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: task });
  } catch (error: any) {
    console.error('Task GET by ID Error:', error);
    return NextResponse.json({ success: false, error: 'টাস্ক বিস্তারিত লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();

    const task = await prisma.staffTask.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ success: false, error: 'টাস্ক পাওয়া যায়নি।' }, { status: 404 });
    }

    const updates: any = {};
    if (body.title) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.departmentId !== undefined) updates.departmentId = body.departmentId || null;
    if (body.assigneeId !== undefined) updates.assigneeId = body.assigneeId || null;
    if (body.priority) updates.priority = body.priority;
    if (body.status) {
      updates.status = body.status;
      if (body.status === 'COMPLETED' && !task.completedAt) {
        updates.completedAt = new Date();
        updates.progress = 100;
      }
      if (body.status === 'IN_PROGRESS' && task.progress === 0) {
        updates.progress = 25;
      }
    }
    if (body.progress !== undefined) {
      updates.progress = Math.min(100, Math.max(0, parseInt(String(body.progress)) || 0));
      if (updates.progress === 100 && updates.status !== 'COMPLETED') {
        updates.status = 'COMPLETED';
        updates.completedAt = new Date();
      }
    }
    if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.startDate !== undefined) updates.startDate = body.startDate ? new Date(body.startDate) : null;

    const updatedTask = await prisma.staffTask.update({
      where: { id },
      data: updates,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        department: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'টাস্ক সফলভাবে আপডেট হয়েছে।',
      data: updatedTask,
    });
  } catch (error: any) {
    console.error('Task PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'টাস্ক আপডেটে ত্রুটি হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { id } = params;
    await prisma.staffTask.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'টাস্ক সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Task DELETE Error:', error);
    return NextResponse.json({ success: false, error: 'টাস্ক মুছতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

