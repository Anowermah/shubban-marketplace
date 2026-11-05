import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const { status, priority, replyMessage } = body;

    let replyCreated = null;
    if (replyMessage && replyMessage.trim()) {
      replyCreated = await prisma.ticketResponse.create({
        data: {
          ticketId: params.id,
          userId: user.id,
          message: replyMessage.trim(),
          isAdmin: true,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        responses: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_SUPPORT_TICKET',
        entity: 'SupportTicket',
        entityId: params.id,
        details: JSON.stringify({ status, priority, replied: !!replyCreated }),
      },
    });

    return NextResponse.json({ success: true, ticket: updatedTicket, reply: replyCreated });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({ error: 'টিকিট আপডেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    await prisma.supportTicket.delete({
      where: { id: params.id },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_SUPPORT_TICKET',
        entity: 'SupportTicket',
        entityId: params.id,
      },
    });

    return NextResponse.json({ success: true, message: 'টিকিট সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return NextResponse.json({ error: 'টিকিট মুছতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

