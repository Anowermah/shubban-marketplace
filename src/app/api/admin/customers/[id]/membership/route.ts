import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const adminUser = await getCurrentUserWithProfile();
    if (!adminUser || !isAdmin(adminUser.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস — অ্যাডমিন অনুমতি আবশ্যক।' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { membershipTier, membershipExpiry, notes, notifyUser = true } = body;

    const validTiers = ['FREE', 'DIGITAL', 'PREMIUM', 'INSTITUTIONAL', 'VIP', 'GOLD', 'SILVER'];
    if (!membershipTier || !validTiers.includes(membershipTier.toUpperCase())) {
      return NextResponse.json({ error: 'অবৈধ মেম্বারশিপ টায়ার দেওয়া হয়েছে।' }, { status: 400 });
    }

    const customer = await prisma.user.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json({ error: 'গ্রাহক খুঁজে পাওয়া যায়নি।' }, { status: 404 });
    }

    const oldTier = customer.membershipTier || 'FREE';
    const newTier = membershipTier.toUpperCase();
    const parsedExpiry = membershipExpiry ? new Date(membershipExpiry) : null;

    const updatedCustomer = await prisma.user.update({
      where: { id },
      data: {
        membershipTier: newTier,
        membershipExpiry: parsedExpiry,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'UPDATE_CUSTOMER_MEMBERSHIP',
        entity: 'USER',
        entityId: id,
        details: `মেম্বারশিপ পরিবর্তন: ${oldTier} ➔ ${newTier}. মেয়াদ: ${parsedExpiry ? parsedExpiry.toISOString().split('T')[0] : 'লাইফটাইম'}. মন্তব্য: ${notes || 'নেই'}`,
      },
    });

    // Notify user
    if (notifyUser) {
      await prisma.notification.create({
        data: {
          userId: id,
          title: `অভিনন্দন! আপনার মেম্বারশিপ এখন ${newTier} টিয়ারে উন্নীত হয়েছে`,
          message: `আপনার শুভ্বান লাইব্রেরি মেম্বারশিপ স্তর পরিবর্তন করে '${newTier}' করা হয়েছে। প্রিমিয়াম ডিজিটাল সুবিধা উপভোগ করুন।`,
          type: 'MEMBERSHIP',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `মেম্বারশিপ সফলভাবে '${newTier}' করা হয়েছে।`,
      customer: updatedCustomer,
    });
  } catch (error: any) {
    console.error('Customer membership PATCH error:', error);
    return NextResponse.json({ error: error.message || 'মেম্বারশিপ আপডেট করতে ব্যর্থ।' }, { status: 500 });
  }
}

