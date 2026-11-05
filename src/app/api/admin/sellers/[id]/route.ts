import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { status, commissionRate, isFeatured } = await req.json();

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(commissionRate !== undefined ? { commissionRate: parseFloat(commissionRate) } : {}),
        ...(isFeatured !== undefined ? { isFeatured } : {}),
      },
    });

    return NextResponse.json({ success: true, vendor, message: 'বিক্রেতা তথ্য সফলভাবে হালনাগাদ হয়েছে!' });
  } catch (error) {
    console.error('Vendor update error:', error);
    return NextResponse.json({ error: 'বিক্রেতা আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}

