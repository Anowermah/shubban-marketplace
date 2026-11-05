import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { DEFAULT_PLATFORM_COMMISSION, seedDefaultCommissionRules } from '@/lib/commission';

export async function GET() {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    await seedDefaultCommissionRules();

    const rules = await prisma.commissionRule.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const vendorsWithCustomRate = await prisma.vendor.findMany({
      where: { commissionRate: { not: null } },
      select: {
        id: true,
        name: true,
        slug: true,
        commissionRate: true,
      },
    });

    return NextResponse.json({
      success: true,
      platformDefaultRate: DEFAULT_PLATFORM_COMMISSION,
      categoryRules: rules,
      vendorCustomRates: vendorsWithCustomRate,
    });
  } catch (error: any) {
    console.error('Fetch commission rules error:', error);
    return NextResponse.json({ error: 'কমিশন রুলস লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { name, categorySlug, vendorId, percentage, description } = await req.json();

    if (!name || percentage === undefined || percentage === null) {
      return NextResponse.json({ error: 'রুলের নাম ও শতকরা কমিশন আবশ্যক।' }, { status: 400 });
    }

    const numPercentage = parseFloat(percentage);
    if (isNaN(numPercentage) || numPercentage < 0 || numPercentage > 100) {
      return NextResponse.json({ error: 'কমিশন ০% থেকে ১০০% এর মধ্যে হতে হবে।' }, { status: 400 });
    }

    let rule;
    if (categorySlug) {
      const existing = await prisma.commissionRule.findFirst({
        where: { categorySlug },
      });
      if (existing) {
        rule = await prisma.commissionRule.update({
          where: { id: existing.id },
          data: {
            name,
            percentage: numPercentage,
            description: description || null,
          },
        });
      }
    }

    if (!rule) {
      rule = await prisma.commissionRule.create({
        data: {
          name,
          categorySlug: categorySlug || null,
          vendorId: vendorId || null,
          percentage: numPercentage,
          description: description || null,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'COMMISSION_RULE_CREATED',
        entity: 'CommissionRule',
        entityId: rule.id,
        details: JSON.stringify({ name, percentage: numPercentage, categorySlug, vendorId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'নতুন কমিশন রুল সফলভাবে তৈরি হয়েছে!',
      rule,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create commission rule error:', error);
    return NextResponse.json({ error: error.message || 'কমিশন রুল সংরক্ষণে ত্রুটি।' }, { status: 500 });
  }
}

