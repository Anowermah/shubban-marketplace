import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const existing = await prisma.donationCampaign.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ক্যাম্পেইনটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const body = await req.json();
    const { title, category, goalAmount, description, coverImage, status, isFeatured } = body;

    const updateData: any = {};
    if (typeof title === 'string' && title.trim()) {
      updateData.title = title.trim();
    }
    if (typeof category === 'string' && category.trim()) {
      updateData.category = category.trim();
    }
    if (goalAmount !== undefined) {
      const parsedGoal = parseFloat(goalAmount);
      if (!isNaN(parsedGoal) && parsedGoal > 0) {
        updateData.goalAmount = parsedGoal;
      }
    }
    if (typeof description === 'string') {
      updateData.description = description.trim();
    }
    if (typeof coverImage === 'string' && coverImage.trim()) {
      updateData.coverImage = coverImage.trim();
    }
    if (typeof status === 'string' && status.trim()) {
      updateData.status = status.trim();
    }
    if (typeof isFeatured === 'boolean') {
      updateData.isFeatured = isFeatured;
    }

    const updated = await prisma.donationCampaign.update({
      where: { id: params.id },
      data: updateData,
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'DONATION_CAMPAIGN_UPDATED',
          entity: 'DonationCampaign',
          entityId: params.id,
          details: JSON.stringify({
            title: updated.title,
            updatedFields: Object.keys(updateData),
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `ক্যাম্পেইন "${updated.title}" সফলভাবে হালনাগাদ করা হয়েছে!`,
      campaign: updated,
    });
  } catch (error: any) {
    console.error('Error updating donation campaign:', error);
    return NextResponse.json({ error: 'ক্যাম্পেইন হালনাগাদ করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const existing = await prisma.donationCampaign.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { donations: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ক্যাম্পেইনটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // If campaign already collected money, block hard deletion to protect financial ledger
    if (existing.raisedAmount > 0 || existing._count.donations > 0) {
      // Instead of deleting financial records, set status to ARCHIVED / PAUSED
      await prisma.donationCampaign.update({
        where: { id: params.id },
        data: { status: 'PAUSED', isFeatured: false },
      });

      return NextResponse.json({
        success: true,
        message: `ক্যাম্পেইনে ইতিমধ্যে অনুদান সংগৃহীত হওয়ায় আর্থিক নিরাপত্তার স্বার্থে এটি সম্পূর্ণ না মুছে সাময়িকভাবে নিষ্ক্রিয় (PAUSED) ও আর্কাইভ করা হয়েছে।`,
        archived: true,
      });
    }

    // If no donations were raised, safely delete completely
    await prisma.donationCampaign.delete({
      where: { id: params.id },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'DONATION_CAMPAIGN_DELETED',
          entity: 'DonationCampaign',
          entityId: params.id,
          details: JSON.stringify({
            title: existing.title,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `ক্যাম্পেইন "${existing.title}" সফলভাবে মুছে ফেলা হয়েছে!`,
      deleted: true,
    });
  } catch (error: any) {
    console.error('Error deleting donation campaign:', error);
    return NextResponse.json({ error: 'ক্যাম্পেইন মুছতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

