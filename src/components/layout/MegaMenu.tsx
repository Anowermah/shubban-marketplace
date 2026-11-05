'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutGrid,
  ChevronDown,
  BookOpen,
  Sparkles,
  HeartHandshake,
  Compass,
  ArrowRight,
  Bookmark,
  Newspaper,
  GraduationCap,
} from 'lucide-react';

interface MegaMenuProps {
  onClose?: () => void;
}

export default function MegaMenu({ onClose }: MegaMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-shubban-green hover:bg-shubban-green-700 text-shubban-gold font-bengali font-bold text-xs shadow-sm transition-all whitespace-nowrap"
        aria-expanded={isOpen}
      >
        <LayoutGrid className="w-4 h-4" />
        <span>সকল বিভাগ ও পণ্য</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Mega Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-3 w-[850px] max-w-[95vw] bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 z-50 font-bengali animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Column 1: বাংলা সাহিত্য ও ক্লাসিক */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                <BookOpen className="w-4 h-4 text-shubban-gold" />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  সাহিত্য ও ক্লাসিক
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                <li>
                  <Link href="/books?category=literature" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    সাহিত্য ও ছোটগল্প
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=novel" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    চিরায়ত ও আধুনিক উপন্যাস
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=poetry" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    কাব্যগ্রন্থ ও কবিতা
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=history" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    ইতিহাস ও ঐতিহ্য
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=philosophy" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    দর্শন ও মননশীল চিন্তা
                  </Link>
                </li>
                <li>
                  <Link href="/digital-library" onClick={handleLinkClick} className="text-shubban-gold font-semibold hover:underline block pt-1">
                    মুক্ত ডিজিটাল বই (PDF) &rarr;
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: ইসলামিক বই ও ঐতিহ্য */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  ইসলামিক জ্ঞানপীঠ
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                <li>
                  <Link href="/books?category=islamic" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    কুরআন ও তাফসীর গ্রন্থ
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=islamic" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    হাদিস শরিফ ও ব্যাখ্যা
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=biography" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    নবী-রাসূল ও সাহাবিদের জীবনী
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=islamic" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    ফিকহ ও দৈনন্দিন মাসায়েল
                  </Link>
                </li>
                <li>
                  <Link href="/questions" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    প্রশ্নোত্তর ও ফতোয়া ফোরাম
                  </Link>
                </li>
                <li>
                  <Link href="/magazines" onClick={handleLinkClick} className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline block pt-1">
                    মাসিক সাময়িকী আর্কাইভ &rarr;
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: ইসলামিক লাইফস্টাইল ও আতর (Wafilife Style) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  সুন্নাহ ও লাইফস্টাইল
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                <li>
                  <Link href="/books?category=islamic-lifestyle" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    খাঁটি অ্যালকোহলমুক্ত আতর (৬/১২ মিলি)
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=islamic-lifestyle" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    তুর্কি মখমল ও ফ্লোরাল জায়নামাজ
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=islamic-lifestyle" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    প্রাকৃতিক পিতরাজ ও জয়তুন মিসওয়াক
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=islamic-lifestyle" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    প্রিমিয়াম কাঠের ও ক্রিস্টাল তসবিহ
                  </Link>
                </li>
                <li>
                  <Link href="/books?category=self-help" onClick={handleLinkClick} className="hover:text-shubban-green dark:hover:text-shubban-gold block py-0.5">
                    আত্মউন্নয়ন ও সুন্নাহসম্মত জীবন
                  </Link>
                </li>
                <li>
                  <Link href="/sellers/darul-huda-lifestyle" onClick={handleLinkClick} className="text-amber-600 dark:text-amber-400 font-semibold hover:underline block pt-1">
                    দারুল হুদা লাইফস্টাইল স্টোর &rarr;
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: আস-সুন্নাহ সদকাহ ফান্ড ও মার্কেটপ্লেস হাব */}
            <div className="space-y-3 bg-stone-50 dark:bg-stone-800/40 p-3.5 rounded-xl border border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2 pb-1.5 border-b border-stone-200 dark:border-stone-700">
                <HeartHandshake className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-xs uppercase tracking-wider text-stone-900 dark:text-stone-100">
                  সদকাহ ও মার্কেটপ্লেস
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                মানবতার কল্যাণে সাদাকায়ে জারিয়া এবং দেশসেরা ইসলামিক প্রকাশনীর সমন্বিত বাজার।
              </p>
              <div className="space-y-2 pt-1">
                <Link
                  href="/donations"
                  onClick={handleLinkClick}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-between shadow-sm transition-colors"
                >
                  <span>আস-সুন্নাহ সদকাহ ফান্ড</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/seller/apply"
                  onClick={handleLinkClick}
                  className="w-full py-2 px-3 rounded-lg bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs flex items-center justify-between shadow-sm transition-colors"
                >
                  <span>মার্কেটপ্লেসে বিক্রেতা হোন</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="pt-2 text-[10px] text-stone-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>১০০% আমানতদারিতা ও শরিয়াহ অডিট</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

