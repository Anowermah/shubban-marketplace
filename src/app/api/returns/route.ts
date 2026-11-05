import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAuthenticatedVendor } from '@/lib/auth';
import { createReturnRequest } from '@/lib/returns';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ। লগইন করুন।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);

    let whereClause: any = {};
    if (vendorAuth) {
      // If vendor, show returns for this vendor's sub-orders
      whereClause = {
        subOrder: { vendorId: vendorAuth.vendor.id },
      };
    } else {
      // If customer, show returns for their orders
      whereClause = { userId: session.id };
    }

    const returns = await prisma.returnRequest.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            book: { select: { id: true, title: true, coverImage: true } },
          },
        },
        order: { select: { orderNumber: true, total: true } },
        disputes: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      count: returns.length,
      returns,
    });
  } catch (error: any) {
    console.error('Fetch returns error:', error);
    return NextResponse.json({ error: 'রিটার্ন আবেদন লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ। অনুগ্রহ করে লগইন করুন।' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, subOrderId, reason, explanation, items, customerImages } = body;

    if (!orderId || !reason || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'অর্ডার আইডি, রিটার্নের কারণ ও আইটেম তালিকা প্রদান করুন।' },
        { status: 400 }
      );
    }

    const returnRequest = await createReturnRequest({
      orderId,
      subOrderId,
      userId: session.id,
      reason,
      explanation,
      items,
      customerImages,
    });

    return NextResponse.json({
      success: true,
      message: 'আপনার রিটার্ন আবেদনটি সফলভাবে জমা হয়েছে। আমাদের কিউসি টিম শীঘ্রই যাচাই করবে।',
      returnRequest,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create return request error:', error);
    return NextResponse.json({ error: error.message || 'রিটার্ন আবেদন সম্পন্ন করতে ব্যর্থ।' }, { status: 500 });
  }
}

