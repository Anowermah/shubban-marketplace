import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { settleCourierRemittance } from '@/lib/shipping';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { courierFee } = await req.json();

    if (courierFee === undefined || courierFee === null) {
      return NextResponse.json(
        { error: 'কুরিয়ার ডেলিভারি চার্জ বা সার্ভিস ফি উল্লেখ করুন।' },
        { status: 400 }
      );
    }

    const shipment = await settleCourierRemittance({
      shipmentId: params.id,
      courierFee: parseFloat(courierFee),
      adminUserId: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'কুরিয়ার সিওডি রেমিট্যান্স সেটেলমেন্ট সফলভাবে সংরক্ষিত হয়েছে!',
      shipment,
    });
  } catch (error: any) {
    console.error('Settle remittance error:', error);
    return NextResponse.json({ error: error.message || 'রেমিট্যান্স সেটেলমেন্ট ব্যর্থ।' }, { status: 500 });
  }
}

