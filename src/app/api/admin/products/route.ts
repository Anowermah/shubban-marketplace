import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

// 1. GET /api/admin/products - List products with filters
export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const categoryId = searchParams.get('categoryId');
    const vendorId = searchParams.get('vendorId');
    const lowStock = searchParams.get('lowStock') === 'true';

    const where: any = {};
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { titleEn: { contains: q } },
        { isbn: { contains: q } },
        { author: { name: { contains: q } } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (vendorId) where.vendorId = vendorId;
    if (lowStock) where.stockQuantity = { lte: 5 };

    const products = await prisma.book.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        category: true,
        publisher: true,
        vendor: true,
        variants: true,
      },
    });

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'পণ্য তালিকা আনতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// 2. POST /api/admin/products - Create a new product / book
export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      titleEn,
      slug,
      price,
      discountPrice,
      stockQuantity,
      categoryId,
      authorId,
      publisherId,
      vendorId,
      description,
      synopsis,
      coverImage,
      isbn,
      edition,
      pages,
      bindingType,
      language,
      publishedYear,
      isPhysicalAvailable = true,
      isDigitalAvailable = false,
      isFree = false,
      isFeatured = false,
      isBestSeller = false,
      variants = [],
    } = body;

    if (!title || !price || !categoryId || !authorId) {
      return NextResponse.json({ error: 'শিরোনাম, মূল্য, বিভাগ এবং লেখক আবশ্যক।' }, { status: 400 });
    }

    // Auto generate slug if not provided
    const finalSlug =
      slug?.trim() ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
        .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`;

    const newProduct = await prisma.book.create({
      data: {
        title,
        titleEn: titleEn || null,
        slug: finalSlug,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stockQuantity: parseInt(stockQuantity, 10) || 10,
        categoryId,
        authorId,
        publisherId: publisherId || null,
        vendorId: vendorId || null,
        description: description || title,
        synopsis: synopsis || null,
        coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
        isbn: isbn || null,
        edition: edition || '১ম সংস্করণ',
        pages: pages ? parseInt(pages, 10) : null,
        bindingType: bindingType || 'হার্ডকভার',
        language: language || 'bn',
        publishedYear: publishedYear || '২০২৪',
        isPhysicalAvailable: Boolean(isPhysicalAvailable),
        isDigitalAvailable: Boolean(isDigitalAvailable),
        isFree: Boolean(isFree),
        isFeatured: Boolean(isFeatured),
        isBestSeller: Boolean(isBestSeller),
        variants: {
          create: variants.map((v: any) => ({
            name: v.name,
            sku: v.sku || null,
            price: parseFloat(v.price),
            stockQuantity: parseInt(v.stockQuantity, 10) || 10,
            attributes: v.attributes ? JSON.stringify(v.attributes) : null,
          })),
        },
      },
      include: {
        author: true,
        category: true,
        publisher: true,
        vendor: true,
        variants: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_PRODUCT',
        entity: 'Book',
        entityId: newProduct.id,
        details: `নতুন পণ্য যুক্ত করা হয়েছে: ${newProduct.title}`,
      },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message || 'পণ্য তৈরি করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

