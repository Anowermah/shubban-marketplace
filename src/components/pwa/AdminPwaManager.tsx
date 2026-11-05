'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, X, ShieldCheck, Bell, BellOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  registerAdminServiceWorker,
  isStandalone,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/pwa/client-pwa';

interface AdminPwaManagerProps {
  onInstallStateChange?: (canInstall: boolean) => void;
}

export default function AdminPwaManager({ onInstallStateChange }: AdminPwaManagerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // 1. Standalone check
    if (isStandalone()) {
      setIsInstalled(true);
    }

    // 2. Register Admin Service Worker
    registerAdminServiceWorker((reg) => {
      setSwRegistration(reg);
      setWaitingWorker(reg.waiting);
      setUpdateAvailable(true);
    }).then((reg) => {
      if (reg) {
        setSwRegistration(reg);
        // Check notification permission
        if ('Notification' in window) {
          setPushStatus(Notification.permission as any);
        } else {
          setPushStatus('unsupported');
        }
      }
    });

    // 3. Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (onInstallStateChange) onInstallStateChange(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (onInstallStateChange) onInstallStateChange(false);
      console.log('[PWA Admin] Admin management app installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onInstallStateChange]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleApplyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  const handleTogglePush = async () => {
    if (!swRegistration) return;
    setIsSubscribing(true);

    try {
      if (pushStatus === 'granted') {
        const res = await unsubscribeFromPush(swRegistration);
        if (res.success) {
          setPushStatus('default');
        }
      } else {
        const res = await subscribeToPush(swRegistration, 'ADMIN');
        if (res.success) {
          setPushStatus('granted');
        } else if (res.error?.includes('denied')) {
          setPushStatus('denied');
        }
      }
    } catch (e) {
      console.error('Error toggling admin push:', e);
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <>
      {/* 1. Admin Update Notification Banner */}
      {updateAvailable && (
        <aside
          role="region"
          aria-label="Admin update banner"
          className="fixed top-20 right-4 z-50 max-w-sm bg-stone-900 border border-amber-500/50 text-stone-100 p-4 rounded-2xl shadow-2xl font-bengali flex items-center justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="text-xs min-w-0">
              <span className="font-bold text-amber-300 block">অ্যাডমিন সিস্টেম আপডেট</span>
              <span className="text-[10px] text-stone-400 truncate block">
                নতুন ভার্সন রিলিজ হয়েছে
              </span>
            </div>
          </div>
          <button
            onClick={handleApplyUpdate}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition"
          >
            রিলোড
          </button>
        </aside>
      )}

      {/* 2. Global event listener trigger for Admin layout (Exposed via window) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.__shubbanAdminPromptInstall = function() {
              if (window.__adminInstallPrompt) {
                window.__adminInstallPrompt.prompt();
              }
            };
          `,
        }}
      />
    </>
  );
}

