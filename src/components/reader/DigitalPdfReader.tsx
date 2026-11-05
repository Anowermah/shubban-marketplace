'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Bookmark,
  List,
  Search,
  Sun,
  Moon,
  Download,
  Share2,
  Lock,
  ArrowLeft,
  BookOpen,
  Check,
  Printer,
  Sparkles,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthContext';

interface DigitalPdfReaderProps {
  book: {
    id: string;
    title: string;
    slug: string;
    fullPdfUrl?: string | null;
    samplePdfUrl?: string | null;
    isFree: boolean;
    pages?: number | null;
    toc?: string | null;
    author: {
      name: string;
      slug: string;
    };
  };
  hasAccess: boolean;
  userRole?: string;
}

export default function DigitalPdfReader({
  book,
  hasAccess,
  userRole,
}: DigitalPdfReaderProps) {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = book.pages || 24;
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [readerTheme, setReaderTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState<boolean>(false);
  const [bookmarks, setBookmarks] = useState<Array<{ page: number; note: string }>>([
    { page: 1, note: 'সূচনা ও প্রারম্ভিক ভূমিকা' },
  ]);
  const [newNote, setNewNote] = useState<string>('');
  const [viewMode, setViewMode] = useState<'single' | 'continuous'>('single');
  const [displayMode, setDisplayMode] = useState<'canvas' | 'pdf'>('canvas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Restore last read page from localStorage
  useEffect(() => {
    try {
      const savedPage = localStorage.getItem(`shubban_read_${book.id}`);
      if (savedPage) {
        setCurrentPage(parseInt(savedPage, 10));
      }
    } catch (e) {}
  }, [book.id]);

  // Save reading progress
  useEffect(() => {
    try {
      localStorage.setItem(`shubban_read_${book.id}`, currentPage.toString());
      // Fire progress ping to backend API
      fetch('/api/reading-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          currentPage,
          totalPages,
        }),
      }).catch(() => {});
    } catch (e) {}
  }, [currentPage, book.id, totalPages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentPage((p) => Math.max(1, p - 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages]);

  const goToNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  const goToPrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerContainerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const addBookmark = () => {
    if (!bookmarks.some((b) => b.page === currentPage)) {
      setBookmarks([...bookmarks, { page: currentPage, note: newNote || `পৃষ্ঠা ${currentPage}` }]);
      setNewNote('');
    }
  };

  const progressPercent = Math.round((currentPage / totalPages) * 100);

  // Theme styling
  const themeStyles = {
    light: 'bg-stone-100 text-stone-900 border-stone-200',
    sepia: 'bg-[#F4ECD8] text-[#5B4636] border-[#E2D2B5]',
    dark: 'bg-[#0F1F1A] text-stone-200 border-[#1E352E]',
  };

  const pageSurfaceStyles = {
    light: 'bg-white text-stone-900 shadow-lg',
    sepia: 'bg-[#FAF4E8] text-[#433225] shadow-lg',
    dark: 'bg-[#152B24] text-stone-100 shadow-xl border border-stone-800',
  };

  const parsedToc = book.toc
    ? book.toc.split('\n').filter(Boolean)
    : [
        '১. গ্রন্থ সূচনা ও পরিচিতি',
        '২. প্রথম পর্ব: মূল বিষয়বস্তু',
        '৩. দ্বিতীয় পর্ব: পর্যালোচনা ও বিশ্লেষণ',
        '৪. সমাপ্তি ও গ্রন্থপঞ্জি',
      ];

  const pdfUrl = hasAccess ? book.fullPdfUrl : book.samplePdfUrl;

  return (
    <div
      ref={readerContainerRef}
      className={`flex flex-col h-screen w-full select-none font-bengali transition-colors duration-300 ${themeStyles[readerTheme]}`}
    >
      {/* 1. Reader Header / Control Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-shubban-green text-shubban-ivory shadow-md z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/books/${book.slug}`}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 text-xs text-shubban-ivory"
            title="বইয়ের মূল পাতায় ফিরুন"
          >
            <ArrowLeft className="w-4 h-4 text-shubban-gold" />
            <span className="hidden sm:inline">ফিরে যান</span>
          </Link>
          <div className="h-4 w-px bg-white/20 hidden sm:block" />
          <div>
            <h1 className="font-serif font-bold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md">
              {book.title}
            </h1>
            <span className="text-[11px] text-shubban-ivory/70 truncate block">
              {book.author.name}
            </span>
          </div>
        </div>

        {/* Central Page Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            title="পূর্ববর্তী পৃষ্ঠা"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1 text-xs">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (val >= 1 && val <= totalPages) setCurrentPage(val);
              }}
              className="w-12 py-1 px-1.5 rounded bg-white/10 text-center font-mono font-bold text-white border border-white/20 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
            <span className="text-shubban-ivory/70 font-mono">/ {toBengaliNumber(totalPages)}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
            title="পরবর্তী পৃষ্ঠা"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right Tools: TOC, Bookmarks, Zoom, Themes, Fullscreen */}
        <div className="flex items-center gap-2">
          {/* TOC Toggle */}
          <button
            onClick={() => {
              setIsTocOpen(!isTocOpen);
              setIsBookmarksOpen(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
              isTocOpen ? 'bg-white/20 text-shubban-gold' : ''
            }`}
            title="সূচিপত্র"
          >
            <List className="w-4 h-4" />
          </button>

          {/* Bookmarks Toggle */}
          <button
            onClick={() => {
              setIsBookmarksOpen(!isBookmarksOpen);
              setIsTocOpen(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
              isBookmarksOpen ? 'bg-white/20 text-shubban-gold' : ''
            }`}
            title="বুকমার্ক ও নোটস"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Zoom controls */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
              className="p-1.5 rounded hover:bg-white/10"
              title="জুম আউট"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-shubban-gold w-10 text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(180, z + 15))}
              className="p-1.5 rounded hover:bg-white/10"
              title="জুম ইন"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Display Mode switcher (Canvas vs Embedded PDF) */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setDisplayMode('canvas')}
              className={`px-2 py-1 text-[11px] rounded transition-all ${
                displayMode === 'canvas' ? 'bg-shubban-gold text-shubban-green-950 font-bold' : 'text-stone-300'
              }`}
              title="ইন্টারেক্টিভ পাঠকক্ষ ভিউ"
            >
              পাঠকক্ষ
            </button>
            <button
              onClick={() => setDisplayMode('pdf')}
              className={`px-2 py-1 text-[11px] rounded transition-all ${
                displayMode === 'pdf' ? 'bg-shubban-gold text-shubban-green-950 font-bold' : 'text-stone-300'
              }`}
              title="মূল PDF ফাইল ভিউয়ার"
            >
              মূল PDF
            </button>
          </div>

          {/* Theme switcher */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5">
            <button
              onClick={() => setReaderTheme('light')}
              className={`px-2 py-1 text-[11px] rounded ${
                readerTheme === 'light' ? 'bg-white text-shubban-green font-bold' : 'text-stone-300'
              }`}
            >
              দিন
            </button>
            <button
              onClick={() => setReaderTheme('sepia')}
              className={`px-2 py-1 text-[11px] rounded ${
                readerTheme === 'sepia' ? 'bg-[#FAF4E8] text-[#5B4636] font-bold' : 'text-stone-300'
              }`}
            >
              সেপিয়া
            </button>
            <button
              onClick={() => setReaderTheme('dark')}
              className={`px-2 py-1 text-[11px] rounded ${
                readerTheme === 'dark' ? 'bg-[#0F1F1A] text-shubban-gold font-bold' : 'text-stone-300'
              }`}
            >
              রাত
            </button>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg hover:bg-white/10"
            title="ফুলস্ক্রিন"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Progress Line */}
      <div className="w-full bg-stone-300 dark:bg-stone-800 h-1">
        <div
          className="bg-shubban-gold h-1 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 2. Reader Body Area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Table of Contents Drawer */}
        {isTocOpen && (
          <aside className="w-72 bg-white dark:bg-shubban-darkCard border-r border-stone-200 dark:border-stone-800 p-4 overflow-y-auto z-20 shadow-xl flex flex-col">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2">
              <List className="w-4 h-4 text-shubban-gold" />
              সূচিপত্র
            </h3>
            <div className="mt-3 space-y-1.5 text-xs">
              {parsedToc.map((chapter, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCurrentPage(Math.min(totalPages, i * 4 + 1));
                    setIsTocOpen(false);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors text-stone-700 dark:text-stone-300 leading-snug"
                >
                  {chapter}
                </button>
              ))}
            </div>
          </aside>
        )}

        {/* Bookmarks & Notes Drawer */}
        {isBookmarksOpen && (
          <aside className="w-80 bg-white dark:bg-shubban-darkCard border-r border-stone-200 dark:border-stone-800 p-4 overflow-y-auto z-20 shadow-xl flex flex-col">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-200 dark:border-stone-800 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-shubban-gold" />
              ব্যক্তিগত বুকমার্ক ও নোট
            </h3>

            {/* Add note */}
            <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-700 space-y-2">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300">
                পৃষ্ঠা {toBengaliNumber(currentPage)}-এ নোট যোগ করুন:
              </span>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="নোট বা উদ্ধৃতি লিখুন..."
                className="w-full text-xs p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
              />
              <button
                onClick={addBookmark}
                className="w-full py-1.5 bg-shubban-green text-shubban-ivory rounded-lg text-xs font-semibold hover:bg-shubban-green-700"
              >
                বুকমার্ক সংরক্ষণ করুন
              </button>
            </div>

            {/* List */}
            <div className="mt-4 space-y-2 text-xs flex-1">
              {bookmarks.map((bm, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentPage(bm.page)}
                  className="p-2.5 rounded-lg border border-stone-100 dark:border-stone-800 hover:border-shubban-gold cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-shubban-gold font-bold">
                    <span>পৃষ্ঠা: {toBengaliNumber(bm.page)}</span>
                    <span>পাঠের অংশ</span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 mt-1">{bm.note}</p>
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* Central Book Page Viewer / Canvas */}
        <main className="flex-1 overflow-auto flex items-center justify-center p-2 sm:p-6 relative">
          {displayMode === 'pdf' ? (
            <div className="w-full h-full flex flex-col rounded-xl overflow-hidden shadow-2xl border border-stone-300 dark:border-stone-700 bg-stone-900">
              <iframe
                src={pdfUrl || '/samples/sample-rabindranath.pdf'}
                className="w-full h-full border-0"
                title={book.title}
              />
            </div>
          ) : (
            <>
              {/* Watermark Protection Layer */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 z-10 rotate-[-25deg]">
                <span className="text-4xl sm:text-6xl font-bold font-serif uppercase tracking-widest text-stone-900 dark:text-white">
                  শুব্বান লাইব্রেরী • {user?.email || 'Shubban Reader'}
                </span>
              </div>

              {/* Book Page Surface */}
              <div
                className={`w-full max-w-2xl min-h-[700px] p-8 sm:p-14 rounded-2xl transition-transform duration-200 relative flex flex-col justify-between ${pageSurfaceStyles[readerTheme]}`}
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top center',
                }}
              >
                {/* Top Page Header */}
                <div className="flex items-center justify-between border-b border-stone-200/50 pb-3 text-xs text-stone-400 font-serif">
                  <span>{book.title}</span>
                  <span>{book.author.name}</span>
                </div>

                {/* Page Content Body */}
                <div className="my-8 space-y-6 text-sm sm:text-base leading-relaxed font-serif select-text">
                  {currentPage === 1 ? (
                    <div className="text-center py-12 space-y-4">
                      <span className="text-xs uppercase tracking-widest text-shubban-gold font-sans font-bold">
                        শুব্বান লাইব্রেরী প্রামাণ্য সংস্করণ
                      </span>
                      <h2 className="text-3xl sm:text-4xl font-bold font-serif text-stone-900 dark:text-white">
                        {book.title}
                      </h2>
                      <p className="text-lg text-stone-600 dark:text-stone-300 font-serif">
                        {book.author.name}
                      </p>
                      <div className="w-16 h-0.5 bg-shubban-gold mx-auto my-6" />
                      <p className="text-xs text-stone-500 max-w-md mx-auto leading-normal">
                        এই ডিজিটাল সংস্করণটি শুব্বান লাইব্রেরীর উচ্চমানের ইন-ব্রাউজার পাঠকক্ষের জন্য ডিজিটাইজড ও সংরক্ষিত।
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h3 className="font-serif font-bold text-xl text-stone-800 dark:text-stone-100">
                        অধ্যায় {toBengaliNumber(Math.ceil(currentPage / 3))}: মূল পাঠাংশ
                      </h3>
                      <p className="first-letter:text-3xl first-letter:font-bold first-letter:text-shubban-gold first-letter:mr-1">
                        জ্ঞান ও ভাবনার গভীর অন্বেষণে রচিত এই অধ্যায়ে সাহিত্যের চিরায়ত সৌন্দর্য ও মননশীল অনুধ্যান জীবন্ত রূপ ধারণ করেছে। শব্দের শৈল্পিক বন্ধনে জীবনের গভীর অর্থ ও সত্যের প্রকাশ ঘটেছে।
                      </p>
                      <p>
                        যেখানে থাকে সবার অধম দীনের হতে দীন, সেইখানে যে চরণ তোমার রাজে। আলোর পরশ পেয়ে যেমন করে অন্ধকার দূরীভূত হয়, সাহিত্যের অমৃতবাণী মানুষের অন্তরাত্মাকে তেমনি প্রজ্ঞার আলোয় আলোকিত করে তোলে।
                      </p>
                      <blockquote className="p-4 my-4 border-l-4 border-shubban-gold bg-stone-500/5 italic text-sm">
                        “সীমার মাঝে অসীম তুমি বাজাও আপন সুর। আমার মধ্যে তোমার প্রকাশ তাই এত মধুর।”
                      </blockquote>
                      <p>
                        শতাব্দীর পর শতাব্দী ধরে যে চিন্তা ও সৃজনশীল ঐতিহ্য বাঙালি জাতিকে পথ দেখিয়েছে, তার মৌলিক নির্যাস এই গ্রন্থখানির পরতে পরতে প্রোথিত।
                      </p>
                    </div>
                  )}
                </div>

                {/* Page Footer */}
                <div className="flex items-center justify-between border-t border-stone-200/50 pt-3 text-xs text-stone-400 font-mono">
                  <span>শুব্বান ডিজিটাল লাইব্রেরী</span>
                  <span>পৃষ্ঠা {toBengaliNumber(currentPage)} / {toBengaliNumber(totalPages)}</span>
                </div>

                {/* Access Gate Overlay if book is Paid and user has no access */}
                {!hasAccess && currentPage > 3 && (
                  <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-8 text-center text-white space-y-4 z-20">
                    <div className="w-16 h-16 rounded-full bg-shubban-gold/20 flex items-center justify-center text-shubban-gold">
                      <Lock className="w-8 h-8" />
                    </div>
                    <h3 className="font-serif text-2xl font-bold">
                      বাকি অংশ পড়ার জন্য প্রিমিয়াম এক্সেস প্রয়োজন
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-300 max-w-md leading-relaxed">
                      এই বইটি প্রিমিয়াম ডিজিটাল ক্যাটালগের অংশ। আপনি শুব্বান মেম্বারশিপ গ্রহণ করে অথবা বইটি এককভাবে ক্রয় করে সম্পূর্ণ পাঠ সম্পন্ন করতে পারেন।
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <Link
                        href="/membership"
                        className="px-5 py-2.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow-md transition-all"
                      >
                        সদস্যপদ প্ল্যান দেখুন
                      </Link>
                      <Link
                        href={`/books/${book.slug}`}
                        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all"
                      >
                        বইটি সংগ্রহ করুন
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* 3. Reader Bottom Status Bar */}
      <footer className="h-8 bg-stone-200 dark:bg-stone-900 text-stone-600 dark:text-stone-400 px-4 flex items-center justify-between text-xs flex-shrink-0 border-t border-stone-300 dark:border-stone-800">
        <div className="flex items-center gap-4">
          <span>
            পড়ার অগ্রগতি: <strong className="text-shubban-gold">{toBengaliNumber(progressPercent)}%</strong>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">কিবোর্ড শর্টকাট: &larr; পূর্ববর্তী | পরবর্তী &rarr;</span>
        </div>

        <div className="flex items-center gap-3">
          {hasAccess && (
            <a
              href={pdfUrl || '#'}
              download
              className="text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1 text-[11px] font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>অনুমোদিত PDF ডাউনলোড</span>
            </a>
          )}
        </div>
      </footer>
    </div>
  );
}
