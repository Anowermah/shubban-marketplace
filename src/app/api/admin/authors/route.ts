import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0980-\u09FF-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || 'all'; // all, ACTIVE, INACTIVE, DRAFT, PENDING_REVIEW
    const expertise = searchParams.get('expertise')?.trim() || 'all';
    const contentFilter = searchParams.get('contentFilter') || 'all'; // all, hasArticles, hasBooks, noContent
    const dateFilter = searchParams.get('dateFilter') || 'all'; // all, 7days, 30days, thisYear
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // name, createdAt, updatedAt, articles, books
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit') || '25';
    const isAll = limitParam === 'all';
    const limit = isAll ? 1000 : Math.max(1, parseInt(limitParam, 10));

    // 1. Calculate Real Database Statistics
    const [totalAuthors, activeAuthors, inactiveAuthors, totalPublishedArticles] = await Promise.all([
      prisma.author.count(),
      prisma.author.count({ where: { OR: [{ status: 'ACTIVE' }, { isActive: true }] } }),
      prisma.author.count({ where: { OR: [{ status: 'INACTIVE' }, { isActive: false }] } }),
      prisma.article.count({ where: { status: 'PUBLISHED' } }),
    ]);

    // 2. Build Where Filter
    const where: any = {};

    // Status filter
    if (status !== 'all') {
      if (status === 'ACTIVE') {
        where.OR = [{ status: 'ACTIVE' }, { isActive: true }];
      } else if (status === 'INACTIVE') {
        where.OR = [{ status: 'INACTIVE' }, { isActive: false }];
      } else {
        where.status = status;
      }
    }

    // Expertise filter
    if (expertise !== 'all') {
      where.expertise = { contains: expertise };
    }

    // Content filter
    if (contentFilter === 'hasArticles') {
      where.articles = { some: {} };
    } else if (contentFilter === 'hasBooks') {
      where.books = { some: {} };
    } else if (contentFilter === 'noContent') {
      where.articles = { none: {} };
      where.books = { none: {} };
    }

    // Date Filter
    if (dateFilter === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      where.createdAt = { gte: d };
    } else if (dateFilter === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      where.createdAt = { gte: d };
    } else if (dateFilter === 'thisYear') {
      const d = new Date(new Date().getFullYear(), 0, 1);
      where.createdAt = { gte: d };
    }

    // Search query across name, nameEn, slug, email, designation, bio
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { slug: { contains: search } },
        { email: { contains: search } },
        { designation: { contains: search } },
        { bio: { contains: search } },
      ];
    }

    // 3. Sorting
    let orderBy: any = {};
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'updatedAt') {
      orderBy = { updatedAt: sortOrder };
    } else if (sortBy === 'articles') {
      orderBy = { articles: { _count: sortOrder } };
    } else if (sortBy === 'books') {
      orderBy = { books: { _count: sortOrder } };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const totalCount = await prisma.author.count({ where });

    // 4. Query Authors
    const authors = await prisma.author.findMany({
      where,
      orderBy,
      skip: isAll ? 0 : (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            papers: true,
          },
        },
        articles: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1, // Latest article
        },
      },
    });

    // Compute profile completion percentage for each author
    const formattedAuthors = authors.map((auth) => {
      let score = 0;
      const totalCriteria = 10;
      if (auth.name) score++;
      if (auth.photoUrl) score++;
      if (auth.designation) score++;
      if (auth.email) score++;
      if (auth.bio) score++;
      if (auth.bioDetails) score++;
      if (auth.expertise) score++;
      if (auth.workplace || auth.education) score++;
      if (auth.website || auth.facebook || auth.linkedin) score++;
      if (auth.seoTitle || auth.seoDescription) score++;
      const profileCompletion = Math.round((score / totalCriteria) * 100);

      const latestArticle = auth.articles[0] || null;

      return {
        ...auth,
        latestArticle,
        profileCompletion,
      };
    });

    return NextResponse.json({
      success: true,
      authors: formattedAuthors,
      stats: {
        totalAuthors,
        activeAuthors,
        inactiveAuthors,
        totalPublishedArticles,
      },
      pagination: {
        total: totalCount,
        page,
        limit: isAll ? totalCount : limit,
        totalPages: isAll ? 1 : Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/authors:', error);
    return NextResponse.json(
      { error: 'লেখক তালিকা লোড করতে সমস্যা হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      nameEn,
      slug: userSlug,
      bio,
      bioDetails,
      photoUrl,
      designation,
      email,
      phone,
      expertise,
      workplace,
      education,
      experience,
      awards,
      facebook,
      linkedin,
      twitter,
      instagram,
      youtube,
      website,
      status = 'ACTIVE',
      isActive = true,
      isFeatured = false,
      isVerified = false,
      seoTitle,
      seoDescription,
      ogImage,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'লেখকের পূর্ণ নাম প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    const trimmedName = name.trim();
    let finalSlug = userSlug?.trim()
      ? generateSlug(userSlug)
      : generateSlug(nameEn?.trim() || trimmedName);

    if (!finalSlug) {
      finalSlug = `author-${Date.now()}`;
    }

    // Check slug uniqueness
    const existing = await prisma.author.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newAuthor = await prisma.author.create({
      data: {
        name: trimmedName,
        nameEn: nameEn?.trim() || null,
        slug: finalSlug,
        bio: bio?.trim() || null,
        bioDetails: bioDetails?.trim() || null,
        photoUrl: photoUrl?.trim() || null,
        designation: designation?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        expertise: expertise?.trim() || null,
        workplace: workplace?.trim() || null,
        education: education?.trim() || null,
        experience: experience?.trim() || null,
        awards: awards?.trim() || null,
        facebook: facebook?.trim() || null,
        linkedin: linkedin?.trim() || null,
        twitter: twitter?.trim() || null,
        instagram: instagram?.trim() || null,
        youtube: youtube?.trim() || null,
        website: website?.trim() || null,
        status: status || 'ACTIVE',
        isActive: Boolean(isActive),
        isFeatured: Boolean(isFeatured),
        isVerified: Boolean(isVerified),
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
        ogImage: ogImage?.trim() || photoUrl?.trim() || null,
      },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            papers: true,
          },
        },
      },
    });

    // Record AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_AUTHOR',
          entity: 'Author',
          entityId: newAuthor.id,
          details: JSON.stringify({
            name: newAuthor.name,
            slug: newAuthor.slug,
            designation: newAuthor.designation,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json(
      {
        success: true,
        author: newAuthor,
        message: 'লেখক প্রোফাইল সফলভাবে তৈরি হয়েছে।',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/authors:', error);
    return NextResponse.json(
      { error: 'নতুন লেখক তৈরি করতে সমস্যা হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}

