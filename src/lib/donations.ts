import { prisma } from './prisma';

export interface CreateCampaignInput {
  title: string;
  titleEn?: string;
  slug?: string;
  category:
    | 'RELIEF'
    | 'QURAN_DISTRIBUTION'
    | 'WINTER_AID'
    | 'WATER_WELL'
    | 'MOSQUE'
    | 'EDUCATION'
    | 'GENERAL_SADAQAH';
  description: string;
  story?: string;
  coverImage: string;
  goalAmount: number;
  startDate?: Date | string;
  endDate?: Date | string;
  isFeatured?: boolean;
}

export interface ProcessDonationInput {
  campaignId: string;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  isAnonymous?: boolean;
  amount: number;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  userId?: string;
}

export interface RefundDonationInput {
  donationId: string;
  reason: string;
  adminUserId: string;
}

export interface ReliefDisbursementInput {
  campaignId: string;
  amount: number;
  recipientDescription: string;
  referenceNumber?: string;
  adminUserId: string;
}

// ==========================================
// DONATION CAMPAIGN MANAGEMENT
// ==========================================

export async function createDonationCampaign(input: CreateCampaignInput, creatorUserId: string) {
  const {
    title,
    titleEn,
    slug,
    category,
    description,
    story,
    coverImage,
    goalAmount,
    startDate,
    endDate,
    isFeatured = true,
  } = input;

  if (goalAmount <= 0) {
    throw new Error('লক্ষ্যমাত্রা অবশ্যই শূন্যের চেয়ে বেশি হতে হবে।');
  }

  const campaignSlug =
    slug ||
    `${title
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, '-')
      .slice(0, 50)}-${Date.now().toString().slice(-4)}`;

  return await prisma.$transaction(async (tx) => {
    const campaign = await tx.donationCampaign.create({
      data: {
        title,
        titleEn: titleEn || null,
        slug: campaignSlug,
        category,
        description,
        story: story || null,
        coverImage: coverImage || '/images/hero-1.jpg',
        goalAmount: Number(goalAmount),
        raisedAmount: 0,
        donorCount: 0,
        status: 'ACTIVE',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isFeatured,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: creatorUserId,
        action: 'DONATION_CAMPAIGN_CREATED',
        entity: 'DonationCampaign',
        entityId: campaign.id,
        details: JSON.stringify({ title, category, goalAmount }),
      },
    });

    return campaign;
  });
}

// ==========================================
// ATOMIC DONATION PROCESSING & SEPARATE CHARITY LEDGER
// ==========================================

