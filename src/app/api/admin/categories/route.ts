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
    const status = searchParams.get('status') || 'all'; // all, active, inactive
    const parentFilter = searchParams.get('parentId') || 'all'; // all, root, or specific parent id
    const dateFilter = searchParams.get('dateFilter') || 'all'; // all, 7days, 30days, thisYear
    const sortBy = searchParams.get('sortBy') || 'displayOrder'; // displayOrder, name, createdAt, updatedAt
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limitParam = searchParams.get('limit') || '25';
    const isAll = limitParam === 'all';
    const limit = isAll ? 1000 : Math.max(1, parseInt(limitParam, 10));

    // Calculate Global Statistics
    const [totalCategories, totalSubcategories, activeCategories, inactiveCategories] = await Promise.all([
      prisma.category.count({ where: { parentId: null } }),
      prisma.category.count({ where: { parentId: { not: null } } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.count({ where: { isActive: false } }),
    ]);

    // Build Prisma query condition
    const where: any = {};

    // Status filter
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Parent Filter
    if (parentFilter === 'root') {
      where.parentId = null;
    } else if (parentFilter !== 'all') {
      where.parentId = parentFilter;
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

    // Search query across name, nameEn, slug, description
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nameEn: { contains: search } },
        { slug: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Sort definition
    let orderBy: any = {};
    if (sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else if (sortBy === 'updatedAt') {
      orderBy = { updatedAt: sortOrder };
    } else {
      orderBy = [
        { displayOrder: sortOrder },
        { createdAt: 'desc' },
      ];
    }

    // If searching or parentFilter != 'all', we might query flat categories.
    // Otherwise, we query parents with pagination, and include their subcategories.
    // Fetch all parent categories for parent dropdowns
    const allParents = await prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true, nameEn: true, slug: true },
      orderBy: { name: 'asc' },
    });

    const totalCount = await prisma.category.count({ where });

    const categories = await prisma.category.findMany({
      where,
      orderBy,
      skip: isAll ? 0 : (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            magazines: true,
            questions: true,
          },
        },
      },
    });

    // Also collect subcategories for the returned categories if any are parents
    const parentIds = categories.map((c) => c.id);
    const subcategories = await prisma.category.findMany({
      where: { parentId: { in: parentIds } },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            magazines: true,
            questions: true,
          },
        },
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    const subcategoryMap: Record<string, typeof subcategories> = {};
    subcategories.forEach((sub) => {
      if (sub.parentId) {
        if (!subcategoryMap[sub.parentId]) subcategoryMap[sub.parentId] = [];
        subcategoryMap[sub.parentId].push(sub);
      }
    });

    const formattedCategories = categories.map((cat) => {
      const subs = subcategoryMap[cat.id] || [];
      const subProductsCount = subs.reduce((sum, s) => sum + s._count.books, 0);
      return {
        ...cat,
        subcategories: subs,
        subcategoryCount: subs.length,
        totalProducts: cat._count.books + subProductsCount,
      };
    });

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
      allParents,
      stats: {
        totalCategories,
        totalSubcategories,
        activeCategories,
        inactiveCategories,
      },
      pagination: {
        total: totalCount,
        page,
        limit: isAll ? totalCount : limit,
        totalPages: isAll ? 1 : Math.ceil(totalCount / limit) || 1,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/categories:', error);
    return NextResponse.json(
      { error: 'ক্যাটাগরি ডেটা লোড করতে ব্যর্থ হয়েছে।', details: error.message },
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
      description,
      icon,
      image,
      type = 'BOOK',
      parentId,
      isActive = true,
      displayOrder = 0,
      seoTitle,
      seoDescription,
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'ক্যাটাগরির নাম প্রদান করা আবশ্যক।' }, { status: 400 });
    }

    const trimmedName = name.trim();
    let finalSlug = userSlug?.trim()
      ? generateSlug(userSlug)
      : generateSlug(nameEn?.trim() || trimmedName);

    if (!finalSlug) {
      finalSlug = `category-${Date.now()}`;
    }

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    // Check parent validity if provided
    if (parentId) {
      const parentExists = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parentExists) {
        return NextResponse.json({ error: 'নির্বাচিত মূল ক্যাটাগরি খুঁজে পাওয়া যায়নি।' }, { status: 400 });
      }
    }

    const newCategory = await prisma.category.create({
      data: {
        name: trimmedName,
        nameEn: nameEn?.trim() || null,
        slug: finalSlug,
        description: description?.trim() || null,
        icon: icon?.trim() || null,
        image: image?.trim() || null,
        type,
        parentId: parentId || null,
        isActive: Boolean(isActive),
        displayOrder: Number(displayOrder) || 0,
        seoTitle: seoTitle?.trim() || null,
        seoDescription: seoDescription?.trim() || null,
      },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            magazines: true,
            questions: true,
          },
        },
      },
    });

    // Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_CATEGORY',
          entity: 'Category',
          entityId: newCategory.id,
          details: JSON.stringify({
            name: newCategory.name,
            slug: newCategory.slug,
            parentId: newCategory.parentId,
            isActive: newCategory.isActive,
          }),
        },
      });
    } catch (logErr) {
      console.warn('Failed to record audit log:', logErr);
    }

    return NextResponse.json(
      {
        success: true,
        category: newCategory,
        message: `${newCategory.parentId ? 'উপ-বিভাগ' : 'ক্যাটাগরি'} সফলভাবে তৈরি হয়েছে।`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/categories:', error);
    return NextResponse.json(
      { error: 'নতুন ক্যাটাগরি তৈরি করতে ব্যর্থ হয়েছে।', details: error.message },
      { status: 500 }
    );
  }
}

