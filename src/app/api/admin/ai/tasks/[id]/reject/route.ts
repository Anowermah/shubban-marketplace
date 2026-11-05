import { NextResponse } from 'next/server';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { AiOrchestrator } from '@/lib/ai/ai-orchestrator';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ — অ্যাডমিন অনুমতি আবশ্যক' }, { status: 403 });
    }

    const { id } = params;
    let reason = '';
    try {
      const body = await req.json();
      reason = body.reason;
    } catch {}

    const result = await AiOrchestrator.rejectTask(id, session.id, reason);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Task Reject Error:', error);
    return NextResponse.json({ error: error.message || 'টাস্ক বাতিল করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

