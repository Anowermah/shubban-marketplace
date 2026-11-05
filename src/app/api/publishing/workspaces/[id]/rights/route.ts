import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { verifyMagazineAccess } from '@/lib/services/publishingService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const auth = await verifyMagazineAccess(id, user);
    if (!auth.authorized) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    const rights = await prisma.publicationRights.findFirst({
      where: { magazineId: id },
    });

    return NextResponse.json({ success: true, rights });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const auth = await verifyMagazineAccess(id, user);
    if (!auth.authorized || (!auth.isSuperAdmin && auth.role !== 'PUBLICATION_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const {
      rightsHolder,
      publisher,
      licenseType,
      copyrightNotice,
      allowPdfHosting,
      allowArticleDisplay,
      allowDownloads,
      attributionRequirement,
      territory,
      authorizationProofUrl,
      takedownStatus,
      notes,
    } = body;

    const existing = await prisma.publicationRights.findFirst({
      where: { magazineId: id },
    });

    let rights;
    if (existing) {
      rights = await prisma.publicationRights.update({
        where: { id: existing.id },
        data: {
          rightsHolder: rightsHolder ?? existing.rightsHolder,
          publisher: publisher ?? existing.publisher,
          licenseType: licenseType ?? existing.licenseType,
          copyrightNotice: copyrightNotice ?? existing.copyrightNotice,
          allowPdfHosting: allowPdfHosting !== undefined ? Boolean(allowPdfHosting) : existing.allowPdfHosting,
          allowArticleDisplay: allowArticleDisplay !== undefined ? Boolean(allowArticleDisplay) : existing.allowArticleDisplay,
          allowDownloads: allowDownloads !== undefined ? Boolean(allowDownloads) : existing.allowDownloads,
          attributionRequirement: attributionRequirement ?? existing.attributionRequirement,
          territory: territory ?? existing.territory,
          authorizationProofUrl: authorizationProofUrl ?? existing.authorizationProofUrl,
          takedownStatus: takedownStatus ?? existing.takedownStatus,
          notes: notes ?? existing.notes,
        },
      });
    } else {
      rights = await prisma.publicationRights.create({
        data: {
          magazineId: id,
          rightsHolder: rightsHolder || 'লেখক ও প্রকাশনা কর্তৃপক্ষ',
          publisher: publisher || null,
          licenseType: licenseType || 'ALL_RIGHTS_RESERVED',
          copyrightNotice: copyrightNotice || null,
          allowPdfHosting: allowPdfHosting !== undefined ? Boolean(allowPdfHosting) : true,
          allowArticleDisplay: allowArticleDisplay !== undefined ? Boolean(allowArticleDisplay) : true,
          allowDownloads: allowDownloads !== undefined ? Boolean(allowDownloads) : true,
          attributionRequirement: attributionRequirement || null,
          territory: territory || 'GLOBAL',
          authorizationProofUrl: authorizationProofUrl || null,
          takedownStatus: takedownStatus || 'ACTIVE',
          notes: notes || null,
        },
      });
    }

    // Record audit log
    await prisma.publicationAuditLog.create({
      data: {
        magazineId: id,
        userId: user.id,
        userName: user.name || user.email,
        action: 'UPDATE_RIGHTS',
        targetType: 'RIGHTS',
        targetId: rights.id,
        details: JSON.stringify({ licenseType, takedownStatus }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'কপিরাইট ও লাইসেন্স তথ্য সংরক্ষিত হয়েছে',
      rights,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

