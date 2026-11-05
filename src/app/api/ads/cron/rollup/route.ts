import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Daily Metric Rollup Worker
 * Aggregates raw impression and click event streams into AdDailyMetric rollup table.
 * Idempotent: can be executed repeatedly for the same date without duplicate records.
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret') || req.headers.get('authorization')?.replace('Bearer ', '');
    const cronSecret = process.env.CRON_SECRET || 'shubban-cron-secret-key';

    // Verify caller: either matching secret or logged-in admin
    const session = await getVerifiedSessionUser();
    const isAuthorized = (secret && secret === cronSecret) || (session && isAdmin(session.role));

    if (!isAuthorized) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const targetDateStr = body.date || searchParams.get('date') || new Date().toISOString().slice(0, 10);

    // Compute day range in UTC
    const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

    // 1. Fetch raw impressions in this date range
    const impressions = await prisma.adImpressionEvent.findMany({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        campaignId: true,
        placementId: true,
        advertiserId: true,
        eventType: true,
        userIpHash: true,
      },
    });

    // 2. Fetch raw clicks in this date range
    const clicks = await prisma.adClickEvent.findMany({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay },
        isValid: true,
      },
      select: {
        campaignId: true,
        placementId: true,
        advertiserId: true,
        userIpHash: true,
      },
    });

    // 3. Group by (campaignId, placementId)
    const metricBuckets: Record<
      string,
      {
        campaignId: string;
        placementId: string;
        advertiserId: string;
        requests: number;
        impressions: number;
        viewable: number;
        clicks: number;
        uniqueIps: Set<string>;
      }
    > = {};

    for (const imp of impressions) {
      const key = `${imp.campaignId}_${imp.placementId}`;
      if (!metricBuckets[key]) {
        metricBuckets[key] = {
          campaignId: imp.campaignId,
          placementId: imp.placementId,
          advertiserId: imp.advertiserId,
          requests: 0,
          impressions: 0,
          viewable: 0,
          clicks: 0,
          uniqueIps: new Set(),
        };
      }

      if (imp.eventType === 'REQUEST') metricBuckets[key].requests++;
      if (imp.eventType === 'IMPRESSION') metricBuckets[key].impressions++;
      if (imp.eventType === 'VIEWABLE_IMPRESSION') metricBuckets[key].viewable++;
      if (imp.userIpHash) metricBuckets[key].uniqueIps.add(imp.userIpHash);
    }

    for (const clk of clicks) {
      const key = `${clk.campaignId}_${clk.placementId}`;
      if (!metricBuckets[key]) {
        metricBuckets[key] = {
          campaignId: clk.campaignId,
          placementId: clk.placementId,
          advertiserId: clk.advertiserId,
          requests: 0,
          impressions: 0,
          viewable: 0,
          clicks: 0,
          uniqueIps: new Set(),
        };
      }
      metricBuckets[key].clicks++;
      if (clk.userIpHash) metricBuckets[key].uniqueIps.add(clk.userIpHash);
    }

    // 4. Upsert into AdDailyMetric table
    let processedCount = 0;
    for (const bucket of Object.values(metricBuckets)) {
      await prisma.adDailyMetric.upsert({
        where: {
          date_campaignId_placementId: {
            date: targetDateStr,
            campaignId: bucket.campaignId,
            placementId: bucket.placementId,
          },
        },
        update: {
          requestsCount: bucket.requests,
          impressionsCount: bucket.impressions,
          viewableImpressionsCount: bucket.viewable,
          clicksCount: bucket.clicks,
          uniqueUsersCount: bucket.uniqueIps.size,
          updatedAt: new Date(),
        },
        create: {
          date: targetDateStr,
          campaignId: bucket.campaignId,
          placementId: bucket.placementId,
          advertiserId: bucket.advertiserId,
          requestsCount: bucket.requests,
          impressionsCount: bucket.impressions,
          viewableImpressionsCount: bucket.viewable,
          clicksCount: bucket.clicks,
          uniqueUsersCount: bucket.uniqueIps.size,
        },
      });
      processedCount++;
    }

    return NextResponse.json({
      success: true,
      date: targetDateStr,
      bucketsProcessed: processedCount,
      totalImpressions: impressions.length,
      totalClicks: clicks.length,
      message: `তারিখ ${targetDateStr} এর জন্য দৈনিক রোলআপ সফলভাবে সম্পন্ন হয়েছে।`,
    });
  } catch (err: any) {
    console.error('Error running daily rollup:', err);
    return NextResponse.json({ error: 'দৈনিক মেট্রিক রোলআপে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return POST(req);
}

