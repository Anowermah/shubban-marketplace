'use client';

import React, { useState } from 'react';
import { Smartphone, Monitor, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';

interface AdLivePreviewProps {
  format: string;
  mediaUrl: string;
  headline?: string;
  description?: string;
  ctaText?: string;
  destinationUrl?: string;
  advertiserName?: string;
}

export default function AdLivePreview({
  format,
  mediaUrl,
  headline,
  description,
  ctaText = 'বিস্তারিত দেখুন',
  destinationUrl = 'https://atrbd.com',
  advertiserName = 'বিজ্ঞাপনদাতার নাম',
}: AdLivePreviewProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');

  const hasMedia = Boolean(mediaUrl && mediaUrl.trim().length > 0);

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-gradient-to-b from-amber-50/50 to-white dark:from-zinc-900/60 dark:to-zinc-950 p-4 shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/60 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            লাইভ বিজ্ঞাপন প্রিভিউ (বিজ্ঞাপন দেখতে যেমন হবে)
          </h4>
        </div>
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-all ${
              device === 'desktop'
                ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Monitor className="w-3 h-3" />
            ডেস্কটপ
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md transition-all ${
              device === 'mobile'
                ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            মোবাইল
          </button>
        </div>
      </div>

      <div className="overflow-x-auto py-2 flex items-center justify-center min-h-[140px] bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 p-3">
        {/* Leaderboard Format (728x90 or 970x90) */}
        {(format === 'LEADERBOARD_BANNER' || format === 'LARGE_LEADERBOARD') && (
          <div
            className={`relative rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 shadow-sm transition-all ${
              device === 'mobile' ? 'w-[320px] h-[75px]' : 'w-full max-w-[728px] h-[90px]'
            }`}
          >
            {hasMedia ? (
              <img src={mediaUrl} alt={headline || 'Ad Banner'} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white flex items-center justify-between px-4">
                <div className="truncate max-w-[70%]">
                  <div className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">{advertiserName}</div>
                  <div className="text-xs sm:text-sm font-bold truncate">{headline || 'এখানে আপনার বিজ্ঞাপনের আকর্ষণীয় শিরোনাম দেখা যাবে'}</div>
                  {description && <div className="text-[10px] text-amber-100 truncate">{description}</div>}
                </div>
                <div className="shrink-0 bg-white text-amber-900 font-bold text-[11px] px-3 py-1.5 rounded shadow-sm">
                  {ctaText}
                </div>
              </div>
            )}
            <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded tracking-wider uppercase font-sans">
              স্পনসরড
            </div>
          </div>
        )}

        {/* Medium Rectangle (300x250) */}
        {format === 'MEDIUM_RECTANGLE' && (
          <div className="w-[300px] h-[250px] relative rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900 flex flex-col">
            <div className="relative h-[140px] w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              {hasMedia ? (
                <img src={mediaUrl} alt={headline || 'Ad'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-sans">
                  ব্যানার ছবি আপলোড করুন
                </div>
              )}
              <span className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-sans">
                স্পনসরড
              </span>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block truncate">{advertiserName}</span>
                <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1 mt-0.5">
                  {headline || 'আপনার বিজ্ঞাপনের শিরোনাম'}
                </h5>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-2 mt-0.5">
                  {description || 'সংক্ষিপ্ত বর্ণনা ও বিবরণ এখানে প্রদর্শিত হবে।'}
                </p>
              </div>
              <div className="w-full text-center bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-1.5 rounded transition-colors mt-2">
                {ctaText}
              </div>
            </div>
          </div>
        )}

        {/* Half Page (300x600) */}
        {format === 'HALF_PAGE' && (
          <div className="w-[300px] h-[400px] relative rounded-lg overflow-hidden border border-zinc-300 dark:border-zinc-700 shadow-sm bg-white dark:bg-zinc-900 flex flex-col">
            <div className="relative h-[240px] w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              {hasMedia ? (
                <img src={mediaUrl} alt={headline || 'Ad'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-sans">
                  ব্যানার ছবি (৩০০x৬০০)
                </div>
              )}
              <span className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-sans">
                স্পনসরড
              </span>
            </div>
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 font-medium block">{advertiserName}</span>
                <h5 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                  {headline || 'আপনার বিজ্ঞাপনের বড় টাওয়ার ব্যানার'}
                </h5>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 mt-1">
                  {description || 'বিস্তারিত তথ্যাবলী ও আকর্ষণীয় বর্ণনা এখানে প্রদর্শিত হবে।'}
                </p>
              </div>
              <div className="w-full text-center bg-amber-600 text-white font-bold text-xs py-2 rounded shadow-sm">
                {ctaText}
              </div>
            </div>
          </div>
        )}

        {/* Sticky Mobile / Other Formats */}
        {format !== 'LEADERBOARD_BANNER' && format !== 'LARGE_LEADERBOARD' && format !== 'MEDIUM_RECTANGLE' && format !== 'HALF_PAGE' && (
          <div className="w-full max-w-[420px] rounded-lg border border-zinc-300 dark:border-zinc-700 p-3 bg-white dark:bg-zinc-900 flex items-center gap-3">
            <div className="w-16 h-16 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden shrink-0">
              {hasMedia ? <img src={mediaUrl} alt="Ad" className="w-full h-full object-cover" /> : null}
            </div>
            <div className="flex-1 truncate">
              <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider block">স্পনসরড</span>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{headline || 'বিজ্ঞাপনের শিরোনাম'}</div>
              <div className="text-[10px] text-zinc-500 truncate">{description || 'বিজ্ঞাপনের বিস্তারিত বিবরণ'}</div>
            </div>
            <div className="shrink-0 bg-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded">
              {ctaText}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
        <span>গন্তব্য: <code className="text-amber-700 dark:text-amber-400 font-mono text-[10px]">{destinationUrl || 'https://atrbd.com'}</code></span>
        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded font-mono">ফরম্যাট: {format}</span>
      </div>
    </div>
  );
}

