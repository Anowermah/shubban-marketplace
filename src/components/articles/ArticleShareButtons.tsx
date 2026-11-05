'use client';

import React, { useState } from 'react';
import { Share2, Printer, Check, Copy } from 'lucide-react';

interface ArticleShareButtonsProps {
  title: string;
}

export default function ArticleShareButtons({ title }: ArticleShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyLink}
        className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs flex items-center gap-1.5 transition-colors"
        title="লিংক কপি করুন"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-600 font-medium">কপি হয়েছে!</span>
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">শেয়ার</span>
          </>
        )}
      </button>

      <button
        onClick={handlePrint}
        className="p-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs flex items-center gap-1.5 transition-colors"
        title="প্রবন্ধ প্রিন্ট করুন"
      >
        <Printer className="w-4 h-4" />
        <span className="hidden sm:inline">প্রিন্ট</span>
      </button>
    </div>
  );
}

