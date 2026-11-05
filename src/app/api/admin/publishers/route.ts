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
    const status = searchParams.get('status') || 'all'; // all, ACTIVE, INACTIVE, PENDING_VERIFICATION, SUSPENDED
    const publisherType = searchParams.get('publisherType') || 'all';
    const verification = searchParams.get('verification') || 'all'; // all, verified, unverified
    const isFeatured = searchParams.get('isFeatured'); // 'true', 'false' or undefined
    const dateFilter = searchParams.get('dateFilter') || 'all'; // all, 7days, 30days, thisYear
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // name, createdAt, updatedAt, publications
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit') || '25';
    const isAll = limitParam === 'all';
    const limit = isAll ? 1000 : Math.max(1, parseInt(limitParam, 10));

    // 1. Calculate Real Database Statistics
    const [
      totalPublishers,
      activePublishers,
      inactivePublishers,
      totalBooksWithPublisher,
      totalMagazinesWithPublisher,
    ] = await Promise.all([
      prisma.publisher.count(),
      prisma.publisher.count({ where: { OR: [{ status: 'ACTIVE' }, { isActive: true }] } }),
      prisma.publisher.count({ where: { OR: [{ status: 'INACTIVE' }, { isActive: false }] } }),
      prisma.book.count({ where: { publisherId: { not: null } } }),
      prisma.magazine.count({ where: { publisherId: { not: null } } }),
    ]);

    const totalPublishedContent = totalBooksWithPublisher + totalMagazinesWithPublisher;

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

    // Publisher Type filter
    if (publisherType !== 'all') {
      where.publisherType = publisherType;
    }

    // Verification filter
    if (verification === 'verified') {
      where.isVerified = true;
    } else if (verification === 'unverified') {
      where.isVerified = false;
    }

    // Featured filter
    if (isFeatured === 'true') {
      where.isFeatured = true;
    } else if (isFeatured === 'false') {
      where.isFeatured = false;
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

    // Search query across name, nameEn, slug, contactPerson, email, city, address, description
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { slug: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
        { city: { contains: search } },
        { address: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // 3. Sorting
    let orderBy: any = {};
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'updatedAt') {
      orderBy = { updatedAt: sortOrder };
    } else if (sortBy === 'publications') {
      orderBy = { books: { _count: sortOrder } };
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const totalCount = await prisma.publisher.count({ where });

    // 4. Query Publishers
    const publishers = await prisma.publisher.findMany({
      where,
      orderBy,
      skip: isAll ? 0 : (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            books: true,
            magazines: true,
          },
        },
      },
    });

    // Compute profile completion percentage for each publisher
    const formattedPublishers = publishers.map((pub) => {
      let score = 0;
      const totalCriteria = 10;
      if (pub.name) score++;
      if (pub.logoUrl) score++;
      if (pub.description) score++;
      if (pub.contactPerson) score++;
      if (pub.email || pub.phone) score++;
      if (pub.address || pub.city) score++;
      if (pub.website) score++;
      if (pub.regNumber || pub.establishedYear) score++;
      if (pub.facebook || pub.linkedin || pub.youtube) score++;
      if (pub.seoTitle || pub.seoDescription) score++;
      const profileCompletion = Math.round((score / totalCriteria) * 100);

      const totalPublications = pub._count.books + pub._count.magazines;

      return {
        ...pub,
        totalPublications,
        profileCompletion,
      };
    });

    return NextResponse.json({
      success: true,
      publishers: formattedPublishers,
      stats: {
        totalPublishers,
        activePublishers,
        inactivePublishers,
        totalPublishedContent,
      },
      pagination: {
        total: totalCount,
        page,
        limit: isAll ? totalCount : limit,
        totalPages: isAll ? 1 : Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/publishers:', error);
    return NextResponse.json(
      { error: 'প্রকাশক তালিকা লোড করতে সমস্যা হয়েছে।', details: error.message },
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
      logoUrl,
      publisherType = 'COMMERCIAL',
      description,
      descriptionDetails,
      contactPerson,
      email,
      phone,
      altPhone,
      website,
      country = 'বাংলাদেশ',
      division,
      city,
      postalCode,
      address,
      regNumber,
      binNumber,
      establishedYear,
      organizationType = 'LIMITED',
      mainCategory,
      specialization,
      facebook,
      linkedin,
      twitter,
      instagram,
      youtube,
      status = 'ACTIVE',
      isActive = true,
      isVerified = false,
      isFeatured = false,
      seoTitle,
      seoDescription,
      ogImage,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'প্রকাশনীর নাম প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    const trimmedName = name.trim();
    let finalSlug = userSlug?.trim()
      ? generateSlug(userSlug)
      : generateSlug(nameEn?.trim() || trimmedName);

    if (!finalSlug) {
      finalSlug = `publisher-${Date.now()}`;
    }

    // Check slug uniqueness
    const existing = await prisma.publisher.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const newPublisher = await prisma.publisher.create({
      data: {
        name: trimmedName,
        nameEn: nameEn?.trim() || null,
        slug: finalSlug,
        logoUrl: logoUrl?.trim() || null,
        publisherType: publisherType || 'COMMERCIAL',
        description: description?.trim() || null,
        descriptionDetails: descriptionDetails?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        altPhone: altPhone?.trim() || null,
        website: website?.trim() || null,
        country: country?.trim() || 'বাংলাদেশ',
        division: division?.trim() || null,
        city: city?.trim() || null,
        postalCode: postalCode?.trim() || null,
        address: address?.trim() || null,
        regNumber: regNumber?.trim() || null,
        binNumber: binNumber?.trim() || null,
        establishedYear: establishedYear ? Number(establishedYear) : null,
        organizationType: organizationType || 'LIMITED',
        mainCategory: mainCategory?.trim() || null,
        specialization: specialization?.trim() || null,
        facebook: facebook?.trim() || null,
        linkedin: linkedin?.trim() || null,
        twitter: twitter?.trim() || null,
        instagram: instagram?.trim() || null,
        youtube: youtube?.trim() || null,
        status: status || 'ACTIVE',
        isActive: Boolean(isActive),
        isVerified: Boolean(isVerified),
        isFeatured: Boolean(isFeatured),
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
        ogImage: ogImage?.trim() || logoUrl?.trim() || null,
      },
      include: {
        _count: {
          select: {
            books: true,
            magazines: true,
          },
        },
      },
    });

    // Record AuditLog
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_PUBLISHER',
          entity: 'Publisher',
          entityId: newPublisher.id,
          details: JSON.stringify({
            name: newPublisher.name,
            slug: newPublisher.slug,
            publisherType: newPublisher.publisherType,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json(
      {
        success: true,
        publisher: newPublisher,
        message: 'প্রকাশনী সংস্থা সফলভাবে তৈরি হয়েছে।',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/publishers:', error);
    return NextResponse.json(
      { error: 'নতুন প্রকাশনী তৈরি করতে সমস্যা হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}

