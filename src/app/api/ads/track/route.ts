import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function isKnownBot(ua: string | null): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return (
    lower.includes('bot') ||
    lower.includes('crawler') ||
    lower.includes('spider') ||
    lower.includes('googlebot') ||
    lower.includes('bingbot') ||
    lower.includes('slurp') ||
    lower.includes('headless') ||
    lower.includes('selenium') ||
    lower.includes('puppeteer')
  );
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const limitCheck = rateLimit(clientIp, { limit: 300, windowMs: 60 * 1000, prefix: 'ad_track' });
    if (!limitCheck.success) {
      return NextResponse.json({ success: false, error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await req.json();
    const { eventType, campaignId, creativeId, placementId, advertiserId, pageUrl, deviceClass } = body;

    if (!campaignId || !creativeId || !placementId) {
      return NextResponse.json({ success: false, error: 'Missing event identifiers' }, { status: 400 });
    }

    const ua = req.headers.get('user-agent') || '';
    if (isKnownBot(ua)) {
      return NextResponse.json({ success: true, filtered: 'bot' });
    }

    // Privacy-preserving Hash of IP + Salt + Date
    const dateSalt = new Date().toISOString().slice(0, 10);
    const userIpHash = crypto
      .createHash('sha256')
      .update(`${clientIp}-${ua}-${dateSalt}`)
      .digest('hex');

    const validEventType = eventType === 'VIEWABLE_IMPRESSION' ? 'VIEWABLE_IMPRESSION' : 'IMPRESSION';

    // Insert impression event asynchronously
    (async () => {
      try {
        let targetPlacementId = placementId;
        const foundPlacement = await prisma.adPlacement.findFirst({
          where: { OR: [{ id: placementId }, { placementKey: placementId }] },
          select: { id: true },
        });
        if (foundPlacement) {
          targetPlacementId = foundPlacement.id;
        }

        await prisma.adImpressionEvent.create({
          data: {
            eventType: validEventType,
            campaignId,
            creativeId,
            placementId: targetPlacementId,
            advertiserId: advertiserId || '',
            userIpHash,
            deviceClass: deviceClass || 'DESKTOP',
            pageUrl: pageUrl || '',
          },
        });

        // Update pre-aggregated daily metrics
        const today = new Date().toISOString().slice(0, 10);
        await prisma.adDailyMetric.upsert({
          where: {
            date_campaignId_placementId: {
              date: today,
              campaignId,
              placementId: targetPlacementId,
            },
          },
          update: {
            impressionsCount: validEventType === 'IMPRESSION' ? { increment: 1 } : undefined,
            viewableImpressionsCount: validEventType === 'VIEWABLE_IMPRESSION' ? { increment: 1 } : undefined,
          },
          create: {
            date: today,
            campaignId,
            placementId: targetPlacementId,
            advertiserId: advertiserId || null,
            impressionsCount: validEventType === 'IMPRESSION' ? 1 : 0,
            viewableImpressionsCount: validEventType === 'VIEWABLE_IMPRESSION' ? 1 : 0,
          },
        });
      } catch (err) {
        console.error('Error recording ad impression event:', err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Ad tracking API error:', err);
    return NextResponse.json({ success: false, error: 'Tracking failed' }, { status: 500 });
  }
}

