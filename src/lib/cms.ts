import { prisma } from './prisma';

export interface CreateArticleInput {
  title: string;
  slug?: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  type?: 'ESSAY' | 'EDITORIAL' | 'REVIEW' | 'INTERVIEW' | 'RESEARCH_SUMMARY';
  status?: 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  authorId: string;
  categoryId: string;
  tags?: string[];
  readingTime?: number;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  scheduledAt?: Date | string;
}

export interface CreateIssueInput {
  magazineId: string;
  issueTitle: string;
  volume?: string;
  issueNumber?: string;
  publicationDate: Date | string;
  coverImage: string;
  pdfUrl: string;
  authorizedPdfUrl?: string;
  allowDownload?: boolean;
  requireLogin?: boolean;
  fileSize?: string;
  summary?: string;
  toc?: string;
  isFree?: boolean;
  price?: number;
}

export interface CreateResourceInput {
  title: string;
  titleEn?: string;
  slug?: string;
  topic:
  | 'AQEEDAH'
  | 'FIQH'
  | 'TAFSEER'
  | 'HADITH'
  | 'SEERAH'
  | 'ARABIC_LANGUAGE'
  | 'TAJWEED'
  | 'CONTEMPORARY';
  category:
  | 'EBOOK'
  | 'AUDIO_LECTURE'
  | 'INFOGRAPHIC'
  | 'RESEARCH_PAPER'
  | 'WORKSHEET'
  | 'CURRICULUM';
  description: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: string;
  authorName?: string;
  publisher?: string;
  language?: string;
  isFeatured?: boolean;
  isFree?: boolean;
}

// ==========================================
// ARTICLE CMS ENGINE
// ==========================================

export async function createArticle(input: CreateArticleInput, creatorUserId: string) {
  const {
    title,
    slug,
    content,
    excerpt,
    coverImage,
    type = 'ESSAY',
    status = 'PUBLISHED',
    authorId,
    categoryId,
    tags,
    readingTime = 5,
    isFeatured = false,
    metaTitle,
    metaDescription,
    canonicalUrl,
    scheduledAt,
  } = input;

  const articleSlug =
    slug ||
    `${title
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, '-')
      .slice(0, 60)}-${Date.now().toString().slice(-4)}`;

  const isScheduled = status === 'SCHEDULED' && scheduledAt;
  const isPublishedDirectly = status === 'PUBLISHED';

  return await prisma.$transaction(async (tx) => {
    const article = await tx.article.create({
      data: {
        title,
        slug: articleSlug,
        content,
        excerpt,
        coverImage: coverImage || '/placeholder.jpg',
        type,
        status,
        authorId,
        categoryId,
        readingTime,
        isFeatured,
        tags: tags ? JSON.stringify(tags) : null,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt.slice(0, 160),
        canonicalUrl: canonicalUrl || null,
        scheduledAt: isScheduled ? new Date(scheduledAt) : null,
        publishedAt: isPublishedDirectly ? new Date() : new Date(),
        approvedBy: isPublishedDirectly ? creatorUserId : null,
        approvedAt: isPublishedDirectly ? new Date() : null,
      },
      include: {
        author: true,
        category: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: creatorUserId,
        action: 'ARTICLE_CREATED',
        entity: 'Article',
        entityId: article.id,
        details: JSON.stringify({ title, status, slug: articleSlug }),
      },
    });

    return article;
  });
}

export async function approveArticle(articleId: string, approverUserId: string) {
  return await prisma.$transaction(async (tx) => {
    const article = await tx.article.update({
      where: { id: articleId },
      data: {
        status: 'PUBLISHED',
        approvedBy: approverUserId,
        approvedAt: new Date(),
        publishedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        userId: approverUserId,
        action: 'ARTICLE_APPROVED',
        entity: 'Article',
        entityId: article.id,
        details: JSON.stringify({ title: article.title, status: 'PUBLISHED' }),
      },
    });

    return article;
  });
}

export async function getArticles(params: {
  categorySlug?: string;
  tag?: string;
  status?: string;
  search?: string;
  isFeatured?: boolean;
  take?: number;
  skip?: number;
}) {
  const { categorySlug, tag, status = 'PUBLISHED', search, isFeatured, take = 20, skip = 0 } = params;

  const where: any = {
    ...(status && status !== 'ALL' ? { status } : {}),
    ...(isFeatured !== undefined ? { isFeatured } : {}),
  };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (tag) {
    where.tags = { contains: tag };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { excerpt: { contains: search } },
      { content: { contains: search } },
    ];
  }

  const [count, articles] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, slug: true, photoUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return { count, articles };
}

// ==========================================
// MAGAZINE & PUBLICATION ISSUES ENGINE
// ==========================================

