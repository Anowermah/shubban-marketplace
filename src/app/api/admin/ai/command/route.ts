import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { AiOrchestrator } from '@/lib/ai/ai-orchestrator';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ — অ্যাডমিন অনুমতি আবশ্যক' }, { status: 403 });
    }

    const body = await req.json();
    const { conversationId, command } = body;

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'নির্দেশনা প্রদান করা হয়নি' }, { status: 400 });
    }

    const result = await AiOrchestrator.processCommand({
      conversationId: conversationId || `conv_${Date.now()}`,
      command,
      userId: session.id,
      userRole: session.role,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Command Error:', error);
    return NextResponse.json({ error: error.message || 'AI কমান্ড প্রক্রিয়া করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

