'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ExternalLink, Sparkles, X } from 'lucide-react';
import { ServedAdPayload } from '@/lib/ads/ad-serving-engine';

interface AdSlotProps {
  placementKey: string;
  className?: string;
  pageType?: string;
  fallback?: React.ReactNode;
}

export default function AdSlot({
  placementKey,
  className = '',
  pageType = 'HOME',
  fallback = null,
}: AdSlotProps) {
  const [ad, setAd] = useState<ServedAdPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [impressionRecorded, setImpressionRecorded] = useState(false);
  const [viewableRecorded, setViewableRecorded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewableTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check session dismissal on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const dismissed = sessionStorage.getItem(`shubban_ad_dismissed_${placementKey}`);
        if (dismissed === 'true') {
          setIsDismissed(true);
        }
      } catch { }
    }
  }, [placementKey]);

  // 1. Fetch Ad for this placement
  useEffect(() => {
    if (isDismissed) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchAd() {
      try {
        const isMobile = window.innerWidth < 768;
        const device = isMobile ? 'MOBILE' : 'DESKTOP';

        const res = await fetch(
          `/api/ads/serve?placement=${encodeURIComponent(placementKey)}&device=${device}&pageType=${encodeURIComponent(pageType)}`
        );
        if (!res.ok) {
          if (isMounted) setLoading(false);
          return;
        }

        const data = await res.json();
        if (isMounted) {
          if (data.available && data.ad) {
            setAd(data.ad);
          }
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) setLoading(false);
      }
    }

    fetchAd();

    return () => {
      isMounted = false;
    };
  }, [placementKey, pageType, isDismissed]);

  // 2. Track standard IMPRESSION when ad is mounted
  useEffect(() => {
    if (!ad || impressionRecorded || isDismissed) return;

    fetch('/api/ads/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'IMPRESSION',
        campaignId: ad.campaignId,
        creativeId: ad.creativeId,
        placementId: ad.placementId || ad.placementKey,
        advertiserId: ad.advertiserId,
        pageUrl: window.location.pathname,
        deviceClass: window.innerWidth < 768 ? 'MOBILE' : 'DESKTOP',
      }),
    }).catch(() => { });

    setImpressionRecorded(true);
  }, [ad, impressionRecorded, isDismissed]);

  // 3. Track VIEWABLE_IMPRESSION using IntersectionObserver (>= 50% visibility for >= 1 second)
  useEffect(() => {
    if (!ad || viewableRecorded || !containerRef.current || isDismissed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            if (!viewableTimerRef.current) {
              viewableTimerRef.current = setTimeout(() => {
                fetch('/api/ads/track', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    eventType: 'VIEWABLE_IMPRESSION',
                    campaignId: ad.campaignId,
                    creativeId: ad.creativeId,
                    placementId: ad.placementId || ad.placementKey,
                    advertiserId: ad.advertiserId,
                    pageUrl: window.location.pathname,
                    deviceClass: window.innerWidth < 768 ? 'MOBILE' : 'DESKTOP',
                  }),
                }).catch(() => { });
                setViewableRecorded(true);
              }, 1000);
            }
          } else {
            if (viewableTimerRef.current) {
              clearTimeout(viewableTimerRef.current);
              viewableTimerRef.current = null;
            }
          }
        });
      },
      { threshold: [0.5] }
    );

    observer.observe(containerRef.current);

    return () => {
      if (viewableTimerRef.current) clearTimeout(viewableTimerRef.current);
      observer.disconnect();
    };
  }, [ad, viewableRecorded, isDismissed]);

  // Skip / Dismiss Handler
  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem(`shubban_ad_dismissed_${placementKey}`, 'true');
    } catch { }
  };

  if (loading || isDismissed) {
    return null; // Silent no-flicker loading or dismissed
  }

  if (!ad) {
    return fallback ? <>{fallback}</> : null;
  }

  // Render Announcement / Simple Banner format
  if (ad.format === 'ANNOUNCEMENT' || ad.format === 'TEXT_AD') {
    return (
      <div
        ref={containerRef}
        className={`w-full bg-stone-50 dark:bg-stone-900 border-y border-stone-200/80 dark:border-stone-800 py-1.5 px-3 transition-all ${className}`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider flex-shrink-0">
              বিজ্ঞাপন
            </span>
            <span className="font-medium text-stone-700 dark:text-stone-300 truncate">
              {ad.headline || ad.description}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={ad.clickUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-400 hover:underline text-[11px]"
            >
              <span>{ad.ctaText || 'বিস্তারিত'}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleDismiss}
              title="বিজ্ঞাপন বন্ধ করুন (স্কিপ)"
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Native Ad format (Compact & Clean)
  if (ad.format === 'NATIVE_AD' || ad.format === 'SPONSORED_ARTICLE' || ad.format === 'SPONSORED_BOOK') {
    return (
      <div
        ref={containerRef}
        className={`relative w-full p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs hover:border-amber-400/50 transition-all ${className}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1 text-[9px] font-sans font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
            <Sparkles className="w-2.5 h-2.5" />
            স্পনসরড
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-400 font-sans truncate max-w-[120px]">
              {ad.advertiserName}
            </span>
            <button
              onClick={handleDismiss}
              title="বিজ্ঞাপন বন্ধ করুন"
              className="p-0.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition text-[10px] flex items-center gap-0.5"
            >
              <span>স্কিপ</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        <a
          href={ad.clickUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col sm:flex-row items-center gap-3 group"
        >
          {ad.mediaUrl && (
            <div className="w-full sm:w-28 h-20 rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0">
              <img
                src={ad.mediaUrl}
                alt={ad.altText || ''}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 space-y-1">
            {ad.headline && (
              <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-600 transition-colors line-clamp-1">
                {ad.headline}
              </h4>
            )}
            {ad.description && (
              <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1 leading-snug">
                {ad.description}
              </p>
            )}
            <div className="pt-0.5 flex items-center gap-1 font-semibold text-[11px] text-amber-600 dark:text-amber-400">
              <span>{ad.ctaText || 'বিস্তারিত জানুন'}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </div>
          </div>
        </a>
      </div>
    );
  }

  // Standard Compact Banner Ad format (Slim height, subtle footprint)
  return (
    <div ref={containerRef} className={`w-full flex flex-col items-center my-2 ${className}`}>
      {/* Discreet Header with Skip Button */}
      <div className="w-full max-w-4xl flex items-center justify-between px-1 mb-1 text-[10px] text-stone-400">
        <div className="flex items-center gap-1.5">
          <span className="font-sans uppercase tracking-wider text-[9px] bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">
            বিজ্ঞাপন
          </span>
          <span className="truncate max-w-[120px]">{ad.advertiserName}</span>
        </div>
        <button
          onClick={handleDismiss}
          title="বিজ্ঞাপন বন্ধ করুন (স্কিপ)"
          className="inline-flex items-center gap-0.5 text-[10px] text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition py-0.5 px-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800"
        >
          <span>স্কিপ করুন</span>
          <X className="w-3 h-3" />
        </button>
      </div>

      <a
        href={ad.clickUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative overflow-hidden rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-md transition-shadow group max-w-full"
      >
        <img
          src={ad.mediaUrl}
          alt={ad.altText || ''}
          className="w-auto h-auto max-h-[90px] sm:max-h-[100px] object-contain mx-auto group-hover:opacity-95 transition-opacity"
          loading="lazy"
        />
      </a>
    </div>
  );
}
