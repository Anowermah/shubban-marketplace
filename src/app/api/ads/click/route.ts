import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/rate-limit';
import { validateDestinationUrl } from '@/lib/ads/creative-validator';
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
    lower.includes('duckduckbot') ||
    lower.includes('baiduspider') ||
    lower.includes('yandexbot') ||
    lower.includes('facebookexternalhit')
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get('cid');
    const creativeId = searchParams.get('crid');
    const placementId = searchParams.get('pid');
    const rawDest = searchParams.get('dest') || '/';

    const urlCheck = validateDestinationUrl(rawDest);
    const destinationUrl = urlCheck.valid && urlCheck.cleanUrl ? urlCheck.cleanUrl : '/';

    if (!campaignId || !creativeId || !placementId) {
      return NextResponse.redirect(new URL(destinationUrl, req.url));
    }

    const clientIp = getClientIp(req);
    const ua = req.headers.get('user-agent') || '';
    const isBot = isKnownBot(ua);

    // Privacy-preserving SHA-256 IP Hash
    const dateSalt = new Date().toISOString().slice(0, 10);
    const userIpHash = crypto
      .createHash('sha256')
      .update(`${clientIp}-${ua}-${dateSalt}`)
      .digest('hex');

    // Run recording in background so user is instantly redirected
    (async () => {
      try {
        const campaign = await prisma.adCampaign.findUnique({
          where: { id: campaignId },
          select: { id: true, advertiserId: true, pricingModel: true, agreedPrice: true },
        });

        if (!campaign) return;

        // Rapid click detection: check if same ip hash clicked this creative within 3 seconds
        const threeSecondsAgo = new Date(Date.now() - 3000);
        const recentClick = await prisma.adClickEvent.findFirst({
          where: {
            creativeId,
            userIpHash,
            timestamp: { gte: threeSecondsAgo },
          },
        });

        const isValid = !isBot && !recentClick;
        const invalidReason = isBot ? 'BOT_USER_AGENT' : recentClick ? 'RAPID_CLICK' : null;

        await prisma.adClickEvent.create({
          data: {
            campaignId,
            creativeId,
            placementId,
            advertiserId: campaign.advertiserId,
            destinationUrl,
            userIpHash,
            isValid,
            invalidReason,
          },
        });

        // Increment daily metrics if valid
        if (isValid) {
          const today = new Date().toISOString().slice(0, 10);
          await prisma.adDailyMetric.upsert({
            where: {
              date_campaignId_placementId: {
                date: today,
                campaignId,
                placementId,
              },
            },
            update: {
              clicksCount: { increment: 1 },
            },
            create: {
              date: today,
              campaignId,
              placementId,
              advertiserId: campaign.advertiserId,
              clicksCount: 1,
            },
          });
        }
      } catch (e) {
        console.error('Error logging ad click event:', e);
      }
    })();

    // Perform immediate redirect
    return NextResponse.redirect(new URL(destinationUrl, req.url), 302);
  } catch (err) {
    console.error('Ad click redirect error:', err);
    return NextResponse.redirect(new URL('/', req.url), 302);
  }
}

