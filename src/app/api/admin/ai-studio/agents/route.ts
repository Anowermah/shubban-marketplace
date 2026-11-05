import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { AiStudioService } from '@/lib/ai/ai-studio-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const agents = await AiStudioService.getRegisteredAgents();
    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list agents' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { key, enabled } = body;

    if (!key || typeof enabled !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 });
    }

    const updated = await AiStudioService.toggleAgent(key, enabled);
    return NextResponse.json({ success: true, agent: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update agent' },
      { status: 500 }
    );
  }
}

