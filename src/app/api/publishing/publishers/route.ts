import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const publishers = await prisma.publisher.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            magazines: true,
            books: true,
            members: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      publishers: publishers.map((p) => ({
        ...p,
        magazineCount: p._count?.magazines || 0,
        bookCount: p._count?.books || 0,
        memberCount: p._count?.members || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error listing publishers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list publishers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      nameEn,
      slug,
      publisherType,
      organizationType,
      contactPerson,
      email,
      phone,
      website,
      address,
      description,
      logoUrl,
      regNumber,
      binNumber,
      establishedYear,
      isVerified,
      status,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'প্রকাশনীর নাম আবশ্যক' }, { status: 400 });
    }

    const generatedSlug = slug?.trim() || name
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `pub-${Date.now()}`;

    const publisher = await prisma.publisher.create({
      data: {
        name,
        nameEn: nameEn || null,
        slug: generatedSlug,
        publisherType: publisherType || 'COMMERCIAL',
        organizationType: organizationType || 'LIMITED',
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        website: website || null,
        address: address || null,
        description: description || null,
        logoUrl: logoUrl || null,
        regNumber: regNumber || null,
        binNumber: binNumber || null,
        establishedYear: establishedYear ? Number(establishedYear) : null,
        isVerified: Boolean(isVerified),
        status: status || 'ACTIVE',
      },
    });

    // Record audit log
    await prisma.publicationAuditLog.create({
      data: {
        publisherId: publisher.id,
        userId: user.id,
        userName: user.name || user.email,
        action: 'CREATE',
        targetType: 'PUBLISHER',
        targetId: publisher.id,
        details: JSON.stringify({ name, slug: generatedSlug, publisherType }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'প্রকাশনী সফলভাবে যুক্ত হয়েছে',
      publisher,
    });
  } catch (error: any) {
    console.error('Error creating publisher:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create publisher' },
      { status: 500 }
    );
  }
}

