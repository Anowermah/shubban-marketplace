import { NextRequest, NextResponse } from 'next/server';
import { getVerifiedSessionUser, isAdmin, isStaff } from '@/lib/auth';
import { mediaService } from '@/lib/media/media-service';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user || (!isAdmin(user.role) && !isStaff(user.role))) {
      return NextResponse.json({ success: false, error: 'অনুমতি নেই' }, { status: 403 });
    }

    const restored = await mediaService.restoreAsset(params.id, user.name || user.email);

    return NextResponse.json({
      success: true,
      message: 'মিডিয়া ফাইলটি সফলভাবে ট্র্যাশ থেকে পুনরুদ্ধার করা হয়েছে।',
      asset: restored,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

