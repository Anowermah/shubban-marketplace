import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedSessionUser, isAdmin, isStaff } from '@/lib/auth';
import { mediaService } from '@/lib/media/media-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user || (!isAdmin(user.role) && !isStaff(user.role))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await mediaService.getDashboardStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

