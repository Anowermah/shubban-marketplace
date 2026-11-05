import { prisma } from '@/lib/prisma';

export interface InitializeMagazineInput {
  title: string;
  titleEn?: string;
  slug?: string;
  publisherId?: string | null;
  categoryId: string;
  frequency?: string; // DAILY, WEEKLY, FORTNIGHTLY, MONTHLY, BIMONTHLY, QUARTERLY, HALFYEARLY, ANNUAL, SPECIAL_EDITION, IRREGULAR, CUSTOM
  description: string;
  coverImage?: string;
  editor?: string;
  editorialMessage?: string;
  language?: string;
  themeColor?: string;
  adminUserId?: string;
  isSubscribable?: boolean;
  singleIssuePrice?: number;
  monthlySubscriptionPrice?: number;
  annualSubscriptionPrice?: number;
  tags?: string;
}

export const FREQUENCIES = [
  { value: 'DAILY', label: 'দৈনিক (Daily)', intervalDays: 1 },
  { value: 'WEEKLY', label: 'সাপ্তাহিক (Weekly)', intervalDays: 7 },
  { value: 'FORTNIGHTLY', label: 'পাক্ষিক (Fortnightly)', intervalDays: 15 },
  { value: 'MONTHLY', label: 'মাসিক (Monthly)', intervalDays: 30 },
  { value: 'BIMONTHLY', label: 'দ্বিমাসিক (Bimonthly)', intervalDays: 60 },
  { value: 'QUARTERLY', label: 'ত্রৈমাসিক (Quarterly)', intervalDays: 90 },
  { value: 'HALFYEARLY', label: 'ষাণ্মাসিক (Half-Yearly)', intervalDays: 180 },
  { value: 'ANNUAL', label: 'বার্ষিক (Annual)', intervalDays: 365 },
  { value: 'SPECIAL_EDITION', label: 'বিশেষ সংখ্যা (Special Edition)', intervalDays: 0 },
  { value: 'IRREGULAR', label: 'অনিয়মিত (Irregular)', intervalDays: 0 },
  { value: 'CUSTOM', label: 'কাস্টম সময়সূচি (Custom)', intervalDays: 0 },
];

export const PUBLICATION_ROLES = [
  { value: 'PUBLICATION_ADMIN', label: 'প্রকাশনা প্রশাসক (Publication Admin)' },
  { value: 'EDITOR_IN_CHIEF', label: 'প্রধান সম্পাদক (Editor-in-Chief)' },
  { value: 'MANAGING_EDITOR', label: 'নির্বাহী সম্পাদক (Managing Editor)' },
  { value: 'SECTION_EDITOR', label: 'বিভাগীয় সম্পাদক (Section Editor)' },
  { value: 'AUTHOR', label: 'লেখক / গবেষক (Author / Researcher)' },
  { value: 'REVIEWER', label: 'পর্যালোচক (Peer Reviewer)' },
  { value: 'PROOFREADER', label: 'প্রুফরিডার (Proofreader)' },
  { value: 'TRANSLATOR', label: 'অনুবাদক (Translator)' },
  { value: 'DESIGNER', label: 'ডিজাইনার (Art & Layout Designer)' },
  { value: 'CONTRIBUTOR', label: 'কন্ট্রিবিউটর (Contributor)' },
  { value: 'ANALYST', label: 'রিডারশিপ অ্যানালিস্ট (Readership Analyst)' },
];

/**
 * Automatically initializes a complete Magazine Workspace in a single safe database transaction.
 */