export async function processDonation(input: ProcessDonationInput) {
  const {
    campaignId,
    donorName,
    donorEmail,
    donorPhone,
    isAnonymous = false,
    amount,
    paymentMethod = 'bkash',
    transactionId,
    notes,
    userId,
  } = input;

  const donationAmount = Number(amount);
  if (!donationAmount || donationAmount <= 0) {
    throw new Error('অনুদানের সঠিক পরিমাণ আবশ্যক।');
  }

  if (!donorName || !donorName.trim()) {
    throw new Error('দাতার নাম প্রদান করা আবশ্যক।');
  }

  return await prisma.$transaction(async (tx) => {
    const campaign = await tx.donationCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('নির্দিষ্ট দান ও সদকাহ ক্যাম্পেইনটি পাওয়া যায়নি।');
    }

    if (campaign.status !== 'ACTIVE') {
      throw new Error('এই ক্যাম্পেইনটি বর্তমানে সক্রিয় নেই বা সম্পন্ন হয়েছে।');
    }

    const donationNum = `DON-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const receiptNum = `RCPT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
    const txnId = transactionId || `TXN-DON-${Date.now().toString().slice(-8)}`;

    // 1. Create Donation Record
    const donation = await tx.donation.create({
      data: {
        donationNumber: donationNum,
        campaignId,
        userId: userId || null,
        donorName: isAnonymous ? 'গোপন দানকারী (সদকাহ)' : donorName.trim(),
        donorEmail: donorEmail || null,
        donorPhone: donorPhone || null,
        isAnonymous: !!isAnonymous,
        amount: donationAmount,
        paymentMethod,
        transactionId: txnId,
        paymentStatus: 'PAID',
        receiptNumber: receiptNum,
        refundStatus: 'NONE',
        notes: notes || null,
      },
    });

    // 2. Create Official Donation Receipt with Tax Exemption Notice
    const receipt = await tx.donationReceipt.create({
      data: {
        receiptNumber: receiptNum,
        donationId: donation.id,
        donorName: isAnonymous ? 'সম্মানিত গোপন দানকারী' : donorName.trim(),
        campaignTitle: campaign.title,
        amount: donationAmount,
        paymentMethod:
          paymentMethod === 'bkash'
            ? 'বিকাশ (bKash)'
            : paymentMethod === 'nagad'
            ? 'নগদ (Nagad)'
            : paymentMethod === 'rocket'
            ? 'রকেট (Rocket)'
            : 'ব্যাংক স্থানান্তর / কার্ড',
        transactionId: txnId,
        taxExemptInfo:
          'শুব্বান ওয়েলফেয়ার ট্রাস্ট ও আস-সুন্নাহ সদকাহ ফান্ড স্বীকৃত (সদকাহ ও দান প্রযোজ্য)',
      },
    });

    // 3. Dedicated Charity Ledger Calculation (Completely Isolated from Seller Revenue)
    const latestLedger = await tx.donationLedgerEntry.findFirst({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });

    const previousBalance = latestLedger ? latestLedger.balanceAfter : 0;
    const newBalance = previousBalance + donationAmount;

    const ledgerEntry = await tx.donationLedgerEntry.create({
      data: {
        campaignId,
        donationId: donation.id,
        type: 'DONATION_CREDIT',
        amount: donationAmount,
        balanceAfter: newBalance,
        referenceNumber: receiptNum,
        description: `অনলাইন সদকাহ/অনুদান ক্রেডিট (${paymentMethod})`,
        recordedBy: 'SYSTEM_GATEWAY',
      },
    });

    // 4. Update Campaign Stats Accurately (No Fake Data)
    const updatedCampaign = await tx.donationCampaign.update({
      where: { id: campaignId },
      data: {
        raisedAmount: { increment: donationAmount },
        donorCount: { increment: 1 },
      },
    });

    // 5. Payment Transaction Record
    await tx.paymentTransaction.create({
      data: {
        donationId: donation.id,
        gateway: paymentMethod.toUpperCase(),
        amount: donationAmount,
        currency: 'BDT',
        transactionId: txnId,
        status: 'SUCCESS',
        gatewayResponse: JSON.stringify({
          type: 'CHARITY_DONATION',
          campaign: campaign.title,
          receiptNumber: receiptNum,
        }),
      },
    });

    return {
      donation,
      receipt,
      ledgerEntry,
      campaign: updatedCampaign,
    };
  });
}

// ==========================================
// REFUND HANDLING WITH AUDIT LOG & CHARITY DEBIT
// ==========================================

export async function refundDonation(input: RefundDonationInput) {
  const { donationId, reason, adminUserId } = input;

  if (!reason || !reason.trim()) {
    throw new Error('অনুদান রিফান্ডের কারণ উল্লেখ করা আবশ্যক।');
  }

  return await prisma.$transaction(async (tx) => {
    const donation = await tx.donation.findUnique({
      where: { id: donationId },
      include: { campaign: true },
    });

    if (!donation) {
      throw new Error('অনুদান রেকর্ড পাওয়া যায়নি।');
    }

    if (donation.refundStatus === 'REFUNDED') {
      throw new Error('এই অনুদানটি ইতিমধ্যে রিফান্ড করা হয়েছে।');
    }

    if (donation.paymentStatus !== 'PAID') {
      throw new Error('শুধুমাত্র সফল অনুদানই রিফান্ডযোগ্য।');
    }

    // 1. Calculate Charity Ledger Balance After Debit
    const latestLedger = await tx.donationLedgerEntry.findFirst({
      where: { campaignId: donation.campaignId },
      orderBy: { createdAt: 'desc' },
    });

    const previousBalance = latestLedger ? latestLedger.balanceAfter : 0;
    const newBalance = Math.max(0, previousBalance - donation.amount);

    // 2. Create REFUND_DEBIT in Charity Ledger
    const ledgerEntry = await tx.donationLedgerEntry.create({
      data: {
        campaignId: donation.campaignId,
        donationId: donation.id,
        type: 'REFUND_DEBIT',
        amount: donation.amount,
        balanceAfter: newBalance,
        referenceNumber: donation.receiptNumber,
        description: `অনুদাতার অনুরোধে রিফান্ড: ${reason.trim()}`,
        recordedBy: adminUserId,
      },
    });

    // 3. Update Donation Status
    const updatedDonation = await tx.donation.update({
      where: { id: donationId },
      data: {
        refundStatus: 'REFUNDED',
        refundedAt: new Date(),
        refundReason: reason.trim(),
      },
    });

    // 4. Update Campaign Raised Amount & Donor Count
    const updatedCampaign = await tx.donationCampaign.update({
      where: { id: donation.campaignId },
      data: {
        raisedAmount: { decrement: donation.amount },
        donorCount: { decrement: 1 },
      },
    });

    // 5. Audit Log
    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'DONATION_REFUNDED',
        entity: 'Donation',
        entityId: donation.id,
        details: JSON.stringify({
          amount: donation.amount,
          receiptNumber: donation.receiptNumber,
          campaignId: donation.campaignId,
          reason,
        }),
      },
    });

    return {
      donation: updatedDonation,
      ledgerEntry,
      campaign: updatedCampaign,
    };
  });
}

