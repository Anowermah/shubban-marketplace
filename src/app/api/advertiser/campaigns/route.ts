import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';
import { invalidateAdsCache } from '@/lib/ads/ad-serving-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    // Tenant Isolation: Only get advertiser for this session
    const advertiser = await prisma.advertiser.findFirst({
      where: {
        OR: [{ ownerId: session.id }, { members: { some: { userId: session.id } } }],
      },
    });

    if (!advertiser) {
      return NextResponse.json({ success: true, campaigns: [] });
    }

    const campaigns = await prisma.adCampaign.findMany({
      where: { advertiserId: advertiser.id },
      orderBy: { createdAt: 'desc' },
      include: {
        placements: { include: { placement: true } },
        creatives: { include: { creative: true } },
        pricingPackage: true,
        invoices: true,
        _count: { select: { impressions: true, clicks: true } },
      },
    });

    return NextResponse.json({ success: true, campaigns });
  } catch (err: any) {
    console.error('Error fetching advertiser campaigns:', err);
    return NextResponse.json({ error: 'ক্যাম্পেইন লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const advertiser = await prisma.advertiser.findFirst({
      where: {
        OR: [{ ownerId: session.id }, { members: { some: { userId: session.id } } }],
      },
    });

    if (!advertiser) {
      return NextResponse.json({ error: 'বিজ্ঞাপনদাতা প্রোফাইল পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const { name, objective, placementIds, creativeId, packageId, durationDays, agreedPrice, startDate } = body;

    if (!name || !placementIds || !placementIds.length || !creativeId) {
      return NextResponse.json({ error: 'ক্যাম্পেইনের সকল প্রয়োজনীয় তথ্য দিন।' }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const days = Number(durationDays) || 7;
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    const price = Number(agreedPrice) || 2000.0;
    const campaignNumber = `SL-AD-${Date.now().toString().slice(-6)}`;

    // Create campaign
    const campaign = await prisma.adCampaign.create({
      data: {
        campaignNumber,
        advertiserId: advertiser.id,
        name: name.trim(),
        objective: objective || 'BRAND_AWARENESS',
        campaignType: 'BANNER',
        pricingModel: 'FIXED_TENURE',
        pricingPackageId: packageId || null,
        budget: price,
        agreedPrice: price,
        startDate: start,
        endDate: end,
        deliveryPriority: 5,
        frequencyCapPerUser: 5,
        approvalStatus: 'SUBMITTED', // Under review by admin
        status: 'PENDING_APPROVAL',
        billingStatus: 'UNPAID',
        createdById: session.id,
      },
    });

    // Link Placements
    for (const pid of placementIds) {
      await prisma.adCampaignPlacement.create({
        data: { campaignId: campaign.id, placementId: pid },
      });
    }

    // Link Creative
    await prisma.adCampaignCreative.create({
      data: { campaignId: campaign.id, creativeId, weight: 100 },
    });

    // Create Invoice for the campaign
    const invoiceNumber = `INV-AD-${Date.now().toString().slice(-6)}`;
    const invoice = await prisma.adInvoice.create({
      data: {
        invoiceNumber,
        advertiserId: advertiser.id,
        campaignId: campaign.id,
        amount: price,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: price,
        currency: 'BDT',
        status: 'ISSUED',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: `ক্যাম্পেইন: ${name} (${campaignNumber})`,
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
      invoice,
      message: 'ক্যাম্পেইনটি সফলভাবে জমা দেওয়া হয়েছে এবং অনুমোদনের অপেক্ষায় আছে।',
    });
  } catch (err: any) {
    console.error('Error creating advertiser campaign:', err);
    return NextResponse.json({ error: 'ক্যাম্পেইন জমা দিতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const advertiser = await prisma.advertiser.findFirst({
      where: {
        OR: [{ ownerId: session.id }, { members: { some: { userId: session.id } } }],
      },
    });

    if (!advertiser) {
      return NextResponse.json({ error: 'অনুমোদনহীন অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action, name, objective, startDate, endDate, placementIds, creativeId } = body;

    // Verify campaign belongs to this advertiser
    const campaign = await prisma.adCampaign.findFirst({
      where: { id, advertiserId: advertiser.id },
      include: { placements: true, creatives: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'ক্যাম্পেইন পাওয়া যায়নি।' }, { status: 404 });
    }

    // 1. Pause action
    if (action === 'PAUSE') {
      const updated = await prisma.adCampaign.update({
        where: { id },
        data: { status: 'PAUSED', updatedAt: new Date() },
      });
      invalidateAdsCache();
      return NextResponse.json({ success: true, campaign: updated, message: 'ক্যাম্পেইন সাময়িকভাবে স্থগিত করা হয়েছে।' });
    }

    // 2. Resume action
    if (action === 'RESUME') {
      // Cannot resume if not approved or expired
      if (campaign.approvalStatus !== 'APPROVED') {
        return NextResponse.json({ error: 'ক্যাম্পেইন অনুমোদিত না থাকায় চালু করা যাবে না।' }, { status: 400 });
      }
      const updated = await prisma.adCampaign.update({
        where: { id },
        data: { status: 'ACTIVE', updatedAt: new Date() },
      });
      invalidateAdsCache();
      return NextResponse.json({ success: true, campaign: updated, message: 'ক্যাম্পেইন পুনরায় চালু করা হয়েছে।' });
    }

    // 3. Duplicate / Clone action
    if (action === 'DUPLICATE') {
      const newCampNumber = `SL-AD-${Date.now().toString().slice(-6)}`;
      const durationMs = campaign.endDate.getTime() - campaign.startDate.getTime();
      const newStart = new Date();
      const newEnd = new Date(newStart.getTime() + durationMs);

      const cloned = await prisma.adCampaign.create({
        data: {
          campaignNumber: newCampNumber,
          advertiserId: advertiser.id,
          name: `${campaign.name} (কপি)`,
          objective: campaign.objective,
          campaignType: campaign.campaignType,
          pricingModel: campaign.pricingModel,
          pricingPackageId: campaign.pricingPackageId,
          budget: campaign.budget,
          agreedPrice: campaign.agreedPrice,
          startDate: newStart,
          endDate: newEnd,
          deliveryPriority: campaign.deliveryPriority,
          frequencyCapPerUser: campaign.frequencyCapPerUser,
          approvalStatus: 'DRAFT',
          status: 'DRAFT',
          billingStatus: 'UNPAID',
          createdById: session.id,
        },
      });

      // Link same placements
      for (const p of campaign.placements) {
        await prisma.adCampaignPlacement.create({
          data: { campaignId: cloned.id, placementId: p.placementId },
        });
      }

      // Link same creatives
      for (const cr of campaign.creatives) {
        await prisma.adCampaignCreative.create({
          data: { campaignId: cloned.id, creativeId: cr.creativeId, weight: cr.weight },
        });
      }

      return NextResponse.json({
        success: true,
        campaign: cloned,
        message: 'ক্যাম্পেইনটি সফলভাবে ডুপ্লিকেট করা হয়েছে (ড্রাফট হিসেবে সংরক্ষিত)।',
      });
    }

    // 4. Edit details (Allowed when DRAFT, PENDING_APPROVAL, or PAUSED)
    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name.trim();
    if (objective) updateData.objective = objective;
    if (startDate) updateData.startDate = new Date(startDate);
    if (endDate) updateData.endDate = new Date(endDate);

    // If campaign was rejected, editing and submitting resets to PENDING_APPROVAL
    if (action === 'RESUBMIT' || campaign.approvalStatus === 'REJECTED') {
      updateData.approvalStatus = 'SUBMITTED';
      updateData.status = 'PENDING_APPROVAL';
      updateData.rejectionReason = null;
    }

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

    invalidateAdsCache();

    return NextResponse.json({
      success: true,
      campaign: updated,
      message: 'ক্যাম্পেইন তথ্য সফলভাবে হালনাগাদ করা হয়েছে।',
    });
  } catch (err: any) {
    console.error('Error updating campaign state:', err);
    return NextResponse.json({ error: 'ক্যাম্পেইন আপডেট ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const advertiser = await prisma.advertiser.findFirst({
      where: {
        OR: [{ ownerId: session.id }, { members: { some: { userId: session.id } } }],
      },
    });

    if (!advertiser) {
      return NextResponse.json({ error: 'অনুমোদনহীন অনুরোধ।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ক্যাম্পেইন আইডি আবশ্যক।' }, { status: 400 });
    }

    // Tenant check: must belong to this advertiser
    const campaign = await prisma.adCampaign.findFirst({
      where: { id, advertiserId: advertiser.id },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'ক্যাম্পেইনটি পাওয়া যায়নি বা আপনার অধিকার নেই।' }, { status: 404 });
    }

    // Disallow deleting active paid campaigns to protect billing integrity (they can be paused/cancelled)
    if (campaign.status === 'ACTIVE' && campaign.billingStatus === 'PAID') {
      return NextResponse.json(
        { error: 'চলমান সক্রিয় ক্যাম্পেইন সরাসরি ডিলিট করা যাবে না। প্রথমে সাময়িকভাবে স্থগিত করুন।' },
        { status: 400 }
      );
    }

    // Clean up relations and delete
    await prisma.adCampaignPlacement.deleteMany({ where: { campaignId: id } });
    await prisma.adCampaignCreative.deleteMany({ where: { campaignId: id } });
    await prisma.adDailyMetric.deleteMany({ where: { campaignId: id } });
    await prisma.adCampaign.delete({ where: { id } });

    invalidateAdsCache();

    return NextResponse.json({
      success: true,
      message: 'ক্যাম্পেইনটি সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (err: any) {
    console.error('Error deleting advertiser campaign:', err);
    return NextResponse.json({ error: 'ক্যাম্পেইন ডিলিট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

