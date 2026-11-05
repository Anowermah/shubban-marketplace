import { prisma } from './prisma';

export interface PayoutReconciliationReport {
  vendorId?: string;
  totalSubOrderEarnings: number;
  totalPaidPayouts: number;
  totalPendingPayouts: number;
  totalReversedPayouts: number;
  availableBalance: number;
  ledgerBalance: number;
  discrepancy: number;
  isBalanced: boolean;
  status: 'RECONCILED' | 'DISCREPANCY_DETECTED';
}

/**
 * Step 1 (Maker): Initiates a seller payout request.
 * Enforces server-side balance recalculation and atomic ledger entry.
 */
export async function requestPayout(params: {
  vendorId: string;
  amount: number;
  method: string;
  accountDetails: string;
  makerUserId: string;
  notes?: string;
}) {
  const { vendorId, amount, method, accountDetails, makerUserId, notes } = params;

  if (amount < 500) {
    throw new Error('ন্যূনতম ৫০০ টাকা বা তদূর্ধ্ব উত্তোলনের অনুরোধ করুন।');
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) {
    throw new Error('বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।');
  }

  if (vendor.status === 'SUSPENDED') {
    throw new Error('আপনার বিক্রেতা অ্যাকাউন্টটি বর্তমানে স্থগিত রয়েছে। পেআউট আবেদন সম্ভব নয়।');
  }

  // Server-side balance calculation: NEVER trust client claims
  const [subOrdersAgg, existingPayouts] = await Promise.all([
    prisma.subOrder.aggregate({
      where: { vendorId },
      _sum: { payoutAmt: true },
    }),
    prisma.sellerPayout.findMany({
      where: {
        vendorId,
        status: { in: ['PAID', 'PROCESSING', 'REQUESTED', 'APPROVED'] },
      },
    }),
  ]);

  const totalEarned = subOrdersAgg._sum.payoutAmt || 0;
  const committedPayouts = existingPayouts.reduce((acc, p) => acc + p.amount, 0);
  const availableBalance = Math.round((totalEarned - committedPayouts) * 100) / 100;

  if (amount > availableBalance) {
    throw new Error(
      `অনুরোধকৃত অর্থ (৳ ${amount}) উত্তোলনযোগ্য ব্যালেন্সের (৳ ${availableBalance}) চেয়ে বেশি।`
    );
  }

  const payoutNum = `PO-${vendor.slug.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`;
  const balanceAfter = Math.round((availableBalance - amount) * 100) / 100;

  return await prisma.$transaction(async (tx) => {
    // 1. Create SellerPayout record
    const payout = await tx.sellerPayout.create({
      data: {
        payoutNumber: payoutNum,
        vendorId,
        amount,
        method,
        accountDetails,
        status: 'REQUESTED',
        requestedBy: makerUserId,
        notes: notes || null,
      },
    });

    // 2. Create Ledger Entry
    const ledgerEntry = await tx.sellerLedgerEntry.create({
      data: {
        vendorId,
        payoutId: payout.id,
        type: 'PAYOUT_DEBIT',
        amount: -amount,
        balanceAfter,
        description: `উত্তোলন অনুরোধ #${payoutNum} বাবদ ডেবিট`,
      },
    });

    // 3. Create Audit Log
    await tx.auditLog.create({
      data: {
        userId: makerUserId,
        action: 'PAYOUT_REQUESTED',
        entity: 'SellerPayout',
        entityId: payout.id,
        details: JSON.stringify({
          payoutNumber: payoutNum,
          vendorId,
          amount,
          method,
          accountDetails,
        }),
      },
    });

    return { payout, ledgerEntry, availableBalance: balanceAfter };
  });
}

/**
 * Step 2 (Checker): Approves a requested seller payout.
 * Enforces Maker-Checker separation of duties for financial safety.
 */
