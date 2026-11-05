'use client';

import React, { useState } from 'react';
import {
  Download,
  FileText,
  Headphones,
  Image as ImageIcon,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface ResourceCardClientProps {
  resource: any;
  topicLabel: string;
  categoryLabel: string;
}

export default function ResourceCardClient({
  resource,
  topicLabel,
  categoryLabel,
}: ResourceCardClientProps) {
  const [downloadCount, setDownloadCount] = useState(resource.downloads || 0);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const getFormatIcon = (category: string) => {
    switch (category) {
      case 'AUDIO_LECTURE':
        return <Headphones className="w-4 h-4 text-purple-600" />;
      case 'INFOGRAPHIC':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'CURRICULUM':
      case 'WORKSHEET':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'RESEARCH_PAPER':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      default:
        return <FileText className="w-4 h-4 text-shubban-gold" />;
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/resources/${resource.id}/download`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setDownloadCount(data.downloads);
        if (data.fileUrl) {
          const link = document.createElement('a');
          link.href = data.fileUrl;
          link.target = '_blank';
          link.download = `${resource.title}.${resource.fileType?.toLowerCase() || 'pdf'}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800">
              {getFormatIcon(resource.category)}
            </span>
            <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300">
              {categoryLabel}
            </span>
          </div>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-shubban-gold border border-stone-200 dark:border-stone-700">
            {topicLabel}
          </span>
        </div>

        <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 leading-snug line-clamp-2">
          {resource.title}
        </h3>

        {resource.titleEn && (
          <p className="text-xs text-stone-400 font-sans italic line-clamp-1">
            {resource.titleEn}
          </p>
        )}

        <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3">
          {resource.description}
        </p>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-[11px] text-stone-500 space-y-1">
          {resource.authorName && (
            <div>
              <span className="text-stone-400">লেখক/সংকলক: </span>
              <strong className="text-stone-700 dark:text-stone-300 font-medium">
                {resource.authorName}
              </strong>
            </div>
          )}
          {resource.publisher && (
            <div>
              <span className="text-stone-400">উৎস: </span>
              <span>{resource.publisher}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
        <div className="text-[11px] text-stone-400">
          <span>{resource.fileSize || 'পিডিএফ সংস্করণ'}</span> •{' '}
          <span>{toBengaliNumber(downloadCount)} ডাউনলোড</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShare}
            title="লিংক কপি করুন"
            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500 hover:text-stone-700 transition-all text-xs"
          >
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3.5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-shubban-gold" />
            <span>ডাউনলোড</span>
          </button>
        </div>
      </div>
    </div>
  );
}

