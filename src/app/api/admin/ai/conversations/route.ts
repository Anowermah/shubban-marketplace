import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('id');

    if (conversationId) {
      const conversation = await prisma.aiConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              task: {
                include: { steps: true, approval: true },
              },
            },
          },
        },
      });
      return NextResponse.json({ conversation });
    }

    const conversations = await prisma.aiConversation.findMany({
      where: { userId: session.id },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        _count: { select: { messages: true, tasks: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

