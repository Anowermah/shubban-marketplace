import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import { invalidateAdsCache } from '@/lib/ads/ad-serving-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const placements = await prisma.adPlacement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            campaignPlacements: true,
            impressions: true,
            clicks: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, placements });
  } catch (err: any) {
    console.error('Error fetching admin ad placements:', err);
    return NextResponse.json({ error: 'প্লেসমেন্ট লোড করা সম্ভব হয়নি।' }, { status: 500 });
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
      placementKey,
      name,
      description,
      pageType,
      position,
      desktopWidth,
      desktopHeight,
      mobileWidth,
      mobileHeight,
      supportedFormats,
      frequencyCap,
      isLazyLoad,
    } = body;

    if (!placementKey || !name) {
      return NextResponse.json({ error: 'প্লেসমেন্ট কী এবং নাম আবশ্যক।' }, { status: 400 });
    }

    // Check unique key
    const existing = await prisma.adPlacement.findUnique({ where: { placementKey } });
    if (existing) {
      return NextResponse.json({ error: 'এই প্লেসমেন্ট কী পূর্বেই ব্যবহৃত হয়েছে।' }, { status: 409 });
    }

    const placement = await prisma.adPlacement.create({
      data: {
        placementKey: placementKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        name: name.trim(),
        description: description?.trim(),
        pageType: pageType || 'HOME',
        position: position || 'TOP',
        desktopWidth: Number(desktopWidth) || 728,
        desktopHeight: Number(desktopHeight) || 90,
        mobileWidth: Number(mobileWidth) || 320,
        mobileHeight: Number(mobileHeight) || 50,
        supportedFormats: typeof supportedFormats === 'string' ? supportedFormats : JSON.stringify(supportedFormats || ['LEADERBOARD_BANNER']),
        frequencyCap: Number(frequencyCap) || 5,
        isLazyLoad: isLazyLoad !== undefined ? Boolean(isLazyLoad) : true,
        status: 'ACTIVE',
      },
    });

    invalidateAdsCache();

    return NextResponse.json({ success: true, placement });
  } catch (err: any) {
    console.error('Error creating ad placement:', err);
    return NextResponse.json({ error: 'প্লেসমেন্ট তৈরি করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, isBlocked, name, description, frequencyCap, desktopWidth, desktopHeight } = body;

    if (!id) {
      return NextResponse.json({ error: 'প্লেসমেন্ট আইডি আবশ্যক।' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (isBlocked !== undefined) updateData.isBlocked = Boolean(isBlocked);
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (frequencyCap !== undefined) updateData.frequencyCap = Number(frequencyCap);
    if (desktopWidth !== undefined) updateData.desktopWidth = Number(desktopWidth);
    if (desktopHeight !== undefined) updateData.desktopHeight = Number(desktopHeight);

    const placement = await prisma.adPlacement.update({
      where: { id },
      data: updateData,
    });

    invalidateAdsCache(placement.placementKey);

    return NextResponse.json({ success: true, placement });
  } catch (err: any) {
    console.error('Error updating placement:', err);
    return NextResponse.json({ error: 'প্লেসমেন্ট আপডেট ব্যর্থ হয়েছে।' }, { status: 500 });
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

    const placement = await prisma.adPlacement.findUnique({
      where: { id },
      include: {
        campaignPlacements: {
          include: { campaign: true },
        },
      },
    });

    if (!placement) {
      return NextResponse.json({ error: 'প্লেসমেন্ট পাওয়া যায়নি।' }, { status: 404 });
    }

    const hasActiveCampaign = placement.campaignPlacements.some(
      (cp) => cp.campaign && cp.campaign.status === 'ACTIVE'
    );
    if (hasActiveCampaign) {
      return NextResponse.json(
        { error: 'এই প্লেসমেন্টে সক্রিয় ক্যাম্পেইন যুক্ত থাকায় মুছে ফেলা যাবে না। নিষ্ক্রিয় করুন।' },
        { status: 400 }
      );
    }

    await prisma.adPlacement.delete({ where: { id } });
    invalidateAdsCache(placement.placementKey);

    return NextResponse.json({ success: true, message: 'প্লেসমেন্ট মুছে ফেলা হয়েছে।' });
  } catch (err: any) {
    console.error('Error deleting placement:', err);
    return NextResponse.json({ error: 'প্লেসমেন্ট ডিলিট করা সম্ভব হয়নি।' }, { status: 500 });
  }
}

