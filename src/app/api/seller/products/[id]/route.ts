import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAuthenticatedVendor, isAdmin } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    const product = await prisma.book.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        author: true,
        publisher: true,
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'পণ্যটি খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    // STRICT SELLER ISOLATION CHECK
    if (!isAdmin(session.role) && product.vendorId !== vendorAuth.vendor.id) {
      return NextResponse.json(
        { error: 'অননুমোদিত এক্সেস! আপনি কেবল আপনার নিজস্ব পণ্যের তথ্য দেখতে পারেন।' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Get seller product error:', error);
    return NextResponse.json({ error: 'পণ্য তথ্য পেতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    // Suspension Guard
    if (vendorAuth.isSuspended) {
      return NextResponse.json(
        { error: 'আপনার সেলার অ্যাকাউন্টটি স্থগিত রয়েছে। পণ্য পরিবর্তন করা সম্ভব নয়।' },
        { status: 403 }
      );
    }

    const product = await prisma.book.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'পণ্যটি পাওয়া যায়নি।' }, { status: 404 });
    }

    // STRICT SELLER ISOLATION CHECK
    if (!isAdmin(session.role) && product.vendorId !== vendorAuth.vendor.id) {
      return NextResponse.json(
        { error: 'অননুমোদিত এক্সেস! অন্য বিক্রেতার পণ্য সম্পাদনার অনুমতি আপনার নেই।' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      price,
      discountPrice,
      stockQuantity,
      coverImage,
      description,
      isPublished,
    } = body;

    const updateData: any = {};
    if (title) updateData.title = title;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (discountPrice !== undefined) {
      updateData.discountPrice = discountPrice === null || discountPrice === '' ? null : parseFloat(discountPrice);
    }
    if (stockQuantity !== undefined) {
      const newStock = parseInt(stockQuantity, 10);
      const stockDiff = newStock - product.stockQuantity;
      updateData.stockQuantity = newStock;

      if (stockDiff !== 0) {
        await prisma.inventoryLog.create({
          data: {
            bookId: product.id,
            vendorId: vendorAuth.vendor.id,
            changeType: stockDiff > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
            quantityChange: stockDiff,
            balanceAfter: newStock,
            referenceId: `SELLER-UPD-${Date.now().toString().slice(-4)}`,
            reason: `বিক্রেতা কর্তৃক স্টক সমন্বয়`,
          },
        });
      }
    }
    if (coverImage) updateData.coverImage = coverImage;
    if (description !== undefined) updateData.description = description;
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

    const updated = await prisma.book.update({
      where: { id: params.id },
      data: updateData,
    });

    // Also update vendorProduct if present
    await prisma.vendorProduct.updateMany({
      where: { bookId: params.id, vendorId: vendorAuth.vendor.id },
      data: {
        ...(updateData.price ? { price: updateData.price } : {}),
        ...(updateData.discountPrice !== undefined ? { discountPrice: updateData.discountPrice } : {}),
        ...(updateData.stockQuantity !== undefined ? { stockQuantity: updateData.stockQuantity } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'পণ্যটি সফলভাবে হালনাগাদ করা হয়েছে!',
      product: updated,
    });
  } catch (error: any) {
    console.error('Update seller product error:', error);
    return NextResponse.json({ error: error.message || 'পণ্য আপডেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    if (vendorAuth.isSuspended) {
      return NextResponse.json({ error: 'অ্যাকাউন্ট স্থগিত থাকায় ডিলিট করা সম্ভব নয়।' }, { status: 403 });
    }

    const product = await prisma.book.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'পণ্যটি পাওয়া যায়নি।' }, { status: 404 });
    }

    // STRICT SELLER ISOLATION CHECK
    if (!isAdmin(session.role) && product.vendorId !== vendorAuth.vendor.id) {
      return NextResponse.json(
        { error: 'অননুমোদিত এক্সেস! অন্য বিক্রেতার পণ্য ডিলিট করার অধিকার আপনার নেই।' },
        { status: 403 }
      );
    }

    // Unpublish or cascade delete
    await prisma.book.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'পণ্যটি ক্যাটালগ থেকে সফলভাবে মুছে ফেলা হয়েছে।',
    });
  } catch (error: any) {
    console.error('Delete seller product error:', error);
    return NextResponse.json({ error: 'পণ্য মুছে ফেলতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

