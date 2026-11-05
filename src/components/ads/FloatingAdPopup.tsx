'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, GraduationCap, X, Sparkles } from 'lucide-react';
import { ServedAdPayload } from '@/lib/ads/ad-serving-engine';

interface FloatingAdPopupProps {
  placementKey?: string;
  delaySeconds?: number;
}

export default function FloatingAdPopup({
  placementKey = 'edu_floating_popup',
  delaySeconds = 4,
}: FloatingAdPopupProps) {
  const [ad, setAd] = useState<ServedAdPayload | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('shubban_edu_popup_dismissed') === 'true') {
          setIsDismissed(true);
          return;
        }
      } catch {}
    }

    let isMounted = true;

    async function loadPopupAd() {
      try {
        const isMobile = window.innerWidth < 768;
        const device = isMobile ? 'MOBILE' : 'DESKTOP';

        // Try to fetch dedicated educational popup or fallback to home_top
        let res = await fetch(
          `/api/ads/serve?placement=${encodeURIComponent(placementKey)}&device=${device}&pageType=GLOBAL`
        );
        let data = await res.json();

        if (!data.available || !data.ad) {
          // Fallback check
          res = await fetch(
            `/api/ads/serve?placement=home_top&device=${device}&pageType=HOME`
          );
          data = await res.json();
        }

        if (isMounted && data.available && data.ad) {
          setAd(data.ad);

          // Delay appearance by specified seconds so user is not interrupted while opening page
          const timer = setTimeout(() => {
            if (isMounted) {
              setIsVisible(true);

              // Record impression
              fetch('/api/ads/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  eventType: 'IMPRESSION',
                  campaignId: data.ad.campaignId,
                  creativeId: data.ad.creativeId,
                  placementId: data.ad.placementId || data.ad.placementKey,
                  advertiserId: data.ad.advertiserId,
                  pageUrl: window.location.pathname,
                  deviceClass: device,
                }),
              }).catch(() => {});
            }
          }, delaySeconds * 1000);

          return () => clearTimeout(timer);
        }
      } catch {}
    }

    loadPopupAd();

    return () => {
      isMounted = false;
    };
  }, [placementKey, delaySeconds]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    setIsDismissed(true);
    try {
      sessionStorage.setItem('shubban_edu_popup_dismissed', 'true');
    } catch {}
  };

  const handleToggleMinimize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  if (isDismissed || !isVisible || !ad) {
    return null;
  }

  // Minimized Floating Pill Badge (Bottom-Left on Desktop, Top-Left on Mobile)
  if (isMinimized) {
    return (
      <aside
        aria-label="শিক্ষা নোটিশ সংক্ষেপ"
        className="fixed top-18 sm:top-auto sm:bottom-6 left-3 sm:left-6 z-30 font-bengali animate-in fade-in zoom-in-90 duration-300"
      >
        <button
          onClick={handleToggleMinimize}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-stone-900 border border-amber-500/40 text-stone-800 dark:text-stone-200 text-xs font-bold shadow-lg hover:border-amber-500 hover:scale-105 transition-all"
          title="শিক্ষা ও ভর্তি নোটিশ দেখুন"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
          <span>শিক্ষা নোটিশ</span>
          <span className="text-[10px] text-stone-400 font-normal">দেখুন &uarr;</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="শিক্ষা প্রতিষ্ঠান বিজ্ঞাপন নোটিশ"
      className="fixed top-18 left-3 right-3 sm:top-auto sm:bottom-6 sm:left-6 sm:right-auto z-30 w-auto sm:w-[330px] max-w-[360px] mx-auto sm:mx-0 animate-in fade-in slide-in-from-top-4 sm:slide-in-from-bottom-5 sm:slide-in-from-left-5 duration-500 font-bengali pointer-events-auto"
    >
      <div className="relative rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-amber-500/30 dark:border-stone-800 shadow-2xl overflow-hidden p-3.5 transition-all hover:border-amber-400/60">
        {/* Header / Top Bar: Educational Badge + Minimize & Skip Buttons */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 text-[10px] font-sans font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <GraduationCap className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="truncate">শিক্ষা ও ভর্তি নোটিশ</span>
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleToggleMinimize}
              aria-label="মিনিমাইজ করুন"
              title="মিনিমাইজ করে রাখুন"
              className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              মিনিমাইজ
            </button>
            <button
              onClick={handleDismiss}
              aria-label="বিজ্ঞাপন বন্ধ করুন"
              title="স্কিপ করুন / বন্ধ করুন"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              <span>স্কিপ</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ad Card Content */}
        <a
          href={ad.clickUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 group"
        >
          {/* Institution Logo / Creative Thumbnail */}
          {ad.mediaUrl ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-100 dark:border-stone-800 flex-shrink-0">
              <img
                src={ad.mediaUrl}
                alt={ad.altText || ad.headline || 'বিজ্ঞাপন'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 flex items-center justify-center flex-shrink-0 text-amber-600">
              <GraduationCap className="w-7 h-7" />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="text-[10px] text-stone-400 font-sans truncate">
              {ad.advertiserName || 'শিক্ষা প্রতিষ্ঠান'}
            </div>
            <h4 className="font-serif font-bold text-xs sm:text-[13px] text-stone-900 dark:text-stone-100 group-hover:text-amber-600 line-clamp-2 leading-tight transition-colors">
              {ad.headline || 'ভর্তি ও বিশেষ কোর্স বিজ্ঞপ্তি'}
            </h4>
            {ad.description && (
              <p className="text-[11px] text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                {ad.description}
              </p>
            )}
          </div>
        </a>

        {/* Bottom CTA Action Bar */}
        <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <span className="text-[9px] text-stone-400">
            স্পনসরড বিজ্ঞাপন
          </span>
          <a
            href={ad.clickUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs hover:shadow transition-all"
          >
            <span>{ad.ctaText || 'ভর্তি তথ্য দেখুন'}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
}

