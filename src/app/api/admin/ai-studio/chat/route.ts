import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { AiChatService } from '@/lib/ai/ai-chat-service';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ — অ্যাডমিন অনুমতি আবশ্যক' }, { status: 403 });
    }

    const body = await req.json();
    const { conversationId, message, mode, agentKey, magazineId } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'বার্তা বা প্রশ্ন প্রদান করা আবশ্যক' }, { status: 400 });
    }

    const result = await AiChatService.sendMessage({
      conversationId,
      message,
      mode: mode === 'MANUAL' ? 'MANUAL' : 'AUTO',
      agentKey,
      userId: session.id,
      magazineId,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('AI Studio Chat Error:', error);
    return NextResponse.json(
      { error: error?.message || 'এআই চ্যাট প্রসেস করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ error: 'কথোপকথন আইডি আবশ্যক' }, { status: 400 });
    }

    const data = await AiChatService.getConversationMessages(conversationId);
    if (!data) {
      return NextResponse.json({ error: 'কথোপকথন পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: data,
    });
  } catch (error: any) {
    console.error('Fetch Conversation Error:', error);
    return NextResponse.json({ error: 'কথোপকথন লোড করতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

