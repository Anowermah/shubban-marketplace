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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const approvalStatus = searchParams.get('approvalStatus');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (approvalStatus && approvalStatus !== 'ALL') where.approvalStatus = approvalStatus;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { campaignNumber: { contains: search } },
        { advertiser: { companyName: { contains: search } } },
      ];
    }

    const campaigns = await prisma.adCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        advertiser: { select: { id: true, name: true, companyName: true, email: true } },
        placements: { include: { placement: true } },
        creatives: { include: { creative: true } },
        _count: { select: { impressions: true, clicks: true } },
      },
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    console.error('Error fetching admin ads campaigns:', err);
    return NextResponse.json({ error: 'ক্যাম্পেইন লোড করা সম্ভব হয়নি।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      objective,
      advertiserId,
      placementIds,
      creativeId,
      budget,
      startDate,
      endDate,
      deliveryPriority,
      status,
    } = body;

    if (!name || !advertiserId || !placementIds || !placementIds.length || !creativeId) {
      return NextResponse.json({ error: 'সকল প্রয়োজনীয় তথ্য (নাম, বিজ্ঞাপনদাতা, স্লট, ব্যানার) প্রদান করুন।' }, { status: 400 });
    }

    const campaignNumber = `SL-AD-${Date.now().toString().slice(-6)}`;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 3600000);
    const campaignStatus = status || 'ACTIVE';

    const campaign = await prisma.adCampaign.create({
      data: {
        campaignNumber,
        advertiserId,
        name: name.trim(),
        objective: objective || 'BRAND_AWARENESS',
        campaignType: 'BANNER',
        pricingModel: 'FIXED_TENURE',
        budget: Number(budget) || 2500,
        agreedPrice: Number(budget) || 2500,
        startDate: start,
        endDate: end,
        deliveryPriority: Number(deliveryPriority) || 5,
        frequencyCapPerUser: 5,
        approvalStatus: 'APPROVED',
        status: campaignStatus,
        billingStatus: 'PAID',
        approvedById: operator.id,
        reviewedAt: new Date(),
        createdById: operator.id,
      },
    });

    for (const pid of placementIds) {
      await prisma.adCampaignPlacement.create({
        data: { campaignId: campaign.id, placementId: pid },
      });
    }

    await prisma.adCampaignCreative.create({
      data: { campaignId: campaign.id, creativeId, weight: 100 },
    });

    // Make sure creative is approved
    await prisma.adCreative.update({
      where: { id: creativeId },
      data: { approvalStatus: 'APPROVED', approvedById: operator.id, approvedAt: new Date() },
    });

    invalidateAdsCache();

    // Audit log
    await prisma.adAuditLog.create({
      data: {
        actorId: operator.id,
        actorName: operator.name,
        actorRole: operator.role,
        action: 'CAMPAIGN_CREATED_ADMIN',
        entityType: 'CAMPAIGN',
        entityId: campaign.id,
        details: JSON.stringify({ name, advertiserId, budget }),
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
      message: 'ক্যাম্পেইন সফলভাবে তৈরি ও সক্রিয় করা হয়েছে।',
    });
  } catch (err: any) {
    console.error('Error creating admin campaign:', err);
    return NextResponse.json({ error: 'ক্যাম্পেইন তৈরি করতে ব্যর্থ হয়েছে।' }, { status: 500 });
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
      name,
      budget,
      startDate,
      endDate,
      placementIds,
      creativeId,
      rejectionReason,
      notes,
      deliveryPriority,
      status: explicitStatus,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ক্যাম্পেইন আইডি আবশ্যক।' }, { status: 400 });
    }

    const campaign = await prisma.adCampaign.findUnique({
      where: { id },
      include: { creatives: { include: { creative: true } } },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'ক্যাম্পেইন পাওয়া যায়নি।' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };

    if (action === 'APPROVE') {
      updateData.approvalStatus = 'APPROVED';
      updateData.status = 'ACTIVE';
      updateData.approvedById = operator.id;
      updateData.reviewedAt = new Date();
      updateData.rejectionReason = null;

      // Automatically approve associated creatives if in pending review
      for (const item of campaign.creatives) {
        if (item.creative && item.creative.approvalStatus !== 'APPROVED') {
          await prisma.adCreative.update({
            where: { id: item.creative.id },
            data: { approvalStatus: 'APPROVED', approvedById: operator.id, approvedAt: new Date() },
          });
        }
      }
    } else if (action === 'REJECT') {
      updateData.approvalStatus = 'REJECTED';
      updateData.status = 'CANCELLED';
      updateData.approvedById = operator.id;
      updateData.reviewedAt = new Date();
      updateData.rejectionReason = rejectionReason || 'বিজ্ঞাপন নীতিমালা অনুসরণ করেনি।';
    } else if (action === 'PAUSE') {
      updateData.status = 'PAUSED';
    } else if (action === 'RESUME') {
      updateData.status = 'ACTIVE';
    } else if (action === 'CANCEL') {
      updateData.status = 'CANCELLED';
    }

    // Direct field edits
    if (name) updateData.name = name.trim();
    if (budget !== undefined) updateData.budget = Number(budget) || campaign.budget;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);
    if (explicitStatus) updateData.status = explicitStatus;
    if (deliveryPriority !== undefined) updateData.deliveryPriority = Number(deliveryPriority) || 5;
    if (notes !== undefined) updateData.notes = notes;

    const updated = await prisma.adCampaign.update({
      where: { id },
      data: updateData,
    });

    // Update placements if provided
    if (Array.isArray(placementIds) && placementIds.length > 0) {
      await prisma.adCampaignPlacement.deleteMany({ where: { campaignId: id } });
      for (const pid of placementIds) {
        await prisma.adCampaignPlacement.create({
          data: { campaignId: id, placementId: pid },
        });
      }
    }

    // Update creative if provided
    if (creativeId) {
      await prisma.adCampaignCreative.deleteMany({ where: { campaignId: id } });
      await prisma.adCampaignCreative.create({
        data: { campaignId: id, creativeId, weight: 100 },
      });
    }

    // Invalidate serve cache so delivery changes are instantaneous
    invalidateAdsCache();

    // Audit log
    await prisma.adAuditLog.create({
      data: {
        actorId: operator.id,
        actorName: operator.name,
        actorRole: operator.role,
        action: `CAMPAIGN_${action || 'UPDATED'}`,
        entityType: 'CAMPAIGN',
        entityId: id,
        details: JSON.stringify({ action, reason: rejectionReason, name }),
      },
    });

    return NextResponse.json({ success: true, campaign: updated, message: 'ক্যাম্পেইন সফলভাবে সংরক্ষিত হয়েছে।' });
  } catch (err: any) {
    console.error('Error updating campaign:', err);
    return NextResponse.json({ error: 'ক্যাম্পেইন আপডেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
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

    await prisma.adCampaign.delete({
      where: { id },
    });

    invalidateAdsCache();

    return NextResponse.json({ success: true, message: 'ক্যাম্পেইন মুছে ফেলা হয়েছে।' });
  } catch (err: any) {
    console.error('Error deleting campaign:', err);
    return NextResponse.json({ error: 'ক্যাম্পেইন ডিলিট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