export async function initializeMagazineWorkspace(input: InitializeMagazineInput, actorId?: string, actorName?: string) {
  const generatedSlug = input.slug?.trim() || input.title
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '') || `magazine-${Date.now()}`;

  const frequency = input.frequency || 'MONTHLY';
  const defaultThemeColor = input.themeColor || '#c59b27';
  const defaultCover = input.coverImage || '/images/hero-1.jpg';

  // Execute workspace creation inside transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Magazine
    const magazine = await tx.magazine.create({
      data: {
        title: input.title,
        titleEn: input.titleEn || null,
        slug: generatedSlug,
        frequency,
        description: input.description,
        coverImage: defaultCover,
        editor: input.editor || null,
        editorialMessage: input.editorialMessage || null,
        language: input.language || 'bn',
        themeColor: defaultThemeColor,
        publisherId: input.publisherId || null,
        categoryId: input.categoryId,
        isSubscribable: Boolean(input.isSubscribable),
        singleIssuePrice: input.singleIssuePrice || 0,
        monthlySubscriptionPrice: input.monthlySubscriptionPrice || 0,
        annualSubscriptionPrice: input.annualSubscriptionPrice || 0,
        tags: input.tags || null,
        status: 'PUBLISHED',
      },
    });

    // 2. Initialize Publication Schedule
    const now = new Date();
    let nextExpectedDate = new Date();
    if (frequency === 'DAILY') nextExpectedDate.setDate(now.getDate() + 1);
    else if (frequency === 'WEEKLY') nextExpectedDate.setDate(now.getDate() + 7);
    else if (frequency === 'FORTNIGHTLY') nextExpectedDate.setDate(now.getDate() + 15);
    else if (frequency === 'MONTHLY') nextExpectedDate.setMonth(now.getMonth() + 1);
    else if (frequency === 'BIMONTHLY') nextExpectedDate.setMonth(now.getMonth() + 2);
    else if (frequency === 'QUARTERLY') nextExpectedDate.setMonth(now.getMonth() + 3);
    else if (frequency === 'HALFYEARLY') nextExpectedDate.setMonth(now.getMonth() + 6);
    else if (frequency === 'ANNUAL') nextExpectedDate.setFullYear(now.getFullYear() + 1);

    await tx.publicationSchedule.create({
      data: {
        magazineId: magazine.id,
        frequency,
        expectedDay: 1,
        nextExpectedDate,
        editorialDeadlineDays: 7,
        numberingScheme: 'VOL_ISSUE',
        timeZone: 'Asia/Dhaka',
        autoReminders: true,
      },
    });

    // 3. Initialize Default Workspace Settings
    const defaultSettings: [string, string][] = [
      ['allowDownload', 'true'],
      ['allowShare', 'true'],
      ['readOnline', 'true'],
      ['requireLogin', 'false'],
      ['watermarkText', input.title],
      ['watermarkEnabled', 'false'],
      ['commentModeration', 'AUTO_APPROVE'],
      ['guestAccessMode', 'FREE_SAMPLE'],
      ['freePreviewPages', '4'],
      ['seoMetaTitle', `${input.title} — ডিজিটাল আর্কাইভ ও পত্রিকা`],
    ];

    for (const [key, value] of defaultSettings) {
      await tx.magazineSetting.create({
        data: {
          magazineId: magazine.id,
          key,
          value,
        },
      });
    }

    // 4. Assign Publisher Admin or Member if user provided
    if (input.adminUserId) {
      await tx.publicationMember.create({
        data: {
          magazineId: magazine.id,
          userId: input.adminUserId,
          role: 'PUBLICATION_ADMIN',
          permissions: JSON.stringify(['ALL_ACCESS']),
          isActive: true,
        },
      });
    }

    // 5. Initialize Subscription Plans if subscribable
    if (input.isSubscribable) {
      if (input.monthlySubscriptionPrice && input.monthlySubscriptionPrice > 0) {
        await tx.publicationSubscriptionPlan.create({
          data: {
            magazineId: magazine.id,
            name: `${input.title} — মাসিক গ্রাহক প্ল্যান`,
            slug: `${generatedSlug}-monthly`,
            durationMonths: 1,
            price: input.monthlySubscriptionPrice,
            description: 'প্রতি মাসে নতুন সংখ্যার তাৎক্ষণিক অ্যাক্সেস',
            features: JSON.stringify(['সকল সংখ্যার অনলাইন রিডিং', 'PDF ডাউনলোড সুবিধা', 'বিজ্ঞাপনমুক্ত পাঠ']),
          },
        });
      }

      if (input.annualSubscriptionPrice && input.annualSubscriptionPrice > 0) {
        await tx.publicationSubscriptionPlan.create({
          data: {
            magazineId: magazine.id,
            name: `${input.title} — বার্ষিক মেম্বারশিপ`,
            slug: `${generatedSlug}-annual`,
            durationMonths: 12,
            price: input.annualSubscriptionPrice,
            originalPrice: (input.monthlySubscriptionPrice || 0) * 12 || undefined,
            isFeatured: true,
            description: '১২ মাসের সকল সংখ্যা ও পূর্ববর্তী আর্কাইভ অ্যাক্সেস',
            features: JSON.stringify(['১২ মাসের সকল সংখ্যা', 'সম্পূর্ণ আর্কাইভ অ্যাক্সেস', 'PDF ডাউনলোড', 'অনলাইন রিডার বুকমার্ক']),
          },
        });
      }
    }

    // 6. Initialize Copyright & Rights Record
    await tx.publicationRights.create({
      data: {
        magazineId: magazine.id,
        rightsHolder: input.editor || input.title,
        publisher: input.publisherId ? 'সংযুক্ত প্রকাশনী' : 'স্বতন্ত্র প্রকাশনা',
        licenseType: 'ALL_RIGHTS_RESERVED',
        copyrightNotice: `© ২০২৬ ${input.title}। সর্বস্বত্ব সংরক্ষিত।`,
        allowPdfHosting: true,
        allowArticleDisplay: true,
        allowDownloads: true,
        attributionRequirement: 'শুব্বান লাইব্রেরী ডিজিটাল প্ল্যাটফর্ম সূত্র উল্লেখ আবশ্যক।',
        territory: 'GLOBAL',
        takedownStatus: 'ACTIVE',
      },
    });

    // 7. Audit Log Entry
    await tx.publicationAuditLog.create({
      data: {
        magazineId: magazine.id,
        publisherId: input.publisherId || null,
        userId: actorId || null,
        userName: actorName || 'System Admin',
        action: 'CREATE',
        targetType: 'MAGAZINE',
        targetId: magazine.id,
        details: JSON.stringify({
          title: input.title,
          frequency,
          slug: generatedSlug,
          workspaceInitialized: true,
        }),
      },
    });

    return magazine;
  });

  return result;
}

