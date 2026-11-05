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

    const subOrder = await prisma.subOrder.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        order: true,
      },
    });

    if (!subOrder) {
      return NextResponse.json({ error: 'সাব-অর্ডার পাওয়া যায়নি।' }, { status: 404 });
    }

    // STRICT ISOLATION CHECK
    if (!isAdmin(session.role) && subOrder.vendorId !== vendorAuth.vendor.id) {
      return NextResponse.json(
        { error: 'অননুমোদিত এক্সেস! অন্য বিক্রেতার সাব-অর্ডার দেখার অধিকার আপনার নেই।' },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, subOrder });
  } catch (error: any) {
    console.error('Get sub-order error:', error);
    return NextResponse.json({ error: 'সাব-অর্ডার তথ্য পেতে ব্যর্থ।' }, { status: 500 });
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

    if (vendorAuth.isSuspended) {
      return NextResponse.json(
        { error: 'আপনার সেলার অ্যাকাউন্টটি স্থগিত রয়েছে। অর্ডার পরিবর্তন করা সম্ভব নয়।' },
        { status: 403 }
      );
    }

    const subOrder = await prisma.subOrder.findUnique({
      where: { id: params.id },
    });

    if (!subOrder) {
      return NextResponse.json({ error: 'সাব-অর্ডার পাওয়া যায়নি।' }, { status: 404 });
    }

    // STRICT ISOLATION CHECK
    if (!isAdmin(session.role) && subOrder.vendorId !== vendorAuth.vendor.id) {
      return NextResponse.json(
        { error: 'অননুমোদিত এক্সেস! অন্য বিক্রেতার সাব-অর্ডার হালনাগাদ করার অধিকার আপনার নেই।' },
        { status: 403 }
      );
    }

    const { status, courierName, trackingNumber } = await req.json();

    const updated = await prisma.subOrder.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(courierName ? { courierName } : {}),
        ...(trackingNumber ? { trackingNumber } : {}),
        ...(status === 'SHIPPED' ? { shippedAt: new Date() } : {}),
        ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      subOrder: updated,
      message: 'সাব-অর্ডারের ডেলিভারি তথ্য সফলভাবে হালনাগাদ হয়েছে!',
    });
  } catch (error: any) {
    console.error('Sub-order update error:', error);
    return NextResponse.json({ error: error.message || 'সাব-অর্ডার আপডেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