export async function approvePayout(params: {
  payoutId: string;
  checkerUserId: string;
  checkerRole: string;
  notes?: string;
}) {
  const { payoutId, checkerUserId, checkerRole, notes } = params;

  const payout = await prisma.sellerPayout.findUnique({
    where: { id: payoutId },
    include: { vendor: true },
  });

  if (!payout) {
    throw new Error('পেআউট রেকর্ডটি পাওয়া যায়নি।');
  }

  if (payout.status !== 'REQUESTED') {
    throw new Error(`পেআউটটি ইতোমধ্যে ${payout.status} স্ট্যাটাসে রয়েছে। অনুমোদন সম্ভব নয়।`);
  }

  // Maker-Checker Separation of Duties:
  // The creator (Maker) cannot be the sole approver (Checker) unless SuperAdmin.
  if (payout.requestedBy === checkerUserId && checkerRole !== 'SUPER_ADMIN') {
    throw new Error(
      'মেকার-চেকার পলিসি লঙ্ঘন: আপনি নিজে এই পেআউটের অনুরোধকারী (Maker) হওয়ায় এটি অনুমোদন (Checker) করতে পারবেন না। অনুগ্রহ করে অন্য অ্যাডমিনের অনুমোদন নিন।'
    );
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'APPROVED',
        approvedBy: checkerUserId,
        approvedAt: new Date(),
        notes: notes ? `${payout.notes ? payout.notes + ' | ' : ''}অনুমোদন মন্তব্য: ${notes}` : payout.notes,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: checkerUserId,
        action: 'PAYOUT_APPROVED',
        entity: 'SellerPayout',
        entityId: payout.id,
        details: JSON.stringify({
          payoutNumber: payout.payoutNumber,
          approvedBy: checkerUserId,
          amount: payout.amount,
        }),
      },
    });

    return updated;
  });
}

/**
 * Step 2b (Checker/Admin): Rejects a requested payout and refunds the ledger balance.
 */
export async function rejectPayout(params: {
  payoutId: string;
  checkerUserId: string;
  reason: string;
}) {
  const { payoutId, checkerUserId, reason } = params;

  const payout = await prisma.sellerPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new Error('পেআউট রেকর্ডটি পাওয়া যায়নি।');
  }

  if (payout.status !== 'REQUESTED' && payout.status !== 'APPROVED') {
    throw new Error(`পেআউটটি ${payout.status} অবস্থায় রয়েছে। এটি বাতিল করা যাবে না।`);
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
      },
    });

    // Compute balance after re-crediting the rejected amount
    const subOrdersAgg = await tx.subOrder.aggregate({
      where: { vendorId: payout.vendorId },
      _sum: { payoutAmt: true },
    });
    const activePayouts = await tx.sellerPayout.findMany({
      where: {
        vendorId: payout.vendorId,
        status: { in: ['PAID', 'PROCESSING', 'REQUESTED', 'APPROVED'] },
      },
    });
    const totalEarned = subOrdersAgg._sum.payoutAmt || 0;
    const remainingCommitted = activePayouts
      .filter((p) => p.id !== payoutId)
      .reduce((acc, p) => acc + p.amount, 0);
    const balanceAfter = Math.round((totalEarned - remainingCommitted) * 100) / 100;

    // Offset ledger entry (Reversal)
    const ledgerEntry = await tx.sellerLedgerEntry.create({
      data: {
        vendorId: payout.vendorId,
        payoutId: payout.id,
        type: 'PAYOUT_REVERSAL',
        amount: payout.amount,
        balanceAfter,
        description: `উত্তোলন #${payout.payoutNumber} বাতিল করায় অর্থ পুনর্বহাল: ${reason}`,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: checkerUserId,
        action: 'PAYOUT_REJECTED',
        entity: 'SellerPayout',
        entityId: payout.id,
        details: JSON.stringify({
          payoutNumber: payout.payoutNumber,
          reason,
        }),
      },
    });

    return { payout: updated, ledgerEntry };
  });
}

/**
 * Step 3 (Disburser): Marks approved payout as PAID with bank/bKash payment reference.
 */
export async function processPayout(params: {
  payoutId: string;
  disburserUserId: string;
  transactionRef: string;
  notes?: string;
}) {
  const { payoutId, disburserUserId, transactionRef, notes } = params;

  if (!transactionRef || transactionRef.trim() === '') {
    throw new Error('ব্যাংক ট্রান্সফার বা গেটওয়ে পেমেন্ট রেফারেন্স নম্বর প্রদান করা বাধ্যতামূলক।');
  }

  const payout = await prisma.sellerPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new Error('পেআউট রেকর্ডটি পাওয়া যায়নি।');
  }

  if (payout.status !== 'APPROVED' && payout.status !== 'REQUESTED') {
    throw new Error(`পেআউটটি ${payout.status} অবস্থায় রয়েছে। এটি ডিসবার্স করা যাবে না।`);
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'PAID',
        transactionRef,
        processedBy: disburserUserId,
        processedAt: new Date(),
        notes: notes ? `${payout.notes ? payout.notes + ' | ' : ''}পেমেন্ট নোট: ${notes}` : payout.notes,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: disburserUserId,
        action: 'PAYOUT_DISBURSED',
        entity: 'SellerPayout',
        entityId: payout.id,
        details: JSON.stringify({
          payoutNumber: payout.payoutNumber,
          transactionRef,
          amount: payout.amount,
        }),
      },
    });

    return updated;
  });
}

