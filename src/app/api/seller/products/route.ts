import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAuthenticatedVendor } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ। অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'আপনি কোনো নিবন্ধিত বিক্রেতা অ্যাকাউন্টের সাথে যুক্ত নন।' }, { status: 403 });
    }

    // Strictly fetch products belonging to this vendor
    const products = await prisma.book.findMany({
      where: { vendorId: vendorAuth.vendor.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, slug: true } },
        publisher: { select: { id: true, name: true } },
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      vendor: {
        id: vendorAuth.vendor.id,
        name: vendorAuth.vendor.name,
        slug: vendorAuth.vendor.slug,
        isSuspended: vendorAuth.isSuspended,
      },
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error('Fetch seller products error:', error);
    return NextResponse.json({ error: 'পণ্য লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    // Suspension check: Suspended sellers cannot add new products
    if (vendorAuth.isSuspended) {
      return NextResponse.json(
        { error: 'আপনার বিক্রেতা অ্যাকাউন্টটি বর্তমানে স্থগিত (Suspended) রয়েছে। নতুন পণ্য যোগ করতে অ্যাডমিনের সাথে যোগাযোগ করুন।' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      authorName,
      authorId,
      categorySlug,
      categoryId,
      price,
      discountPrice,
      stockQuantity = 10,
      coverImage,
      description,
      isbn,
      edition,
      pageCount,
      variants,
    } = body;

    if (!title || !price) {
      return NextResponse.json({ error: 'পণ্যের শিরোনাম ও মূল্য আবশ্যক।' }, { status: 400 });
    }

    // Resolve or create Author
    let effectiveAuthorId = authorId;
    if (!effectiveAuthorId) {
      const authName = (authorName || 'সাধারণ লেখক').trim();
      const existingAuth = await prisma.author.findFirst({
        where: { name: authName },
      });
      if (existingAuth) {
        effectiveAuthorId = existingAuth.id;
      } else {
        const authSlug = `${authName.toLowerCase().replace(/[^\w\u0980-\u09FF]+/g, '-')}-${Date.now().toString().slice(-4)}`;
        const newAuth = await prisma.author.create({
          data: {
            name: authName,
            slug: authSlug,
            bio: `${authName}-এর জীবনী।`,
          },
        });
        effectiveAuthorId = newAuth.id;
      }
    }

    // Resolve Category
    let effectiveCategoryId = categoryId;
    if (!effectiveCategoryId) {
      const cat = categorySlug
        ? await prisma.category.findUnique({ where: { slug: categorySlug } })
        : await prisma.category.findFirst();
      effectiveCategoryId = cat?.id;
    }

    if (!effectiveCategoryId) {
      return NextResponse.json({ error: 'সঠিক ক্যাটাগরি নির্বাচন করুন।' }, { status: 400 });
    }

    // Generate Slug
    const productSlug = `${title
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, '-')
      .slice(0, 50)}-${Date.now().toString().slice(-4)}`;

    const numPrice = parseFloat(price);
    const numDiscount = discountPrice !== undefined && discountPrice !== null && discountPrice !== ''
      ? parseFloat(discountPrice)
      : null;
    const numStock = parseInt(stockQuantity || 10, 10);

    // Create Book with explicit vendorId anchored to authenticated vendor
    const newBook = await prisma.$transaction(async (tx) => {
      const book = await tx.book.create({
        data: {
          title,
          slug: productSlug,
          authorId: effectiveAuthorId,
          categoryId: effectiveCategoryId,
          vendorId: vendorAuth.vendor.id, // Strictly server-assigned
          price: numPrice,
          discountPrice: numDiscount,
          stockQuantity: numStock,
          coverImage: coverImage || '/placeholder.jpg',
          description: description || `${title} — ${vendorAuth.vendor.name}-এর লিস্টিং।`,
          isbn: isbn || null,
          edition: edition || '১ম প্রকাশ',
          pages: pageCount ? parseInt(pageCount, 10) : null,
          isPhysicalAvailable: true,
          isFeatured: false,
        },
      });

      // Also create VendorProduct linkage
      await tx.vendorProduct.create({
        data: {
          vendorId: vendorAuth.vendor.id,
          bookId: book.id,
          price: numPrice,
          discountPrice: numDiscount,
          stockQuantity: numStock,
          isDefault: true,
        },
      });

      // Create variants if provided
      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          if (v.name && v.price) {
            await tx.productVariant.create({
              data: {
                bookId: book.id,
                name: v.name,
                sku: v.sku || null,
                price: parseFloat(v.price),
                stockQuantity: parseInt(v.stockQuantity || 10, 10),
                attributes: v.attributes ? JSON.stringify(v.attributes) : null,
              },
            });
          }
        }
      }

      // Initial Inventory Log
      await tx.inventoryLog.create({
        data: {
          bookId: book.id,
          vendorId: vendorAuth.vendor.id,
          changeType: 'RESTOCK',
          quantityChange: numStock,
          balanceAfter: numStock,
          referenceId: `NEW-PROD-${book.id.slice(-6)}`,
          reason: `সেলার (${vendorAuth.vendor.name}) কর্তৃক প্রাথমিক স্টক যোগ`,
        },
      });

      return book;
    });

    return NextResponse.json({
      success: true,
      message: 'পণ্যটি সফলভাবে ক্যাটালগে যুক্ত হয়েছে!',
      product: newBook,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create seller product error:', error);
    return NextResponse.json(
      { error: error.message || 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}
