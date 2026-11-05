import { prisma } from './prisma';

export const DEFAULT_PLATFORM_COMMISSION = 10.0;

export interface CommissionCalculationResult {
  commissionRate: number;
  commissionAmt: number;
  payoutAmt: number;
  ruleType: 'VENDOR_OVERRIDE' | 'CATEGORY_RULE' | 'VENDOR_RULE' | 'PLATFORM_DEFAULT';
  ruleName: string;
}

/**
 * Calculates marketplace commission based on hierarchy:
 * 1. Vendor custom override (Vendor.commissionRate)
 * 2. Category-specific rule (CommissionRule where categorySlug matches)
 * 3. Vendor-specific rule (CommissionRule where vendorId matches)
 * 4. Platform default (10.0%)
 */
export async function calculateCommission(params: {
  vendorId: string;
  categorySlug?: string | null;
  amount: number;
}): Promise<CommissionCalculationResult> {
  const { vendorId, categorySlug, amount } = params;

  // 1. Check Vendor explicit commission override
  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
    select: { id: true, name: true, commissionRate: true },
  });

  if (vendor && vendor.commissionRate !== null && vendor.commissionRate !== undefined) {
    const rate = Number(vendor.commissionRate);
    const commAmt = Math.round(((amount * rate) / 100) * 100) / 100;
    return {
      commissionRate: rate,
      commissionAmt: commAmt,
      payoutAmt: Math.round((amount - commAmt) * 100) / 100,
      ruleType: 'VENDOR_OVERRIDE',
      ruleName: `${vendor.name} সেলার কাস্টম চুক্তি (${rate}%)`,
    };
  }

  // 2. Check Category-based commission rule
  if (categorySlug) {
    const categoryRule = await prisma.commissionRule.findFirst({
      where: { categorySlug, isActive: true },
    });
    if (categoryRule) {
      const rate = Number(categoryRule.percentage);
      const commAmt = Math.round(((amount * rate) / 100) * 100) / 100;
      return {
        commissionRate: rate,
        commissionAmt: commAmt,
        payoutAmt: Math.round((amount - commAmt) * 100) / 100,
        ruleType: 'CATEGORY_RULE',
        ruleName: `${categoryRule.name} (${rate}%)`,
      };
    }
  }

  // 3. Check Vendor-specific commission rule
  const vendorRule = await prisma.commissionRule.findFirst({
    where: { vendorId, isActive: true },
  });
  if (vendorRule) {
    const rate = Number(vendorRule.percentage);
    const commAmt = Math.round(((amount * rate) / 100) * 100) / 100;
    return {
      commissionRate: rate,
      commissionAmt: commAmt,
      payoutAmt: Math.round((amount - commAmt) * 100) / 100,
      ruleType: 'VENDOR_RULE',
      ruleName: `${vendorRule.name} (${rate}%)`,
    };
  }

  // 4. Fallback to platform global default
  const commAmt = Math.round(((amount * DEFAULT_PLATFORM_COMMISSION) / 100) * 100) / 100;
  return {
    commissionRate: DEFAULT_PLATFORM_COMMISSION,
    commissionAmt: commAmt,
    payoutAmt: Math.round((amount - commAmt) * 100) / 100,
    ruleType: 'PLATFORM_DEFAULT',
    ruleName: `শুব্বান স্ট্যান্ডার্ড প্ল্যাটফর্ম কমিশন (${DEFAULT_PLATFORM_COMMISSION}%)`,
  };
}

/**
 * Adjusts an existing SubOrder's commission rate with complete double-entry auditable ledger logging.
 * Never modifies historical balances silently!
 */