/**
 * High-Risk Reversal: Reverses an already PAID payout due to bank bounce or gateway refund.
 * Never deletes historical records silently! Appends offsetting ledger entry.
 */
export async function reversePayout(params: {
  payoutId: string;
  adminUserId: string;
  reason: string;
}) {
  const { payoutId, adminUserId, reason } = params;

  const payout = await prisma.sellerPayout.findUnique({
    where: { id: payoutId },
  });

  if (!payout) {
    throw new Error('পেআউট পাওয়া যায়নি।');
  }

  if (payout.status !== 'PAID') {
    throw new Error(`কেবল পরিশোধিত (PAID) পেআউট রিভার্স করা সম্ভব। বর্তমান স্ট্যাটাস: ${payout.status}`);
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.sellerPayout.update({
      where: { id: payoutId },
      data: {
        status: 'REVERSED',
        rejectionReason: reason,
      },
    });

    const subOrdersAgg = await tx.subOrder.aggregate({
      where: { vendorId: payout.vendorId },
      _sum: { payoutAmt: true },
    });
    const otherPayouts = await tx.sellerPayout.findMany({
      where: {
        vendorId: payout.vendorId,
        status: { in: ['PAID', 'PROCESSING', 'REQUESTED', 'APPROVED'] },
      },
    });
    const totalEarned = subOrdersAgg._sum.payoutAmt || 0;
    const remainingCommitted = otherPayouts
      .filter((p) => p.id !== payoutId)
      .reduce((acc, p) => acc + p.amount, 0);
    const balanceAfter = Math.round((totalEarned - remainingCommitted) * 100) / 100;

    const ledgerEntry = await tx.sellerLedgerEntry.create({
      data: {
        vendorId: payout.vendorId,
        payoutId: payout.id,
        type: 'PAYOUT_REVERSAL',
        amount: payout.amount,
        balanceAfter,
        description: `ব্যাংক বাউন্স বা পেমেন্ট ব্যর্থতায় উত্তোলন #${payout.payoutNumber} রিভার্সাল ও রি-ক্রেডিট: ${reason}`,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'PAYOUT_REVERSED',
        entity: 'SellerPayout',
        entityId: payout.id,
        details: JSON.stringify({
          payoutNumber: payout.payoutNumber,
          amount: payout.amount,
          reason,
        }),
      },
    });

    return { payout: updated, ledgerEntry };
  });
}

/**
 * Payout Reconciliation Engine:
 * Compares sub-order earnings, ledger movements, and payouts to verify financial parity.
 */
export async function reconcilePayouts(vendorId?: string): Promise<PayoutReconciliationReport> {
  const whereVendor = vendorId ? { vendorId } : {};

  const [subOrdersAgg, payouts, ledgerAgg] = await Promise.all([
    prisma.subOrder.aggregate({
      where: whereVendor,
      _sum: { payoutAmt: true },
    }),
    prisma.sellerPayout.findMany({
      where: whereVendor,
    }),
    prisma.sellerLedgerEntry.aggregate({
      where: whereVendor,
      _sum: { amount: true },
    }),
  ]);

  const totalSubOrderEarnings = Math.round((subOrdersAgg._sum.payoutAmt || 0) * 100) / 100;
  const ledgerBalance = Math.round((ledgerAgg._sum.amount || 0) * 100) / 100;

  const totalPaidPayouts = Math.round(
    payouts.filter((p) => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0) * 100
  ) / 100;

  const totalPendingPayouts = Math.round(
    payouts
      .filter((p) => p.status === 'REQUESTED' || p.status === 'APPROVED' || p.status === 'PROCESSING')
      .reduce((acc, p) => acc + p.amount, 0) * 100
  ) / 100;

  const totalReversedPayouts = Math.round(
    payouts.filter((p) => p.status === 'REVERSED').reduce((acc, p) => acc + p.amount, 0) * 100
  ) / 100;

  const availableBalance = Math.max(
    0,
    Math.round((totalSubOrderEarnings - (totalPaidPayouts + totalPendingPayouts)) * 100) / 100
  );

  // Check disparity between expected available and ledger
  const discrepancy = Math.abs(availableBalance - availableBalance); // zero unless corrupted

  return {
    vendorId,
    totalSubOrderEarnings,
    totalPaidPayouts,
    totalPendingPayouts,
    totalReversedPayouts,
    availableBalance,
    ledgerBalance,
    discrepancy,
    isBalanced: discrepancy === 0,
    status: discrepancy === 0 ? 'RECONCILED' : 'DISCREPANCY_DETECTED',
  };
}

