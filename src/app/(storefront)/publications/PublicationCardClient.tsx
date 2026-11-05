'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  BookOpen,
  Calendar,
  Download,
  Eye,
  FileText,
  Lock,
  CheckCircle2,
  List,
  X,
  ExternalLink,
} from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';

interface PublicationCardClientProps {
  issue: any;
}

export default function PublicationCardClient({ issue }: PublicationCardClientProps) {
  const [showToc, setShowToc] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [downloadCount, setDownloadCount] = useState(issue.downloads || 0);

  const handleReadOnline = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/publications/issues/${issue.id}/access`);
      const data = await res.json();

      if (data.allowed && data.pdfUrl) {
        window.open(data.pdfUrl, '_blank');
      } else {
        setErrorMsg(data.reason || data.error || 'এই সংখ্যাটি পড়ার অনুমতি আপনার নেই।');
      }
    } catch (err: any) {
      setErrorMsg('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/publications/issues/${issue.id}/download`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success && data.downloadUrl) {
        setDownloadCount(data.downloads);
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.target = '_blank';
        link.download = `${issue.issueTitle}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setErrorMsg(data.error || 'ডাউনলোড সম্পন্ন করা যায়নি।');
      }
    } catch (err: any) {
      setErrorMsg('ডাউনলোড প্রক্রিয়াকরণে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div className="space-y-4">
          {/* Card Header & Cover */}
          <div className="flex gap-4">
            <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0 border border-stone-200 dark:border-stone-700">
              <Image
                src={issue.coverImage || '/placeholder.jpg'}
                alt={issue.issueTitle}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  {issue.magazine.title}
                </span>

                {issue.isFree ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    উন্মুক্ত (Free)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>৳{issue.price}</span>
                  </span>
                )}
              </div>

              <h2 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 leading-snug line-clamp-2">
                {issue.issueTitle}
              </h2>

              <div className="text-xs text-stone-500 font-medium">
                {issue.volume && <span>ভলিউম: {issue.volume} • </span>}
                {issue.issueNumber && <span>সংখ্যা: {issue.issueNumber}</span>}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-stone-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatBengaliDate(issue.publicationDate)}
                </span>
                <span>• {toBengaliNumber(downloadCount)} ডাউনলোড</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          {issue.summary && (
            <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
              {issue.summary}
            </p>
          )}

          {/* Error / Subscription Notice */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleReadOnline}
              disabled={loading}
              className="flex-1 py-2 px-3 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Eye className="w-3.5 h-3.5 text-shubban-gold" />
              <span>অনলাইনে পড়ুন</span>
            </button>

            {issue.allowDownload && (
              <button
                onClick={handleDownload}
                disabled={loading}
                title="পিডিএফ ডাউনলোড করুন"
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all flex items-center justify-center gap-1 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            )}

            {issue.toc && (
              <button
                onClick={() => setShowToc(true)}
                title="সূচিপত্র দেখুন"
                className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold transition-all"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table of Contents Modal */}
      {showToc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-stone-200 dark:border-stone-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                  সূচিপত্র — {issue.issueTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowToc(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto text-xs text-stone-700 dark:text-stone-300 whitespace-pre-line leading-relaxed p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-100 dark:border-stone-800">
              {issue.toc}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowToc(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold hover:bg-stone-300 transition-all"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

