'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  ArrowLeft,
  AlertCircle,
  Loader2,
  FileText,
  Check,
  Copy,
  Eye,
  Clock,
} from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface PdfReaderProps {
  publication: {
    id: string;
    title: string;
    magazineTitle?: string;
    volume?: string | null;
    issueNumber?: string | null;
    pdfUrl: string;
    coverImage: string;
    pageCount?: number;
    allowDownload?: boolean;
    allowShare?: boolean;
    requireLogin?: boolean;
  };
  currentUser?: {
    id: string;
    name: string;
    role: string;
  } | null;
}

export default function PdfReader({ publication, currentUser }: PdfReaderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(publication.pageCount || 48);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [jumpPageInput, setJumpPageInput] = useState('1');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [readingDuration, setReadingDuration] = useState(0);
  const [isMeaningful, setIsMeaningful] = useState(false);
  const [visitedPages, setVisitedPages] = useState<number[]>([1]);

  const containerRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>('');

  // 1. Generate or retrieve client session UUID
  useEffect(() => {
    let sid = sessionStorage.getItem('shubban_reader_session_id');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
      sessionStorage.setItem('shubban_reader_session_id', sid);
    }
    sessionIdRef.current = sid;

    // Fetch previous reading progress to resume reading
    const fetchResume = async () => {
      try {
        const res = await fetch(
          `/api/analytics/reading-session?issueId=${publication.id}&sessionId=${sid}`
        );
        const data = await res.json();
        if (data.success && data.lastPage && data.lastPage > 1) {
          setCurrentPage(data.lastPage);
          setJumpPageInput(data.lastPage.toString());
          setVisitedPages((prev) => Array.from(new Set([...prev, data.lastPage])));
        }
      } catch (err) {}
    };
    fetchResume();
  }, [publication.id]);

  // 2. Periodic reading duration & analytics heartbeat (every 15s)
  useEffect(() => {
    const timer = setInterval(() => {
      setReadingDuration((d) => d + 1);
    }, 1000);

    const heartbeatTimer = setInterval(async () => {
      if (!sessionIdRef.current) return;
      try {
        const deviceType =
          window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

        const res = await fetch('/api/analytics/reading-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueId: publication.id,
            sessionId: sessionIdRef.current,
            currentPage,
            totalPages,
            pagesRead: visitedPages,
            durationIncrement: 15,
            deviceType,
            browser: navigator.userAgent.includes('Chrome')
              ? 'Chrome'
              : navigator.userAgent.includes('Firefox')
              ? 'Firefox'
              : navigator.userAgent.includes('Safari')
              ? 'Safari'
              : 'Other',
          }),
        });
        const data = await res.json();
        if (data.isMeaningfulReader) {
          setIsMeaningful(true);
        }
      } catch (e) {}
    }, 15000);

    return () => {
      clearInterval(timer);
      clearInterval(heartbeatTimer);
    };
  }, [publication.id, currentPage, totalPages, visitedPages]);

  // 3. Navigation handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setJumpPageInput(prev.toString());
      setVisitedPages((pages) => Array.from(new Set([...pages, prev])));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setJumpPageInput(next.toString());
      setVisitedPages((pages) => Array.from(new Set([...pages, next])));
    }
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(jumpPageInput);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setCurrentPage(target);
      setVisitedPages((pages) => Array.from(new Set([...pages, target])));
    } else {
      setJumpPageInput(currentPage.toString());
    }
  };

  // 4. Zoom handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(200, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 15));
  const handleResetZoom = () => setZoomLevel(100);

  // 5. Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // 6. Keyboard navigation (Left, Right arrows, F for fullscreen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') handlePrevPage();
      if (e.key === 'ArrowRight') handleNextPage();
      if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // 7. Track share event
  const trackShare = async (platform: string) => {
    try {
      await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId: publication.id, platform }),
      });
    } catch (e) {}
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    trackShare('COPY_LINK');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: publication.title,
          text: `${publication.magazineTitle || ''} — ${publication.title}`,
          url: window.location.href,
        });
        trackShare('NATIVE');
      } catch (e) {}
    } else {
      setShowShareModal(true);
    }
  };

  // Safe PDF embed URL
  const pdfEmbedUrl = `${publication.pdfUrl}#page=${currentPage}&view=FitH&toolbar=0&navpanes=0`;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-full bg-stone-950 text-stone-100 select-none overflow-hidden font-sans"
    >
      {/* Top distraction-free navigation toolbar */}
      <header className="h-14 sm:h-16 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 px-3 sm:px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-lg">
        {/* Left: Back button & Title info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/magazine"
            className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition border border-stone-700/60"
            title="ফিরে যান"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          <div className="min-w-0">
            <h1 className="font-serif font-bold text-xs sm:text-sm text-stone-100 truncate">
              {publication.title}
            </h1>
            <p className="text-[10px] sm:text-xs text-amber-500/90 truncate">
              {publication.magazineTitle}{' '}
              {publication.volume && `• ${publication.volume}`}{' '}
              {publication.issueNumber && `• ${publication.issueNumber}`}
            </p>
          </div>
        </div>

        {/* Center: Page Jump and Indicators */}
        <div className="hidden md:flex items-center gap-2 bg-stone-800/90 px-3 py-1.5 rounded-2xl border border-stone-700/70 shadow-inner">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="পূর্ববর্তী পৃষ্ঠা (←)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handleJumpSubmit} className="flex items-center gap-1.5 text-xs font-mono">
            <input
              type="text"
              value={jumpPageInput}
              onChange={(e) => setJumpPageInput(e.target.value)}
              className="w-10 text-center py-0.5 rounded bg-stone-900 border border-stone-700 text-amber-400 focus:outline-none focus:border-amber-500 text-xs font-bold"
            />
            <span className="text-stone-400">/</span>
            <span className="text-stone-300 font-bold">{toBengaliNumber(totalPages)}</span>
          </form>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-lg text-stone-300 hover:text-white hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
            title="পরবর্তী পৃষ্ঠা (→)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Zoom, Fullscreen, Bookmark, Share, Download Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Zoom controls (desktop only) */}
          <div className="hidden lg:flex items-center gap-1 bg-stone-800/80 px-2 py-1 rounded-xl border border-stone-700/60">
            <button
              onClick={handleZoomOut}
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-700 rounded transition"
              title="ছোট করুন (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="text-[11px] font-mono font-bold px-1.5 text-amber-400 hover:underline"
              title="রিসেট"
            >
              {zoomLevel}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1 text-stone-300 hover:text-white hover:bg-stone-700 rounded transition"
              title="বড় করুন (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bookmark */}
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-xl transition border ${
              isBookmarked
                ? 'bg-amber-600/30 text-amber-400 border-amber-500/50'
                : 'bg-stone-800/80 text-stone-300 hover:text-white hover:bg-stone-700 border-stone-700/60'
            }`}
            title={isBookmarked ? 'বুকমার্ক সরানো হয়েছে' : 'বর্তমান পৃষ্ঠা বুকমার্ক করুন'}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-amber-400" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>

          {/* Share */}
          {publication.allowShare !== false && (
            <button
              onClick={handleNativeShare}
              className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition border border-stone-700/60"
              title="শেয়ার করুন"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {/* Download (if permitted) */}
          {publication.allowDownload !== false && (
            <a
              href={`/api/publications/${publication.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackShare('DOWNLOAD')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amber-900/30 transition"
              title="PDF ডাউনলোড করুন"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ডাউনলোড</span>
            </a>
          )}

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white transition border border-stone-700/60"
            title={isFullscreen ? 'ফুলস্ক্রিন বন্ধ' : 'ফুলস্ক্রিন মোড (F)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main PDF viewport */}
      <main className="flex-1 relative flex items-center justify-center overflow-auto bg-stone-900/80 p-2 sm:p-4">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/80 backdrop-blur-sm gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-stone-300">ডিজিটাল সংখ্যাটি লোড হচ্ছে...</p>
          </div>
        )}

        {errorMsg ? (
          <div className="max-w-md p-6 rounded-3xl bg-stone-900 border border-red-500/30 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-base text-stone-100 mb-1">
              লোড করতে সমস্যা হয়েছে
            </h3>
            <p className="text-xs text-stone-400 mb-4">{errorMsg}</p>
            <button
              onClick={() => {
                setErrorMsg(null);
                setIsLoading(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs"
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        ) : (
          <div
            className="h-full w-full max-w-5xl flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            <object
              data={pdfEmbedUrl}
              type="application/pdf"
              className="w-full h-full rounded-2xl shadow-2xl border border-stone-800 bg-white"
              onLoad={() => setIsLoading(false)}
            >
              {/* Fallback for browsers that don't support embedded objects */}
              <iframe
                src={pdfEmbedUrl}
                className="w-full h-full rounded-2xl border border-stone-800"
                onLoad={() => setIsLoading(false)}
                title={publication.title}
              />
            </object>
          </div>
        )}
      </main>

      {/* Bottom Mobile Floating Navigation Bar */}
      <footer className="md:hidden h-14 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 px-4 flex items-center justify-between flex-shrink-0 z-30">
        <button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 text-xs font-semibold text-stone-300 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" /> পূর্ববর্তী
        </button>

        <div className="text-xs font-mono font-bold text-amber-400">
          পৃষ্ঠা {toBengaliNumber(currentPage)} / {toBengaliNumber(totalPages)}
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 text-xs font-semibold text-stone-300 disabled:opacity-30"
        >
          পরবর্তী <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-stone-900 border border-stone-800 p-6 shadow-2xl relative">
            <h3 className="font-serif font-bold text-base text-stone-100 mb-1">সাময়িকী শেয়ার করুন</h3>
            <p className="text-xs text-stone-400 mb-5">
              মননশীল পাঠকদের সাথে এই সংখ্যাটির লিঙ্ক শেয়ার করুন।
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              <button
                onClick={() => {
                  trackShare('FACEBOOK');
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      window.location.href
                    )}`,
                    '_blank'
                  );
                }}
                className="py-2.5 px-3 rounded-2xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center justify-center gap-2"
              >
                ফেসবুক
              </button>

              <button
                onClick={() => {
                  trackShare('WHATSAPP');
                  window.open(
                    `https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `${publication.title} - ${window.location.href}`
                    )}`,
                    '_blank'
                  );
                }}
                className="py-2.5 px-3 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2"
              >
                হোয়াটসঅ্যাপ
              </button>
            </div>

            <div className="flex items-center gap-2 bg-stone-800 p-2 rounded-2xl border border-stone-700">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? window.location.href : ''}
                className="bg-transparent text-xs text-stone-300 w-full outline-none truncate font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1 flex-shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'কপি হয়েছে' : 'কপি'}
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="mt-4 w-full py-2 rounded-xl bg-stone-800 text-stone-400 hover:text-stone-200 text-xs font-semibold"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

