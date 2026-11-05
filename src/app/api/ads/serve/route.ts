import { NextResponse } from 'next/server';
import { serveAdForPlacement, ServeContext } from '@/lib/ads/ad-serving-engine';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const placementKey = searchParams.get('placement');

    if (!placementKey) {
      return NextResponse.json({ error: 'বিজ্ঞাপন প্লেসমেন্ট কী আবশ্যক।' }, { status: 400 });
    }

    // Rate limiting: 100 requests per minute per IP to protect server resources
    const clientIp = getClientIp(req);
    const limitCheck = rateLimit(clientIp, { limit: 120, windowMs: 60 * 1000, prefix: 'ad_serve' });
    if (!limitCheck.success) {
      return NextResponse.json({ error: 'Too many ad requests' }, { status: 429 });
    }

    const deviceClass = (searchParams.get('device') as any) || 'DESKTOP';
    const pageType = searchParams.get('pageType') || 'HOME';

    const context: ServeContext = {
      deviceClass: ['DESKTOP', 'MOBILE', 'TABLET'].includes(deviceClass) ? deviceClass : 'DESKTOP',
      pageType,
    };

    const ad = await serveAdForPlacement(placementKey, context);

    if (!ad) {
      return NextResponse.json({ ad: null, available: false });
    }

    return NextResponse.json({
      ad,
      available: true,
    });
  } catch (err: any) {
    console.error('API Ads Serve error:', err);
    return NextResponse.json({ ad: null, error: 'Internal ad serving error' }, { status: 500 });
  }
}

