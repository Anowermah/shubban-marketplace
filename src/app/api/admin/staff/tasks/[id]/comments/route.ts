import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MODERATOR'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'অননুমোদিত অ্যাক্সেস' }, { status: 403 });
    }

    const { id: taskId } = params;
    const body = await req.json();
    const { content, attachmentUrl } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'মন্তব্যের বিবরণ আবশ্যক' }, { status: 400 });
    }

    const task = await prisma.staffTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ success: false, error: 'টাস্ক পাওয়া যায়নি।' }, { status: 404 });
    }

    const comment = await prisma.staffTaskComment.create({
      data: {
        taskId,
        authorId: session.id,
        content: content.trim(),
        attachmentUrl: attachmentUrl || null,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'মন্তব্য সফলভাবে যোগ করা হয়েছে।',
      data: comment,
    });
  } catch (error: any) {
    console.error('Task Comment POST Error:', error);
    return NextResponse.json({ success: false, error: 'মন্তব্য যোগ করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

