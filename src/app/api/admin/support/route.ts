import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search } },
        { subject: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
        responses: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'টিকিট লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const { subject, category, priority, message, orderId, targetUserId } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'বিষয় এবং বার্তা আবশ্যক।' }, { status: 400 });
    }

    const count = await prisma.supportTicket.count();
    const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newTicket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        userId: targetUserId || user.id,
        subject,
        category: category || 'GENERAL',
        priority: priority || 'MEDIUM',
        status: 'OPEN',
        message,
        orderId: orderId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        responses: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_SUPPORT_TICKET',
        entity: 'SupportTicket',
        entityId: newTicket.id,
        details: JSON.stringify({ ticketNumber, subject }),
      },
    });

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json({ error: 'টিকিট তৈরি করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