// ==========================================
// RELIEF FUND DISBURSEMENT (SADAQAH DISTRIBUTION)
// ==========================================

export async function disburseReliefFund(input: ReliefDisbursementInput) {
  const { campaignId, amount, recipientDescription, referenceNumber, adminUserId } = input;

  const disbAmount = Number(amount);
  if (disbAmount <= 0) {
    throw new Error('বিতরণের পরিমাণ শূন্যের চেয়ে বেশি হতে হবে।');
  }

  if (!recipientDescription || !recipientDescription.trim()) {
    throw new Error('ত্রাণ বা সহায়তা বিতরণের বিস্তারিত খাত ও বিবরণ প্রদান আবশ্যক।');
  }

  return await prisma.$transaction(async (tx) => {
    const campaign = await tx.donationCampaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new Error('ক্যাম্পেইন পাওয়া যায়নি।');
    }

    const latestLedger = await tx.donationLedgerEntry.findFirst({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    });

    const previousBalance = latestLedger ? latestLedger.balanceAfter : 0;
    if (previousBalance < disbAmount) {
      throw new Error(
        `তহবিলে অপর্যাপ্ত অর্থ। বর্তমান ব্যালেন্স: ৳${previousBalance}, বিতরণের আবেদন: ৳${disbAmount}`
      );
    }

    const newBalance = previousBalance - disbAmount;
    const refNum = referenceNumber || `DISB-${Date.now().toString().slice(-8)}`;

    const ledgerEntry = await tx.donationLedgerEntry.create({
      data: {
        campaignId,
        type: 'RELIEF_DISBURSEMENT_DEBIT',
        amount: disbAmount,
        balanceAfter: newBalance,
        referenceNumber: refNum,
        description: `ত্রাণ/সাহায্য বিতরণ: ${recipientDescription.trim()}`,
        recordedBy: adminUserId,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'RELIEF_FUND_DISBURSED',
        entity: 'DonationCampaign',
        entityId: campaignId,
        details: JSON.stringify({
          disbursedAmount: disbAmount,
          newBalance,
          recipientDescription,
          referenceNumber: refNum,
        }),
      },
    });

    return {
      campaign,
      ledgerEntry,
      currentFundBalance: newBalance,
    };
  });
}

// ==========================================
// FINANCIAL RECONCILIATION & INTEGRITY CHECKS
// ==========================================

