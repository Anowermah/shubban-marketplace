import { prisma } from '@/lib/prisma';
import { getCachedData, invalidateCache } from '@/lib/cache';

export interface ServeContext {
  deviceClass?: 'DESKTOP' | 'MOBILE' | 'TABLET';
  pageType?: string;
  category?: string;
}

export interface ServedAdPayload {
  placementKey: string;
  placementId?: string;
  campaignId: string;
  creativeId: string;
  advertiserId: string;
  advertiserName: string;
  format: string;
  mediaUrl: string;
  mobileMediaUrl?: string | null;
  headline?: string | null;
  description?: string | null;
  ctaText?: string | null;
  destinationUrl: string;
  altText?: string | null;
  width: number;
  height: number;
  clickUrl: string;
  isSponsored: boolean;
}

/**
 * Invalidate ads cache when placements, campaigns, or creatives update
 */
export function invalidateAdsCache(placementKey?: string) {
  if (placementKey) {
    invalidateCache(`ad_serve_${placementKey}`);
  } else {
    invalidateCache('ad_serve_');
  }
}

/**
 * High-performance, deterministic Ad Serving Engine
 */
export async function serveAdForPlacement(
  placementKey: string,
  context: ServeContext = {}
): Promise<ServedAdPayload | null> {
  const cacheKey = `ad_serve_${placementKey}_${context.deviceClass || 'ALL'}_${context.pageType || 'ALL'}`;

  // Cache candidate campaigns for 30 seconds for ultra-high throughput
  return getCachedData<ServedAdPayload | null>(cacheKey, 30, async () => {
    try {
      // 1. Fetch placement
      const placement = await prisma.adPlacement.findUnique({
        where: { placementKey },
      });

      if (!placement || placement.status !== 'ACTIVE' || placement.isBlocked) {
        return null;
      }

      const now = new Date();

      // 2. Query eligible active & approved campaigns linked to this placement
      const eligibleCampaigns = await prisma.adCampaign.findMany({
        where: {
          status: 'ACTIVE',
          approvalStatus: 'APPROVED',
          billingStatus: { in: ['PAID', 'AUTHORIZED_INVOICE'] },
          startDate: { lte: now },
          endDate: { gte: now },
          advertiser: {
            status: 'ACTIVE',
          },
          placements: {
            some: {
              placementId: placement.id,
            },
          },
        },
        include: {
          advertiser: {
            select: { id: true, name: true, companyName: true, status: true },
          },
          creatives: {
            include: {
              creative: true,
            },
          },
        },
        orderBy: [{ deliveryPriority: 'desc' }, { createdAt: 'desc' }],
        take: 10,
      });

      if (!eligibleCampaigns || eligibleCampaigns.length === 0) {
        return null;
      }

      // 3. Filter campaigns by targeting & device constraints if applicable
      const filteredCampaigns = eligibleCampaigns.filter((camp) => {
        // Budget check
        if (camp.budget > 0 && camp.spentAmount >= camp.budget) {
          return false;
        }

        // Targeting rules check
        if (camp.targetingRules && camp.targetingRules !== '{}') {
          try {
            const rules = JSON.parse(camp.targetingRules);
            if (rules.device && Array.isArray(rules.device) && rules.device.length > 0 && context.deviceClass) {
              if (!rules.device.includes(context.deviceClass)) return false;
            }
            if (rules.pageTypes && Array.isArray(rules.pageTypes) && rules.pageTypes.length > 0 && context.pageType) {
              if (!rules.pageTypes.includes(context.pageType)) return false;
            }
          } catch {}
        }

        // Must have at least one approved creative
        const hasApprovedCreative = camp.creatives.some(
          (c) => c.creative && c.creative.approvalStatus === 'APPROVED'
        );
        return hasApprovedCreative;
      });

      if (filteredCampaigns.length === 0) {
        return null;
      }

      // 4. Select campaign based on delivery priority and rotation
      // Highest priority candidates
      const highestPriority = filteredCampaigns[0].deliveryPriority;
      const topCandidates = filteredCampaigns.filter((c) => c.deliveryPriority === highestPriority);

      // Random selection among same-priority campaigns for fair distribution
      const selectedCampaign = topCandidates[Math.floor(Math.random() * topCandidates.length)];

      // 5. Select creative from campaign
      const approvedCreatives = selectedCampaign.creatives.filter(
        (c) => c.creative && c.creative.approvalStatus === 'APPROVED'
      );

      if (approvedCreatives.length === 0) {
        return null;
      }

      // Weighted creative selection
      const totalWeight = approvedCreatives.reduce((sum, item) => sum + (item.weight || 100), 0);
      let randomVal = Math.random() * totalWeight;
      let selectedCreativeItem = approvedCreatives[0];

      for (const item of approvedCreatives) {
        randomVal -= item.weight || 100;
        if (randomVal <= 0) {
          selectedCreativeItem = item;
          break;
        }
      }

      const creative = selectedCreativeItem.creative;

      // Construct safe redirect click URL
      const clickParams = new URLSearchParams({
        cid: selectedCampaign.id,
        crid: creative.id,
        pid: placement.id,
        dest: creative.destinationUrl,
      });
      const clickUrl = `/api/ads/click?${clickParams.toString()}`;

      // Dimensions based on device
      const isMobile = context.deviceClass === 'MOBILE';
      const width = isMobile ? placement.mobileWidth : placement.desktopWidth;
      const height = isMobile ? placement.mobileHeight : placement.desktopHeight;

      return {
        placementKey,
        placementId: placement.id,
        campaignId: selectedCampaign.id,
        creativeId: creative.id,
        advertiserId: selectedCampaign.advertiserId,
        advertiserName: selectedCampaign.advertiser.companyName || selectedCampaign.advertiser.name,
        format: creative.format,
        mediaUrl: creative.mediaUrl,
        mobileMediaUrl: creative.mobileMediaUrl,
        headline: creative.headline,
        description: creative.description,
        ctaText: creative.ctaText || 'বিস্তারিত দেখুন',
        destinationUrl: creative.destinationUrl,
        altText: creative.altText || creative.name,
        width,
        height,
        clickUrl,
        isSponsored: true,
      };
    } catch (err) {
      console.error(`Ad serving error for placement [${placementKey}]:`, err);
      return null;
    }
  });
}

