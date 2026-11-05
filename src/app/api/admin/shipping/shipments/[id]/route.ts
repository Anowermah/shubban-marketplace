import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { updateShipmentStatus } from '@/lib/shipping';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const shipment = await prisma.shipment.findUnique({
      where: { id: params.id },
      include: {
        order: true,
        subOrder: { include: { vendor: true } },
      },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'শিপমেন্ট পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({ success: true, shipment });
  } catch (error: any) {
    console.error('Get shipment error:', error);
    return NextResponse.json({ error: 'শিপমেন্ট তথ্য পেতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { status, failedReason, notes } = await req.json();

    if (!status) {
      return NextResponse.json({ error: 'শিপমেন্ট স্ট্যাটাস প্রদান করুন।' }, { status: 400 });
    }

    const updated = await updateShipmentStatus({
      shipmentId: params.id,
      status,
      failedReason,
      notes,
      adminUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'শিপমেন্ট স্ট্যাটাস সফলভাবে হালনাগাদ করা হয়েছে!',
      shipment: updated,
    });
  } catch (error: any) {
    console.error('Update shipment status error:', error);
    return NextResponse.json({ error: error.message || 'স্ট্যাটাস আপডেটে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

