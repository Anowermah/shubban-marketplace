import React from 'react';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminAdsManagerClient from '@/components/admin/ads/AdminAdsManagerClient';

export const revalidate = 0; // Dynamic server component for live Ads Network Control Center

export default async function AdminAdsManagerPage() {
  const operator = await getVerifiedSessionUser();
  if (!operator || !isAdmin(operator.role)) {
    redirect('/admin/login');
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

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
      timestamp: { gte: thirtyDaysAgo },
      eventType: 'IMPRESSION',
    },
  });

  const viewableImpressions = await prisma.adImpressionEvent.count({
    where: {
      timestamp: { gte: thirtyDaysAgo },
      eventType: 'VIEWABLE_IMPRESSION',
    },
  });

  const validClicks = await prisma.adClickEvent.count({
    where: {
      timestamp: { gte: thirtyDaysAgo },
      isValid: true,
    },
  });

  const invalidClicks = await prisma.adClickEvent.count({
    where: {
      timestamp: { gte: thirtyDaysAgo },
      isValid: false,
    },
  });

  const ctr = validImpressions > 0 ? Number(((validClicks / validImpressions) * 100).toFixed(2)) : 0;

  // 5. Financials
  const payments = await prisma.adPayment.findMany({
    where: {
      status: 'COMPLETED',
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { amount: true },
  });
  const receivedRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  const invoices = await prisma.adInvoice.findMany({
    where: {
      createdAt: { gte: thirtyDaysAgo },
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
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { amount: true },
  });
  const refundedAmount = refunds.reduce((sum, r) => sum + r.amount, 0);
  const netRevenue = receivedRevenue - refundedAmount;

  // 6. Recent Campaigns
  const recentCampaigns = await prisma.adCampaign.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      advertiser: { select: { companyName: true, name: true, email: true } },
      placements: { include: { placement: true } },
      _count: { select: { impressions: true, clicks: true } },
    },
  });

  // 7. Pending Approvals
  const pendingApprovals = await prisma.adCampaign.findMany({
    where: { approvalStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
    take: 5,
    include: {
      advertiser: true,
      creatives: { include: { creative: true } },
    },
  });

  const initialStats = {
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
  };

  return <AdminAdsManagerClient initialStats={initialStats} />;
}

