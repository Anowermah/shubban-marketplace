import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'last_30_days';

    const now = new Date();
    let startDate = new Date();

    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'yesterday') {
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === 'last_7_days') {
      startDate.setDate(now.getDate() - 7);
    } else if (range === 'last_30_days') {
      startDate.setDate(now.getDate() - 30);
    } else if (range === 'last_90_days') {
      startDate.setDate(now.getDate() - 90);
    } else if (range === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate.setDate(now.getDate() - 30);
    }

    // 1. Advertisers counts
    const totalAdvertisers = await prisma.advertiser.count();
    const activeAdvertisers = await prisma.advertiser.count({ where: { status: 'ACTIVE' } });
    const pendingAdvertisers = await prisma.advertiser.count({ where: { status: 'PENDING' } });

    // 2. Campaigns counts
    const totalCampaigns = await prisma.adCampaign.count();
    const activeCampaigns = await prisma.adCampaign.count({ where: { status: 'ACTIVE' } });
    const pendingCampaigns = await prisma.adCampaign.count({ where: { approvalStatus: 'SUBMITTED' } });
    const rejectedCampaigns = await prisma.adCampaign.count({ where: { approvalStatus: 'REJECTED' } });
    const scheduledCampaigns = await prisma.adCampaign.count({ where: { status: 'SCHEDULED' } });

    // 3. Placements counts
    const totalPlacements = await prisma.adPlacement.count();
    const activePlacements = await prisma.adPlacement.count({ where: { status: 'ACTIVE' } });

    // 4. Tracking events (from actual DB tables)
    const validImpressions = await prisma.adImpressionEvent.count({
      where: {
        timestamp: { gte: startDate },
        eventType: 'IMPRESSION',
      },
    });

    const viewableImpressions = await prisma.adImpressionEvent.count({
      where: {
        timestamp: { gte: startDate },
        eventType: 'VIEWABLE_IMPRESSION',
      },
    });

    const validClicks = await prisma.adClickEvent.count({
      where: {
        timestamp: { gte: startDate },
        isValid: true,
      },
    });

    const invalidClicks = await prisma.adClickEvent.count({
      where: {
        timestamp: { gte: startDate },
        isValid: false,
      },
    });

    const ctr = validImpressions > 0 ? Number(((validClicks / validImpressions) * 100).toFixed(2)) : 0;

    // 5. Financials (strict database aggregation)
    const payments = await prisma.adPayment.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate },
      },
      select: { amount: true },
    });
    const receivedRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    const invoices = await prisma.adInvoice.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: { totalAmount: true, status: true },
    });
    const invoicedRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const outstandingPayments = invoices
      .filter((inv) => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
      .reduce((sum, inv) => sum + inv.totalAmount, 0);

    const refunds = await prisma.adRefund.findMany({
      where: {
        status: 'PROCESSED',
        createdAt: { gte: startDate },
      },
      select: { amount: true },
    });
    const refundedAmount = refunds.reduce((sum, r) => sum + r.amount, 0);

    const netRevenue = receivedRevenue - refundedAmount;

    // 6. Recent Campaigns for dashboard table
    const recentCampaigns = await prisma.adCampaign.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        advertiser: { select: { companyName: true, name: true, email: true } },
        placements: { include: { placement: true } },
        _count: { select: { impressions: true, clicks: true } },
      },
    });

    // 7. Recent Pending Approvals
    const pendingApprovals = await prisma.adCampaign.findMany({
      where: { approvalStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      take: 5,
      include: {
        advertiser: true,
        creatives: { include: { creative: true } },
      },
    });

    return NextResponse.json({
      success: true,
      range,
      metrics: {
        totalAdvertisers,
        activeAdvertisers,
        pendingAdvertisers,
        totalCampaigns,
        activeCampaigns,
        pendingCampaigns,
        rejectedCampaigns,
        scheduledCampaigns,
        totalPlacements,
        activePlacements,
        validImpressions,
        viewableImpressions,
        validClicks,
        invalidClicks,
        ctr,
        invoicedRevenue,
        receivedRevenue,
        outstandingPayments,
        refundedAmount,
        netRevenue,
      },
      recentCampaigns,
      pendingApprovals,
    });
  } catch (err: any) {
    console.error('Error fetching admin ads stats:', err);
    return NextResponse.json({ error: 'পরিসংখ্যান লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

