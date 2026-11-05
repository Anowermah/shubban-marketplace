import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';
import { validateDestinationUrl } from '@/lib/ads/creative-validator';

export const dynamic = 'force-dynamic';

export async function GET() {
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
      return NextResponse.json({ success: true, creatives: [] });
    }

    const creatives = await prisma.adCreative.findMany({
      where: { advertiserId: advertiser.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { impressions: true, clicks: true } },
      },
    });

    return NextResponse.json({ success: true, creatives });
  } catch (err: any) {
    console.error('Error fetching advertiser creatives:', err);
    return NextResponse.json({ error: 'বিজ্ঞাপন ফাইল লোড করা সম্ভব হয়নি।' }, { status: 500 });
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
    const { name, format, mediaUrl, headline, description, ctaText, destinationUrl, altText } = body;

    if (!name || !mediaUrl || !destinationUrl) {
      return NextResponse.json({ error: 'ব্যানার নাম, ছবি এবং গন্তব্য লিঙ্ক আবশ্যক।' }, { status: 400 });
    }

    // Validate destination URL
    const urlCheck = validateDestinationUrl(destinationUrl);
    if (!urlCheck.valid || !urlCheck.cleanUrl) {
      return NextResponse.json({ error: urlCheck.error || 'অবৈধ ইউআরএল।' }, { status: 400 });
    }

    const creative = await prisma.adCreative.create({
      data: {
        advertiserId: advertiser.id,
        name: name.trim(),
        format: format || 'LEADERBOARD_BANNER',
        mediaUrl: mediaUrl.trim(),
        headline: headline?.trim() || null,
        description: description?.trim() || null,
        ctaText: ctaText?.trim() || 'বিস্তারিত দেখুন',
        destinationUrl: urlCheck.cleanUrl,
        altText: altText?.trim() || name.trim(),
        approvalStatus: 'PENDING_REVIEW', // Mandatory review by admin
      },
    });

    return NextResponse.json({
      success: true,
      creative,
      message: 'বিজ্ঞাপনটি সফলভাবে তৈরি করা হয়েছে। এডমিন পর্যালোচনার পর এটি সক্রিয় হবে।',
    });
  } catch (err: any) {
    console.error('Error creating advertiser creative:', err);
    return NextResponse.json({ error: 'বিজ্ঞাপন তৈরি করতে ব্যর্থ হয়েছে।' }, { status: 500 });
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
    const { id, name, format, mediaUrl, headline, description, ctaText, destinationUrl, altText } = body;

    if (!id) {
      return NextResponse.json({ error: 'ক্রিয়েটিভ আইডি আবশ্যক।' }, { status: 400 });
    }

    // Tenant check
    const creative = await prisma.adCreative.findFirst({
      where: { id, advertiserId: advertiser.id },
    });

    if (!creative) {
      return NextResponse.json({ error: 'বিজ্ঞাপন ফাইল পাওয়া যায়নি বা আপনার অধিকার নেই।' }, { status: 404 });
    }

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name.trim();
    if (format) updateData.format = format;
    if (mediaUrl) updateData.mediaUrl = mediaUrl.trim();
    if (headline !== undefined) updateData.headline = headline?.trim() || null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (ctaText) updateData.ctaText = ctaText.trim();
    if (altText !== undefined) updateData.altText = altText?.trim() || null;

    if (destinationUrl) {
      const urlCheck = validateDestinationUrl(destinationUrl);
      if (!urlCheck.valid || !urlCheck.cleanUrl) {
        return NextResponse.json({ error: urlCheck.error || 'অবৈধ ইউআরএল।' }, { status: 400 });
      }
      updateData.destinationUrl = urlCheck.cleanUrl;
    }

    // If it was rejected, resubmitting puts it back to PENDING_REVIEW
    if (creative.approvalStatus === 'REJECTED' || creative.approvalStatus === 'REVISION_REQUIRED') {
      updateData.approvalStatus = 'PENDING_REVIEW';
      updateData.rejectionReason = null;
    }

    const updated = await prisma.adCreative.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      creative: updated,
      message: 'বিজ্ঞাপন ফাইল সফলভাবে আপডেট করা হয়েছে।',
    });
  } catch (err: any) {
    console.error('Error updating advertiser creative:', err);
    return NextResponse.json({ error: 'বিজ্ঞাপন আপডেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
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
      return NextResponse.json({ error: 'আইডি আবশ্যক।' }, { status: 400 });
    }

    // Tenant check
    const creative = await prisma.adCreative.findFirst({
      where: { id, advertiserId: advertiser.id },
      include: {
        campaignCreatives: {
          include: {
            campaign: { select: { id: true, name: true, status: true } },
          },
        },
      },
    });

    if (!creative) {
      return NextResponse.json({ error: 'বিজ্ঞাপন পাওয়া যায়নি বা আপনার অধিকার নেই।' }, { status: 404 });
    }

    // Check if used in active campaign
    const activeCamp = creative.campaignCreatives.find((cc) => cc.campaign?.status === 'ACTIVE');
    if (activeCamp) {
      return NextResponse.json(
        { error: `এই ব্যানারটি বর্তমানে সক্রিয় ক্যাম্পেইন "${activeCamp.campaign.name}" এ ব্যবহৃত হচ্ছে। প্রথমে ক্যাম্পেইনটি থামান বা পরিবর্তন করুন।` },
        { status: 400 }
      );
    }

    // Clean up links and delete
    await prisma.adCampaignCreative.deleteMany({ where: { creativeId: id } });
    await prisma.adCreative.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'বিজ্ঞাপন ফাইল সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (err: any) {
    console.error('Error deleting advertiser creative:', err);
    return NextResponse.json({ error: 'বিজ্ঞাপন ডিলিট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