export async function adjustSubOrderCommission(params: {
  subOrderId: string;
  newCommissionRate: number;
  reason: string;
  adminUserId: string;
}) {
  const { subOrderId, newCommissionRate, reason, adminUserId } = params;

  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: { vendor: true },
  });

  if (!subOrder) {
    throw new Error('সাব-অর্ডার পাওয়া যায়নি।');
  }

  const oldCommissionRate = subOrder.commissionRate;
  const oldPayoutAmt = subOrder.payoutAmt;

  const newCommissionAmt = Math.round(((subOrder.subtotal * newCommissionRate) / 100) * 100) / 100;
  const newPayoutAmt = Math.round((subOrder.subtotal - newCommissionAmt) * 100) / 100;
  const payoutDelta = Math.round((newPayoutAmt - oldPayoutAmt) * 100) / 100;

  return await prisma.$transaction(async (tx) => {
    // 1. Update SubOrder
    const updatedSubOrder = await tx.subOrder.update({
      where: { id: subOrderId },
      data: {
        commissionRate: newCommissionRate,
        commissionAmt: newCommissionAmt,
        payoutAmt: newPayoutAmt,
      },
    });

    // 2. Calculate current vendor balance to record balanceAfter accurately
    const subOrdersAgg = await tx.subOrder.aggregate({
      where: { vendorId: subOrder.vendorId },
      _sum: { payoutAmt: true },
    });
    const payouts = await tx.sellerPayout.findMany({
      where: {
        vendorId: subOrder.vendorId,
        status: { in: ['PAID', 'PROCESSING', 'REQUESTED', 'APPROVED'] },
      },
    });
    const currentTotalPayouts = subOrdersAgg._sum.payoutAmt || 0;
    const currentCommitted = payouts.reduce((acc, p) => acc + p.amount, 0);
    const balanceAfter = Math.max(0, currentTotalPayouts - currentCommitted);

    // 3. Append auditable SellerLedgerEntry
    const ledgerEntry = await tx.sellerLedgerEntry.create({
      data: {
        vendorId: subOrder.vendorId,
        subOrderId: subOrder.id,
        type: 'COMMISSION_ADJUSTMENT',
        amount: payoutDelta,
        balanceAfter,
        description: `সাব-অর্ডার #${subOrder.subOrderNumber}-এর কমিশন সমন্বয় (${oldCommissionRate}% -> ${newCommissionRate}%): ${reason}`,
      },
    });

    // 4. Create Audit Log
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'COMMISSION_ADJUSTED',
        entity: 'SubOrder',
        entityId: subOrder.id,
        details: JSON.stringify({
          subOrderNumber: subOrder.subOrderNumber,
          oldCommissionRate,
          newCommissionRate,
          oldPayoutAmt,
          newPayoutAmt,
          payoutDelta,
          reason,
        }),
      },
    });

    return {
      subOrder: updatedSubOrder,
      ledgerEntry,
      payoutDelta,
    };
  });
}

/**
 * Generates comprehensive seller financial statements with itemized sub-orders, commission breakdown, and ledger.
 */
export async function getSellerStatement(vendorId: string, startDate?: Date, endDate?: Date) {
  const whereSubOrder: any = { vendorId };
  if (startDate || endDate) {
    whereSubOrder.createdAt = {};
    if (startDate) whereSubOrder.createdAt.gte = startDate;
    if (endDate) whereSubOrder.createdAt.lte = endDate;
  }

  const [vendor, subOrders, payouts, ledgerEntries] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: vendorId },
    }),
    prisma.subOrder.findMany({
      where: whereSubOrder,
      include: {
        items: true,
        order: {
          select: {
            orderNumber: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sellerPayout.findMany({
      where: { vendorId },
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.sellerLedgerEntry.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  if (!vendor) {
    throw new Error('ভেন্ডর পাওয়া যায়নি।');
  }

  const grossSales = subOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalCommissionDeducted = subOrders.reduce((acc, o) => acc + o.commissionAmt, 0);
  const netEarnings = subOrders.reduce((acc, o) => acc + o.payoutAmt, 0);

  const totalPaidOut = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingPayouts = payouts
    .filter((p) => p.status === 'REQUESTED' || p.status === 'APPROVED' || p.status === 'PROCESSING')
    .reduce((acc, p) => acc + p.amount, 0);

  const availableBalance = Math.max(0, netEarnings - (totalPaidOut + pendingPayouts));

  return {
    vendor: {
      id: vendor.id,
      name: vendor.name,
      slug: vendor.slug,
      commissionRate: vendor.commissionRate ?? DEFAULT_PLATFORM_COMMISSION,
      bankName: vendor.bankName,
      bankAccountName: vendor.bankAccountName,
      bankAccountNumber: vendor.bankAccountNumber,
      bkashMerchantNumber: vendor.bkashMerchantNumber,
    },
    summary: {
      totalSubOrders: subOrders.length,
      grossSales,
      totalCommissionDeducted,
      netEarnings,
      totalPaidOut,
      pendingPayouts,
      availableBalance,
    },
    subOrders,
    payouts,
    ledgerEntries,
  };
}

/**
 * Pre-populates default marketplace commission rules if not already present.
 */
export async function seedDefaultCommissionRules() {
  const count = await prisma.commissionRule.count();
  if (count > 0) return;

  const defaultRules = [
    {
      name: 'ইসলামিক বই ও সাহিত্য',
      categorySlug: 'islamic-books',
      percentage: 8.0,
      description: 'ইসলামিক মৌলিক প্রকাশনা ও তাফসীর গ্রন্থের বিশেষ প্রণোদনা কমিশন',
    },
    {
      name: 'ইসলামিক লাইফস্টাইল ও আতর',
      categorySlug: 'islamic-lifestyle',
      percentage: 15.0,
      description: 'আতর, জায়নামাজ ও সুন্নাহ লাইফস্টাইল পণ্যসম্ভার',
    },
    {
      name: 'দর্সে নেযামী ও আরবি কিতাবাত',
      categorySlug: 'darse-nizami',
      percentage: 7.0,
      description: 'কওমি ও আলিয়া মাদরাসা পাঠ্যবই',
    },
    {
      name: 'সাধারণ বই ও উপন্যাস',
      categorySlug: 'general-literature',
      percentage: 12.0,
      description: 'সাহিত্য, গল্প ও সাধারণ ক্যাটালগ',
    },
  ];

  for (const rule of defaultRules) {
    await prisma.commissionRule.create({
      data: rule,
    });
  }
}

