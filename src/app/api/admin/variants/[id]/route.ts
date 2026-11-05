import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: params.id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            slug: true,
            price: true,
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: 'ভ্যারিয়েন্টটি পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      variant,
    });
  } catch (error: any) {
    console.error('Variant GET error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যারিয়েন্টের বিবরণ পেতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const body = await req.json();
    const {
      name,
      sku,
      barcode,
      price,
      salePrice,
      costPrice,
      wholesalePrice,
      stockQuantity,
      lowStockThreshold,
      manageStock,
      stockStatus,
      allowBackorders,
      image,
      gallery,
      description,
      weight,
      length,
      width,
      height,
      shippingClass,
      taxClass,
      status,
      attributes,
    } = body;

    const existing = await prisma.productVariant.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ভ্যারিয়েন্টটি পাওয়া যায়নি।' }, { status: 404 });
    }

    // SKU uniqueness check if changed
    if (sku && sku.trim() !== existing.sku) {
      const duplicateSku = await prisma.productVariant.findUnique({
        where: { sku: sku.trim() },
      });
      if (duplicateSku && duplicateSku.id !== params.id) {
        return NextResponse.json({ error: `এই SKU (${sku.trim()}) ইতিমধ্যে অন্য ভ্যারিয়েন্টে ব্যবহৃত হচ্ছে।` }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (sku !== undefined) updateData.sku = sku.trim().toUpperCase();
    if (barcode !== undefined) updateData.barcode = barcode?.trim() || null;
    if (price !== undefined) updateData.price = parseFloat(String(price));
    if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(String(salePrice)) : null;
    if (costPrice !== undefined) updateData.costPrice = costPrice ? parseFloat(String(costPrice)) : null;
    if (wholesalePrice !== undefined) updateData.wholesalePrice = wholesalePrice ? parseFloat(String(wholesalePrice)) : null;
    if (stockQuantity !== undefined) {
      updateData.stockQuantity = parseInt(String(stockQuantity), 10) || 0;
      updateData.stockStatus = updateData.stockQuantity > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
    }
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(String(lowStockThreshold), 10) || 5;
    if (manageStock !== undefined) updateData.manageStock = Boolean(manageStock);
    if (stockStatus !== undefined) updateData.stockStatus = stockStatus;
    if (allowBackorders !== undefined) updateData.allowBackorders = Boolean(allowBackorders);
    if (image !== undefined) updateData.image = image?.trim() || null;
    if (gallery !== undefined) updateData.gallery = gallery ? (typeof gallery === 'string' ? gallery : JSON.stringify(gallery)) : null;
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (weight !== undefined) updateData.weight = weight ? parseFloat(String(weight)) : null;
    if (length !== undefined) updateData.length = length ? parseFloat(String(length)) : null;
    if (width !== undefined) updateData.width = width ? parseFloat(String(width)) : null;
    if (height !== undefined) updateData.height = height ? parseFloat(String(height)) : null;
    if (shippingClass !== undefined) updateData.shippingClass = shippingClass?.trim() || null;
    if (taxClass !== undefined) updateData.taxClass = taxClass?.trim() || null;
    if (status !== undefined) updateData.status = status;
    if (attributes !== undefined) updateData.attributes = typeof attributes === 'string' ? attributes : JSON.stringify(attributes);

    const updated = await prisma.productVariant.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'ভ্যারিয়েন্ট সফলভাবে আপডেট করা হয়েছে!',
      variant: updated,
    });
  } catch (error: any) {
    console.error('Variant PUT error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যারিয়েন্ট আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const existing = await prisma.productVariant.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'ভ্যারিয়েন্টটি পাওয়া যায়নি।' }, { status: 404 });
    }

    await prisma.productVariant.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: `'${existing.name}' ভ্যারিয়েন্টটি সফলভাবে মুছে ফেলা হয়েছে!`,
    });
  } catch (error: any) {
    console.error('Variant DELETE error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যারিয়েন্ট মুছতে ব্যর্থ।' }, { status: 500 });
  }
}

