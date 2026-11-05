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
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const groupId = searchParams.get('groupId') || 'all';
    const usage = searchParams.get('usage') || 'all'; // all, used, unused
    const sortBy = searchParams.get('sortBy') || 'displayOrder'; // name, displayOrder, createdAt, usage
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit') || '25';
    const isAll = limitParam === 'all';
    const limit = isAll ? 1000 : Math.max(1, parseInt(limitParam, 10));

    // 1. Calculate Real Database Statistics (5 Summary Cards)
    const [
      totalAttributes,
      totalAttributeValues,
      totalProductVariants,
      activeAttributes,
      productsUsingAttributes,
      groups,
    ] = await Promise.all([
      prisma.productAttribute.count(),
      prisma.productAttributeValue.count(),
      prisma.productVariant.count(),
      prisma.productAttribute.count({ where: { status: 'ACTIVE' } }),
      prisma.book.count({ where: { attributeAssignments: { some: {} } } }),
      prisma.productAttributeGroup.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { displayOrder: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
    ]);

    const stats = {
      totalAttributes,
      totalAttributeValues,
      totalProductVariants,
      activeAttributes,
      productsUsingAttributes,
    };

    // 2. Build Where Filter
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { displayLabel: { contains: search } },
        { description: { contains: search } },
        { values: { some: { name: { contains: search } } } },
      ];
    }

    if (type !== 'all') {
      where.type = type;
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (groupId !== 'all') {
      where.groupId = groupId === 'none' ? null : groupId;
    }

    if (usage === 'used') {
      where.assignments = { some: {} };
    } else if (usage === 'unused') {
      where.assignments = { none: {} };
    }

    // 3. Sorting
    let orderBy: any = [];
    if (sortBy === 'name') {
      orderBy = [{ name: sortOrder }];
    } else if (sortBy === 'displayOrder') {
      orderBy = [{ displayOrder: sortOrder }, { createdAt: 'desc' }];
    } else if (sortBy === 'createdAt') {
      orderBy = [{ createdAt: sortOrder }];
    } else {
      orderBy = [{ displayOrder: 'asc' }, { createdAt: 'desc' }];
    }

    // 4. Query with server-side pagination
    const total = await prisma.productAttribute.count({ where });
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;

    const attributes = await prisma.productAttribute.findMany({
      where,
      orderBy,
      skip: isAll ? 0 : skip,
      take: limit,
      include: {
        group: {
          select: { id: true, name: true, slug: true },
        },
        values: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            assignments: true,
            values: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      stats,
      groups,
      attributes,
      pagination: {
        total,
        page: safePage,
        limit,
        totalPages,
        showingFrom: total > 0 ? skip + 1 : 0,
        showingTo: Math.min(skip + limit, total),
      },
    });
  } catch (error: any) {
    console.error('Admin Attributes GET error:', error);
    return NextResponse.json({ error: error.message || 'অ্যাট্রিবিউট লোড করতে ব্যর্থ।' }, { status: 500 });
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
      slug,
      code,
      description,
      type = 'SELECT',
      displayLabel,
      displayOrder = 0,
      status = 'ACTIVE',
      isRequired = false,
      isVariant = true,
      showOnProduct = true,
      useInFilter = true,
      groupId,
      values = [],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'অ্যাট্রিবিউটের নাম আবশ্যক।' }, { status: 400 });
    }

    const attributeSlug = (slug?.trim() || generateSlug(name)) || `attr-${Date.now()}`;
    const attributeCode = (code?.trim() || attributeSlug.toUpperCase().replace(/-/g, '_')) || `CODE_${Date.now()}`;

    // Check code/slug uniqueness
    const existing = await prisma.productAttribute.findFirst({
      where: {
        OR: [{ code: attributeCode }, { slug: attributeSlug }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `এই কোড (${attributeCode}) বা স্লাগ (${attributeSlug}) দ্বারা ইতিমধ্যে একটি অ্যাট্রিবিউট বিদ্যমান রয়েছে।` },
        { status: 400 }
      );
    }

    // Format initial values
    const formattedValues = (values || [])
      .filter((v: any) => v.name && v.name.trim())
      .map((v: any, index: number) => ({
        name: v.name.trim(),
        slug: (v.slug?.trim() || generateSlug(v.name)) || `val-${Date.now()}-${index}`,
        code: v.code?.trim() || null,
        colorHex: v.colorHex?.trim() || null,
        swatchImage: v.swatchImage?.trim() || null,
        displayOrder: typeof v.displayOrder === 'number' ? v.displayOrder : index + 1,
        status: v.status || 'ACTIVE',
        metadata: v.metadata ? JSON.stringify(v.metadata) : null,
      }));

    const newAttribute = await prisma.productAttribute.create({
      data: {
        name: name.trim(),
        slug: attributeSlug,
        code: attributeCode,
        description: description?.trim() || null,
        type,
        displayLabel: displayLabel?.trim() || name.trim(),
        displayOrder: parseInt(String(displayOrder), 10) || 0,
        status,
        isRequired: Boolean(isRequired),
        isVariant: Boolean(isVariant),
        showOnProduct: Boolean(showOnProduct),
        useInFilter: Boolean(useInFilter),
        groupId: groupId || null,
        values: formattedValues.length > 0 ? { create: formattedValues } : undefined,
      },
      include: {
        group: true,
        values: { orderBy: { displayOrder: 'asc' } },
        _count: { select: { assignments: true, values: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'নতুন প্রোডাক্ট অ্যাট্রিবিউট সফলভাবে তৈরি হয়েছে!',
      attribute: newAttribute,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Admin Attributes POST error:', error);
    return NextResponse.json({ error: error.message || 'অ্যাট্রিবিউট তৈরি করতে ব্যর্থ।' }, { status: 500 });
  }
}

