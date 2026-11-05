import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import { invalidateAdsCache } from '@/lib/ads/ad-serving-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status && status !== 'ALL') {
      where.approvalStatus = status;
    }

    const creatives = await prisma.adCreative.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        advertiser: { select: { id: true, name: true, companyName: true, email: true } },
        approvedBy: { select: { id: true, name: true } },
        _count: { select: { impressions: true, clicks: true, campaignCreatives: true } },
      },
    });

    return NextResponse.json({ success: true, creatives });
  } catch (err: any) {
    console.error('Error fetching admin creatives:', err);
    return NextResponse.json({ error: 'বিজ্ঞাপনের ফাইল লোড ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      id,
      action,
      rejectionReason,
      reviewNotes,
      name,
      headline,
      description,
      ctaText,
      destinationUrl,
      mediaUrl,
      format,
      altText,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ক্রিয়েটিভ আইডি আবশ্যক।' }, { status: 400 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (action === 'APPROVE') {
      updateData.approvalStatus = 'APPROVED';
      updateData.approvedById = operator.id;
      updateData.approvedAt = new Date();
      updateData.rejectionReason = null;
    } else if (action === 'REJECT') {
      updateData.approvalStatus = 'REJECTED';
      updateData.approvedById = operator.id;
      updateData.approvedAt = new Date();
      updateData.rejectionReason = rejectionReason || 'বিজ্ঞাপন নীতিমালা ভঙ্গ করেছে।';
    } else if (action === 'REQUEST_REVISION') {
      updateData.approvalStatus = 'REVISION_REQUIRED';
      updateData.rejectionReason = rejectionReason || 'সংশোধন প্রয়োজন।';
    }

    if (name) updateData.name = name.trim();
    if (format) updateData.format = format;
    if (mediaUrl) updateData.mediaUrl = mediaUrl.trim();
    if (headline !== undefined) updateData.headline = headline?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (ctaText) updateData.ctaText = ctaText.trim();
    if (destinationUrl) updateData.destinationUrl = destinationUrl.trim();
    if (altText !== undefined) updateData.altText = altText?.trim() || null;
    if (reviewNotes !== undefined) updateData.reviewNotes = reviewNotes;

    const updated = await prisma.adCreative.update({
      where: { id },
      data: updateData,
    });

    invalidateAdsCache();

    // Audit log
    await prisma.adAuditLog.create({
      data: {
        actorId: operator.id,
        actorName: operator.name,
        actorRole: operator.role,
        action: `CREATIVE_${action}`,
        entityType: 'CREATIVE',
        entityId: id,
        details: JSON.stringify({ action, reason: rejectionReason }),
      },
    });

    return NextResponse.json({ success: true, creative: updated });
  } catch (err: any) {
    console.error('Error reviewing creative:', err);
    return NextResponse.json({ error: 'ক্রিয়েটিভ রিভিউ সম্পন্ন করা সম্ভব হয়নি।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'আইডি আবশ্যক।' }, { status: 400 });
    }

    await prisma.adCreative.delete({ where: { id } });
    invalidateAdsCache();

    return NextResponse.json({ success: true, message: 'বিজ্ঞাপন ফাইল মুছে ফেলা হয়েছে।' });
  } catch (err: any) {
    console.error('Error deleting creative:', err);
    return NextResponse.json({ error: 'ক্রিয়েটিভ ডিলিট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

