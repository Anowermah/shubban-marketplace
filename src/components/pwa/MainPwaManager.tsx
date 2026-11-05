'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, Share2 } from 'lucide-react';
import {
  registerMainServiceWorker,
  isStandalone,
  isIOS,
} from '@/lib/pwa/client-pwa';

export default function MainPwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already installed
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    // 2. Register Main Service Worker
    registerMainServiceWorker((reg) => {
      setSwRegistration(reg);
      setWaitingWorker(reg.waiting);
      setUpdateAvailable(true);
    }).then((reg) => {
      if (reg) {
        setSwRegistration(reg);
      }
    });

    // 3. Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Check if user previously dismissed in last 7 days
      const lastDismissed = localStorage.getItem('shubban_pwa_install_dismissed');
      if (lastDismissed) {
        const diffDays = (Date.now() - parseInt(lastDismissed, 10)) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) return;
      }

      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA Main] App successfully installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS()) {
      setShowIosGuide(true);
    }
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('shubban_pwa_install_dismissed', String(Date.now()));
  };

  const handleApplyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  return (
    <>
      {/* 1. Update Notification Toast (Top-Right System Zone) */}
      {updateAvailable && (
        <aside
          role="region"
          aria-label="Update notification"
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm bg-stone-900 text-stone-100 p-3.5 rounded-2xl shadow-2xl border border-amber-500/40 flex items-center justify-between gap-3 font-bengali animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin" />
            </div>
            <div className="text-xs min-w-0">
              <span className="font-bold block text-amber-300">নতুন সংস্করণ প্রস্তুত</span>
              <span className="text-[11px] text-stone-400 truncate block">
                শুব্বান লাইব্রেরী অ্যাপ আপডেট করুন
              </span>
            </div>
          </div>
          <button
            onClick={handleApplyUpdate}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition flex-shrink-0"
          >
            আপডেট
          </button>
        </aside>
      )}

      {/* 2. Non-intrusive Install App Banner (Top-Right System Zone) */}
      {showInstallBanner && !isInstalled && (
        <aside
          role="region"
          aria-label="App installation banner"
          className="fixed top-20 right-4 sm:right-6 z-45 w-[92vw] sm:w-[360px] max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-2xl shadow-2xl font-bengali animate-in fade-in slide-in-from-top-3 duration-300"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-950 border border-amber-600/40 p-1 flex-shrink-0 flex items-center justify-center shadow-md">
                <img
                  src="/icons/main/icon-192x192.png"
                  alt="Shubban Libery"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  শুব্বান লাইব্রেরী অ্যাপ
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  অফলাইন রিডিং ও দ্রুত হোমস্ক্রিন এক্সেস
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissInstall}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 rounded-lg"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 hover:from-amber-700 hover:to-amber-800 transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ইনস্টল করুন</span>
            </button>
            <button
              onClick={handleDismissInstall}
              className="py-2 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 font-bold text-xs transition"
            >
              পরে করব
            </button>
          </div>
        </aside>
      )}

      {/* 3. iOS Safari Manual Installation Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-bengali">
          <div className="max-w-sm w-full bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-600" />
                <span>iPhone / iPad এ ইনস্টল করুন</span>
              </h3>
              <button
                onClick={() => setShowIosGuide(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-3 text-xs text-stone-600 dark:text-stone-300">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                  ১
                </span>
                <span>Safari ব্রাউজারের নিচের <strong>Share (শেয়ার)</strong> আইকনটিতে ট্যাপ করুন।</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                  ২
                </span>
                <span>মেনু স্ক্রোল করে <strong>Add to Home Screen (+ হোম স্ক্রিনে যোগ করুন)</strong> বেছে নিন।</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                  ৩
                </span>
                <span>উপরে ডানপাশে <strong>Add</strong> চাপলেই শুব্বান লাইব্রেরী অ্যাপ হিসেবে ইনস্টল হয়ে যাবে।</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs hover:bg-stone-200 transition"
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  );
}