export async function reconcileDonations(campaignId?: string) {
  const campaigns = await prisma.donationCampaign.findMany({
    where: campaignId ? { id: campaignId } : {},
    include: {
      donations: true,
    },
  });

  const reconciliationReports = await Promise.all(
    campaigns.map(async (camp) => {
      // 1. Get all ledger entries for this campaign
      const ledgerEntries = await prisma.donationLedgerEntry.findMany({
        where: { campaignId: camp.id },
        orderBy: { createdAt: 'asc' },
      });

      const totalCredits = ledgerEntries
        .filter((l) => l.type === 'DONATION_CREDIT')
        .reduce((sum, l) => sum + l.amount, 0);

      const totalRefundDebits = ledgerEntries
        .filter((l) => l.type === 'REFUND_DEBIT')
        .reduce((sum, l) => sum + l.amount, 0);

      const totalReliefDebits = ledgerEntries
        .filter((l) => l.type === 'RELIEF_DISBURSEMENT_DEBIT')
        .reduce((sum, l) => sum + l.amount, 0);

      const netFundBalance = totalCredits - totalRefundDebits - totalReliefDebits;

      // 2. Calculate verified donation sums from Donation table
      const activeDonations = camp.donations.filter(
        (d) => d.paymentStatus === 'PAID' && d.refundStatus !== 'REFUNDED'
      );
      const refundedDonations = camp.donations.filter((d) => d.refundStatus === 'REFUNDED');

      const sumActiveDonations = activeDonations.reduce((sum, d) => sum + d.amount, 0);
      const sumRefundedDonations = refundedDonations.reduce((sum, d) => sum + d.amount, 0);

      // 3. Parity checks
      const campaignRaisedMatchesActiveDonations =
        Math.abs(camp.raisedAmount - sumActiveDonations) < 0.01;

      const ledgerCreditMatchesDonations =
        Math.abs(totalCredits - (sumActiveDonations + sumRefundedDonations)) < 0.01;

      const refundParity = Math.abs(totalRefundDebits - sumRefundedDonations) < 0.01;

      const isBalanced =
        campaignRaisedMatchesActiveDonations &&
        ledgerCreditMatchesDonations &&
        refundParity;

      return {
        campaignId: camp.id,
        title: camp.title,
        status: camp.status,
        goalAmount: camp.goalAmount,
        campaignRaisedAmount: camp.raisedAmount,
        activeDonorsCount: camp.donorCount,
        sumActiveDonations,
        sumRefundedDonations,
        totalLedgerCredits: totalCredits,
        totalRefundDebits,
        totalReliefDebits,
        netCharityFundBalance: netFundBalance,
        isBalanced,
        discrepancy: Math.abs(camp.raisedAmount - sumActiveDonations),
        ledgerCount: ledgerEntries.length,
      };
    })
  );

  const overallTotalRaised = reconciliationReports.reduce(
    (sum, r) => sum + r.campaignRaisedAmount,
    0
  );
  const overallNetBalance = reconciliationReports.reduce(
    (sum, r) => sum + r.netCharityFundBalance,
    0
  );
  const allBalanced = reconciliationReports.every((r) => r.isBalanced);

  return {
    reconciledAt: new Date(),
    allBalanced,
    overallTotalRaised,
    overallNetBalance,
    reports: reconciliationReports,
  };
}

// ==========================================
// COMPREHENSIVE CHARITY REPORTING
// ==========================================

export async function getDonationReports() {
  const [campaigns, donations, ledgerEntries] = await Promise.all([
    prisma.donationCampaign.findMany({
      include: {
        _count: { select: { donations: true } },
      },
      orderBy: { raisedAmount: 'desc' },
    }),
    prisma.donation.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.donationLedgerEntry.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const activeDonations = donations.filter((d) => d.refundStatus !== 'REFUNDED');
  const refundedDonations = donations.filter((d) => d.refundStatus === 'REFUNDED');
  const anonymousDonations = activeDonations.filter((d) => d.isAnonymous);

  const totalRaised = activeDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalRefunded = refundedDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalReliefDisbursed = ledgerEntries
    .filter((l) => l.type === 'RELIEF_DISBURSEMENT_DEBIT')
    .reduce((sum, l) => sum + l.amount, 0);

  const netCharityBalance = totalRaised - totalReliefDisbursed;

  // Breakdown by payment method
  const paymentMethodBreakdown: Record<string, { count: number; total: number }> = {};
  for (const d of activeDonations) {
    const method = d.paymentMethod || 'other';
    if (!paymentMethodBreakdown[method]) {
      paymentMethodBreakdown[method] = { count: 0, total: 0 };
    }
    paymentMethodBreakdown[method].count += 1;
    paymentMethodBreakdown[method].total += d.amount;
  }

  // Breakdown by campaign category
  const categoryBreakdown: Record<string, { count: number; total: number }> = {};
  for (const c of campaigns) {
    if (!categoryBreakdown[c.category]) {
      categoryBreakdown[c.category] = { count: 0, total: 0 };
    }
    categoryBreakdown[c.category].count += 1;
    categoryBreakdown[c.category].total += c.raisedAmount;
  }

  return {
    metrics: {
      totalCampaigns: campaigns.length,
      totalActiveDonations: activeDonations.length,
      totalRaised,
      totalRefunded,
      totalReliefDisbursed,
      netCharityBalance,
      anonymousDonationsCount: anonymousDonations.length,
      anonymousPercentage:
        activeDonations.length > 0
          ? Math.round((anonymousDonations.length / activeDonations.length) * 100)
          : 0,
    },
    paymentMethodBreakdown,
    categoryBreakdown,
    campaigns,
    recentLedgerEntries: ledgerEntries.slice(0, 15),
  };
}

