import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId')?.trim() || '';
    const conversationId = searchParams.get('id')?.trim() || '';

    // If specific conversation requested
    if (conversationId) {
      const conversation = await prisma.islamicAiConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            include: {
              citations: true,
              feedback: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json({ error: 'কথোপকথন পাওয়া যায়নি' }, { status: 404 });
      }

      // Check access permission: must match userId or sessionId
      if (
        (session?.id && conversation.userId && conversation.userId !== session.id) ||
        (!session?.id && conversation.userId)
      ) {
        return NextResponse.json({ error: 'অননুমোদিত কথোপকথন' }, { status: 403 });
      }

      return NextResponse.json({ conversation });
    }

    // List conversations
    const where: any = {};
    if (session?.id) {
      where.userId = session.id;
    } else if (sessionId) {
      where.sessionId = sessionId;
    } else {
      return NextResponse.json({ conversations: [] });
    }

    const conversations = await prisma.islamicAiConversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        mode: true,
        language: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Islamic AI Conversations API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

