import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

// 1. PATCH /api/admin/products/[id] - Edit product, stock, price, publish/unpublish, approve
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      titleEn,
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
      isPhysicalAvailable,
      isDigitalAvailable,
      isFree,
      isFeatured,
      isBestSeller,
      isEditorsPick,
      variants,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice ? parseFloat(discountPrice) : null;
    if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity, 10);
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (authorId !== undefined) updateData.authorId = authorId;
    if (publisherId !== undefined) updateData.publisherId = publisherId || null;
    if (vendorId !== undefined) updateData.vendorId = vendorId || null;
    if (description !== undefined) updateData.description = description;
    if (synopsis !== undefined) updateData.synopsis = synopsis;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (edition !== undefined) updateData.edition = edition;
    if (pages !== undefined) updateData.pages = pages ? parseInt(pages, 10) : null;
    if (bindingType !== undefined) updateData.bindingType = bindingType;
    if (isPhysicalAvailable !== undefined) updateData.isPhysicalAvailable = Boolean(isPhysicalAvailable);
    if (isDigitalAvailable !== undefined) updateData.isDigitalAvailable = Boolean(isDigitalAvailable);
    if (isFree !== undefined) updateData.isFree = Boolean(isFree);
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (isBestSeller !== undefined) updateData.isBestSeller = Boolean(isBestSeller);
    if (isEditorsPick !== undefined) updateData.isEditorsPick = Boolean(isEditorsPick);

    // Update product
    const updated = await prisma.book.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: true,
        category: true,
        publisher: true,
        vendor: true,
        variants: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_PRODUCT',
        entity: 'Book',
        entityId: updated.id,
        details: `পণ্য আপডেট করা হয়েছে: ${updated.title} (স্টক: ${updated.stockQuantity})`,
      },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: error.message || 'পণ্য আপডেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

// 2. DELETE /api/admin/products/[id] - Delete or archive product
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const book = await prisma.book.findUnique({
      where: { id: params.id },
      select: { id: true, title: true },
    });

    if (!book) {
      return NextResponse.json({ error: 'পণ্যটি পাওয়া যায়নি।' }, { status: 404 });
    }

    // Check if book has orders before hard deleting
    const orderItemsCount = await prisma.orderItem.count({
      where: { bookId: params.id },
    });

    if (orderItemsCount > 0) {
      // Archive / disable instead of hard deleting to preserve order history
      await prisma.book.update({
        where: { id: params.id },
        data: {
          stockQuantity: 0,
          isPhysicalAvailable: false,
          isDigitalAvailable: false,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ARCHIVE_PRODUCT',
          entity: 'Book',
          entityId: book.id,
          details: `পণ্যটি ক্রয়ের ইতিহাসে বিদ্যমান থাকায় আর্কাইভ ও অপ্রকাশিত করা হয়েছে: ${book.title}`,
        },
      });

      return NextResponse.json({
        success: true,
        archived: true,
        message: 'পণ্যটি অর্ডারের ইতিহাসে যুক্ত থাকায় নিরাপদে আর্কাইভ ও অপ্রকাশিত করা হয়েছে।',
      });
    }

    // Delete product and its variants
    await prisma.productVariant.deleteMany({ where: { bookId: params.id } });
    await prisma.book.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE_PRODUCT',
        entity: 'Book',
        entityId: book.id,
        details: `পণ্যটি স্থায়ীভাবে মুছে ফেলা হয়েছে: ${book.title}`,
      },
    });

    return NextResponse.json({ success: true, message: 'পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: error.message || 'পণ্য মুছে ফেলতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

