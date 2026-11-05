import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { AiChatService } from '@/lib/ai/ai-chat-service';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const agentKey = searchParams.get('agentKey') || undefined;
    const source = searchParams.get('source') || 'ALL'; // 'AI_STUDIO' | 'ISLAMIC_AI' | 'ALL'
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const studioConvs = await AiChatService.listConversations({
      search,
      agentKey,
      limit,
      offset,
    });

    // Optionally include or preserve Islamic AI conversations
    let islamicConvs: any[] = [];
    if (source === 'ISLAMIC_AI' || source === 'ALL') {
      const islamicList = await prisma.islamicAiConversation.findMany({
        where: search
          ? {
              OR: [
                { title: { contains: search } },
                { messages: { some: { content: { contains: search } } } },
              ],
            }
          : undefined,
        orderBy: { updatedAt: 'desc' },
        take: 15,
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true, sender: true },
          },
        },
      });

      islamicConvs = islamicList.map((ic) => ({
        id: `islamic_${ic.id}`,
        title: ic.title || 'ইসলামিক প্রশ্নোত্তর',
        agentKey: 'islamic-ai',
        mode: 'RAG_GROUNDED',
        isPinned: false,
        isIslamicAi: true,
        originalId: ic.id,
        createdAt: ic.createdAt,
        updatedAt: ic.updatedAt,
        lastMessage: ic.messages[0] ? ic.messages[0].content.slice(0, 80) : null,
      }));
    }

    return NextResponse.json({
      success: true,
      total: studioConvs.total + islamicConvs.length,
      conversations: [...studioConvs.conversations, ...islamicConvs],
    });
  } catch (error: any) {
    console.error('List Conversations Error:', error);
    return NextResponse.json({ error: 'কথোপকথন তালিকা আনতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, title } = body;

    if (!id) {
      return NextResponse.json({ error: 'কথোপকথন আইডি আবশ্যক' }, { status: 400 });
    }

    if (action === 'TOGGLE_PIN') {
      const updated = await AiChatService.togglePinConversation(id);
      return NextResponse.json({ success: true, conversation: updated });
    }

    if (action === 'RENAME' && title) {
      const updated = await AiChatService.renameConversation(id, title);
      return NextResponse.json({ success: true, conversation: updated });
    }

    return NextResponse.json({ error: 'অবৈধ একশন' }, { status: 400 });
  } catch (error: any) {
    console.error('Update Conversation Error:', error);
    return NextResponse.json({ error: error?.message || 'আপডেট করতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'কথোপকথন আইডি আবশ্যক' }, { status: 400 });
    }

    if (id.startsWith('islamic_')) {
      const actualId = id.replace('islamic_', '');
      await prisma.islamicAiConversation.delete({ where: { id: actualId } });
    } else {
      await AiChatService.deleteConversation(id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Conversation Error:', error);
    return NextResponse.json({ error: 'মুছে ফেলতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

