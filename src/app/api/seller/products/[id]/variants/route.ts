import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAuthenticatedVendor, isAdmin } from '@/lib/auth';

export async function POST(
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
      return NextResponse.json({ error: 'সেলার অ্যাকাউন্ট স্থগিত রয়েছে।' }, { status: 403 });
    }

    const product = await prisma.book.findUnique({
      where: { id: params.id },
    });

    if (!product) {
      return NextResponse.json({ error: 'পণ্যটি পাওয়া যায়নি।' }, { status: 404 });
    }

    // STRICT ISOLATION CHECK
    if (!isAdmin(session.role) && product.vendorId !== vendorAuth.vendor.id) {
      return NextResponse.json(
        { error: 'অননুমোদিত এক্সেস! অন্য বিক্রেতার পণ্যে ভ্যারিয়েন্ট যোগ করতে পারবেন না।' },
        { status: 403 }
      );
    }

    const { name, sku, price, stockQuantity = 10, attributes } = await req.json();

    if (!name || !price) {
      return NextResponse.json({ error: 'ভ্যারিয়েন্টের নাম ও মূল্য আবশ্যক।' }, { status: 400 });
    }

    const variant = await prisma.productVariant.create({
      data: {
        bookId: params.id,
        name,
        sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity, 10),
        attributes: attributes ? JSON.stringify(attributes) : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ভ্যারিয়েন্ট সফলভাবে যোগ করা হয়েছে!',
      variant,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create variant error:', error);
    return NextResponse.json({ error: error.message || 'ভ্যারিয়েন্ট তৈরি করতে ব্যর্থ।' }, { status: 500 });
  }
}

