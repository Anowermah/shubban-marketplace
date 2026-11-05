import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin, isStaff } from '@/lib/auth';
import { mediaService } from '@/lib/media/media-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getVerifiedSessionUser();
    if (!user || (!isAdmin(user.role) && !isStaff(user.role))) {
      return NextResponse.json({ success: false, error: 'অনুমতি নেই' }, { status: 403 });
    }

    const { action, assetIds, folderId } = await req.json();

    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return NextResponse.json({ success: false, error: 'কোনো ফাইল নির্বাচন করা হয়নি।' }, { status: 400 });
    }

    let affectedCount = 0;
    const errors: string[] = [];

    if (action === 'MOVE') {
      const result = await prisma.mediaAsset.updateMany({
        where: { id: { in: assetIds } },
        data: { folderId: folderId || null },
      });
      affectedCount = result.count;
    } else if (action === 'TRASH') {
      for (const id of assetIds) {
        try {
          await mediaService.trashAsset(id, user.name || user.email);
          affectedCount++;
        } catch (err: any) {
          errors.push(`ID ${id}: ${err.message}`);
        }
      }
    } else if (action === 'RESTORE') {
      for (const id of assetIds) {
        try {
          await mediaService.restoreAsset(id, user.name || user.email);
          affectedCount++;
        } catch (err: any) {
          errors.push(`ID ${id}: ${err.message}`);
        }
      }
    } else if (action === 'DELETE_PERMANENT') {
      for (const id of assetIds) {
        try {
          await mediaService.permanentDeleteAsset(id, user.name || user.email);
          affectedCount++;
        } catch (err: any) {
          errors.push(`ID ${id}: ${err.message}`);
        }
      }
    } else {
      return NextResponse.json({ success: false, error: 'অবৈধ বালক অ্যাকশন।' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${affectedCount}টি ফাইলে অ্যাকশন সফলভাবে সম্পন্ন হয়েছে।`,
      affectedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

