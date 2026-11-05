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
    const result = await AiOrchestrator.rollbackTask(id, session.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Task Rollback Error:', error);
    return NextResponse.json({ error: error.message || 'রোলব্যাক করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