export async function createMagazineIssue(input: CreateIssueInput, creatorUserId: string) {
  const {
    magazineId,
    issueTitle,
    volume,
    issueNumber,
    publicationDate,
    coverImage,
    pdfUrl,
    authorizedPdfUrl,
    allowDownload = true,
    requireLogin = false,
    fileSize,
    summary,
    toc,
    isFree = false,
    price = 0,
  } = input;

  return await prisma.$transaction(async (tx) => {
    const issue = await tx.publicationIssue.create({
      data: {
        magazineId,
        issueTitle,
        volume: volume || null,
        issueNumber: issueNumber || null,
        publicationDate: new Date(publicationDate),
        coverImage: coverImage || '/placeholder.jpg',
        pdfUrl,
        authorizedPdfUrl: authorizedPdfUrl || pdfUrl,
        allowDownload,
        requireLogin,
        fileSize: fileSize || '15 MB',
        summary: summary || null,
        toc: toc || null,
        isFree,
        price: isFree ? 0 : price,
        approvedBy: creatorUserId,
        approvedAt: new Date(),
      },
      include: { magazine: true },
    });

    await tx.auditLog.create({
      data: {
        userId: creatorUserId,
        action: 'PUBLICATION_ISSUE_CREATED',
        entity: 'PublicationIssue',
        entityId: issue.id,
        details: JSON.stringify({ issueTitle, magazineId, isFree, price }),
      },
    });

    return issue;
  });
}

export async function verifyPublicationAccess(params: {
  issueId: string;
  userId?: string | null;
  userRole?: string | null;
}) {
  const { issueId, userId, userRole } = params;

  const issue = await prisma.publicationIssue.findUnique({
    where: { id: issueId },
    include: { magazine: true },
  });

  if (!issue) {
    throw new Error('সাময়িকী সংখ্যা পাওয়া যায়নি।');
  }

  // Free issue: public read access
  if (issue.isFree) {
    return {
      allowed: true,
      canDownload: issue.allowDownload,
      pdfUrl: issue.authorizedPdfUrl || issue.pdfUrl,
      reason: 'ফ্রি উন্মুক্ত প্রকাশনা',
    };
  }

  // Admins & Editors always have full access
  if (userRole && ['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(userRole)) {
    return {
      allowed: true,
      canDownload: true,
      pdfUrl: issue.authorizedPdfUrl || issue.pdfUrl,
      reason: 'অ্যাডমিন/সম্পাদকীয় অধিকার',
    };
  }

  if (!userId) {
    return {
      allowed: false,
      canDownload: false,
      reason: 'এই প্রকাশনাটি পড়ার জন্য অ্যাকাউন্টে লগইন করা আবশ্যক।',
    };
  }

  // Check digital entitlement / purchase
  const entitlement = await prisma.digitalEntitlement.findFirst({
    where: {
      userId,
      issueId,
      expiresAt: { gt: new Date() },
    },
  });

  if (entitlement) {
    return {
      allowed: true,
      canDownload: issue.allowDownload,
      pdfUrl: issue.authorizedPdfUrl || issue.pdfUrl,
      reason: 'ডিজিটাল সাবস্ক্রিপশন / পারচেজ ভেরিফায়েড',
    };
  }

  return {
    allowed: false,
    canDownload: false,
    reason: `এই সাময়িকীটি পড়ার জন্য ৳${issue.price} মূল্যে সাবস্ক্রিপশন গ্রহণ করুন।`,
  };
}

// ==========================================
// ISLAMIC RESOURCES ENGINE
// ==========================================

export async function createIslamicResource(input: CreateResourceInput, creatorUserId: string) {
  const {
    title,
    titleEn,
    slug,
    topic,
    category,
    description,
    fileUrl,
    fileType = 'PDF',
    fileSize,
    authorName,
    publisher,
    language = 'bn',
    isFeatured = false,
    isFree = true,
  } = input;

  const resourceSlug =
    slug ||
    `${title
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, '-')
      .slice(0, 50)}-${Date.now().toString().slice(-4)}`;

  return await prisma.$transaction(async (tx) => {
    const resource = await tx.islamicResource.create({
      data: {
        title,
        titleEn: titleEn || null,
        slug: resourceSlug,
        topic,
        category,
        description,
        fileUrl: fileUrl || null,
        fileType,
        fileSize: fileSize || null,
        authorName: authorName || null,
        publisher: publisher || null,
        language,
        isFeatured,
        isFree,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: creatorUserId,
        action: 'ISLAMIC_RESOURCE_CREATED',
        entity: 'IslamicResource',
        entityId: resource.id,
        details: JSON.stringify({ title, topic, category }),
      },
    });

    return resource;
  });
}

export async function getIslamicResources(params: {
  topic?: string;
  category?: string;
  language?: string;
  search?: string;
  isFeatured?: boolean;
  take?: number;
  skip?: number;
}) {
  const { topic, category, language, search, isFeatured, take = 30, skip = 0 } = params;

  const where: any = {
    ...(topic && topic !== 'ALL' ? { topic } : {}),
    ...(category && category !== 'ALL' ? { category } : {}),
    ...(language ? { language } : {}),
    ...(isFeatured !== undefined ? { isFeatured } : {}),
  };

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { authorName: { contains: search } },
    ];
  }

  const [count, resources] = await Promise.all([
    prisma.islamicResource.count({ where }),
    prisma.islamicResource.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return { count, resources };
}