/**
 * Server-Side Tenant Authorization Guard
 */
export async function verifyMagazineAccess(magazineId: string, user: { id: string; role: string }) {
  // 1. Super Admins and Platform Admins have full cross-tenant authority
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return {
      authorized: true,
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
      permissions: ['ALL_ACCESS'],
    };
  }

  // 2. Check Publication-level Membership
  const pubMember = await prisma.publicationMember.findUnique({
    where: {
      magazineId_userId: {
        magazineId,
        userId: user.id,
      },
    },
  });

  if (pubMember && pubMember.isActive) {
    let customPerms: string[] = [];
    try {
      customPerms = pubMember.permissions ? JSON.parse(pubMember.permissions) : [];
    } catch (e) {}

    return {
      authorized: true,
      role: pubMember.role,
      isSuperAdmin: false,
      permissions: [pubMember.role, ...customPerms],
    };
  }

  // 3. Check Publisher-level Membership (organization owner/admin)
  const magazine = await prisma.magazine.findUnique({
    where: { id: magazineId },
    select: { publisherId: true },
  });

  if (magazine?.publisherId) {
    const publisherMember = await prisma.publisherMember.findUnique({
      where: {
        publisherId_userId: {
          publisherId: magazine.publisherId,
          userId: user.id,
        },
      },
    });

    if (publisherMember && (publisherMember.role === 'OWNER' || publisherMember.role === 'ADMIN')) {
      return {
        authorized: true,
        role: 'PUBLISHER_ADMIN',
        isSuperAdmin: false,
        permissions: ['ALL_ACCESS', 'PUBLISHER_ADMIN'],
      };
    }
  }

  return {
    authorized: false,
    role: 'UNAUTHORIZED',
    isSuperAdmin: false,
    permissions: [],
  };
}

/**
 * Retrieve all workspaces accessible to a user.
 */
export async function getUserWorkspaces(user: { id: string; role: string }) {
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return prisma.magazine.findMany({
      include: {
        publisher: { select: { id: true, name: true } },
        _count: { select: { issues: true, articles: true } },
      },
      orderBy: { title: 'asc' },
    });
  }

  // Find direct publication memberships
  const directPubs = await prisma.publicationMember.findMany({
    where: { userId: user.id, isActive: true },
    include: {
      magazine: {
        include: {
          publisher: { select: { id: true, name: true } },
          _count: { select: { issues: true, articles: true } },
        },
      },
    },
  });

  // Find publisher memberships
  const publisherMembers = await prisma.publisherMember.findMany({
    where: { userId: user.id, role: { in: ['OWNER', 'ADMIN'] } },
    select: { publisherId: true },
  });

  const publisherIds = publisherMembers.map((p) => p.publisherId);
  const orgPubs = publisherIds.length > 0
    ? await prisma.magazine.findMany({
        where: { publisherId: { in: publisherIds } },
        include: {
          publisher: { select: { id: true, name: true } },
          _count: { select: { issues: true, articles: true } },
        },
      })
    : [];

  // Merge and deduplicate by ID
  const map = new Map<string, any>();
  directPubs.forEach((dp) => map.set(dp.magazine.id, dp.magazine));
  orgPubs.forEach((op) => map.set(op.id, op));

  return Array.from(map.values());
}

