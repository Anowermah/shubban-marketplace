const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Upserting edu placement...');
  const placement = await prisma.adPlacement.upsert({
    where: { placementKey: 'edu_floating_popup' },
    update: {
      name: 'শিক্ষা প্রতিষ্ঠান ও ভর্তি নোটিশ (Educational Floating Card)',
      description: 'মাদ্রাসা, ইসলামিক একাডেমি ও শিক্ষা প্রতিষ্ঠানের ভর্তি ও কোর্স বিজ্ঞপ্তির জন্য স্ক্রিনের কোণায় শান্ত ও সহজে স্কিপযোগ্য কার্ড।',
      pageType: 'GLOBAL',
      position: 'BOTTOM_CORNER',
      desktopWidth: 340,
      desktopHeight: 140,
      mobileWidth: 320,
      mobileHeight: 120,
      supportedFormats: JSON.stringify(['FLOATING_CORNER', 'NATIVE_AD', 'ANNOUNCEMENT', 'RESPONSIVE_BANNER']),
      status: 'ACTIVE',
    },
    create: {
      placementKey: 'edu_floating_popup',
      name: 'শিক্ষা প্রতিষ্ঠান ও ভর্তি নোটিশ (Educational Floating Card)',
      description: 'মাদ্রাসা, ইসলামিক একাডেমি ও শিক্ষা প্রতিষ্ঠানের ভর্তি ও কোর্স বিজ্ঞপ্তির জন্য স্ক্রিনের কোণায় শান্ত ও সহজে স্কিপযোগ্য কার্ড।',
      pageType: 'GLOBAL',
      position: 'BOTTOM_CORNER',
      desktopWidth: 340,
      desktopHeight: 140,
      mobileWidth: 320,
      mobileHeight: 120,
      supportedFormats: JSON.stringify(['FLOATING_CORNER', 'NATIVE_AD', 'ANNOUNCEMENT', 'RESPONSIVE_BANNER']),
      status: 'ACTIVE',
    },
  });
  console.log('Placement key:', placement.placementKey, 'ID:', placement.id);

  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
  });

  if (!adminUser) {
    console.error('No admin user found');
    return;
  }

  // Check or create advertiser
  let advertiser = await prisma.advertiser.findFirst({
    where: { companyName: { contains: 'মাদরাসা' } },
  });

  if (!advertiser) {
    advertiser = await prisma.advertiser.create({
      data: {
        owner: { connect: { id: adminUser.id } },
        name: 'মারকাযুত তারবিয়াহ একাডেমি',
        slug: 'markazut-tarbiyah-academy',
        companyName: 'মারকাযুত তারবিয়াহ মাদরাসা ও ইসলামিক একাডেমি',
        email: 'admission@tarbiyah-edu.bd',
        phone: '01712000000',
        status: 'ACTIVE',
        verifiedAt: new Date(),
      },
    });
    console.log('Created advertiser:', advertiser.name);
  }

  // Update existing campaigns to billingStatus PAID
  await prisma.adCampaign.updateMany({
    where: { name: { contains: 'ভর্তি' } },
    data: { billingStatus: 'PAID', status: 'ACTIVE', approvalStatus: 'APPROVED' },
  });

  // Check or create campaign
  let campaign = await prisma.adCampaign.findFirst({
    where: { advertiserId: advertiser.id, name: { contains: 'ভর্তি' } },
  });

  if (!campaign) {
    campaign = await prisma.adCampaign.create({
      data: {
        advertiser: { connect: { id: advertiser.id } },
        createdBy: { connect: { id: adminUser.id } },
        name: 'নতুন শিক্ষাবর্ষে হিফজ ও আলিম কোর্সে ভর্তি ২০২৬',
        campaignNumber: 'SL-AD-EDU-001',
        campaignType: 'NATIVE',
        pricingModel: 'CPC',
        budget: 3000,
        agreedPrice: 3000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        deliveryPriority: 8,
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
        reviewedAt: new Date(),
      },
    });
    console.log('Created campaign:', campaign.name);
  }

  // Link campaign to placement
  const existingLink = await prisma.adCampaignPlacement.findFirst({
    where: { campaignId: campaign.id, placementId: placement.id },
  });

  if (!existingLink) {
    await prisma.adCampaignPlacement.create({
      data: {
        campaignId: campaign.id,
        placementId: placement.id,
      },
    });
    console.log('Linked campaign to placement');
  }

  // Create creative
  let creative = await prisma.adCreative.findFirst({
    where: { advertiserId: advertiser.id, format: 'FLOATING_CORNER' },
  });

  if (!creative) {
    creative = await prisma.adCreative.create({
      data: {
        advertiser: { connect: { id: advertiser.id } },
        name: 'ভর্তি নোটিশ ফ্লোটিং কার্ড',
        format: 'FLOATING_CORNER',
        approvalStatus: 'APPROVED',
        headline: 'মারকাযুত তারবিয়াহ মাদরাসায় নতুন শিক্ষাবর্ষে ভর্তি চলছে',
        description: 'হিফজুল কুরআন, কাওমি নেসাবের দ্বীনি শিক্ষা ও আরবি ভাষা শিক্ষা। সীমিত আসন, অনলাইনে আবেদন করুন।',
        ctaText: 'ভর্তি তথ্য দেখুন',
        destinationUrl: 'https://atrbd.com/courses',
        mediaUrl: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=400&q=80',
        altText: 'মাদরাসা ভর্তি বিজ্ঞপ্তি',
        approvedAt: new Date(),
      },
    });
    console.log('Created creative:', creative.name);
  }

  // Link creative to campaign
  const existingCampCreative = await prisma.adCampaignCreative.findFirst({
    where: { campaignId: campaign.id, creativeId: creative.id },
  });

  if (!existingCampCreative) {
    await prisma.adCampaignCreative.create({
      data: {
        campaignId: campaign.id,
        creativeId: creative.id,
        weight: 100,
      },
    });
    console.log('Linked creative to campaign');
  }

  console.log('All educational ad seed done successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
