import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthContext';
import { CartProvider } from '@/components/providers/CartContext';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description:
    'শুব্বান লাইব্রেরী — ডিজিটাল লাইব্রেরী ও অনলাইন বুকশপ। মুদ্রিত ও ডিজিটাল বই, সাময়িকী, প্রবন্ধ, গবেষণাপত্র ও সমৃদ্ধ প্রশ্নোত্তর ফোরাম।',
  keywords: [
    'শুব্বান লাইব্রেরী',
    'ডিজিটাল লাইব্রেরী বাংলাদেশ',
    'অনলাইন বইয়ের দোকান',
    'বাংলা বই ডাউনলোড',
    'বাংলা ই-বুক',
    'গবেষণাপত্র',
    'বাংলা সাময়িকী',
  ],
  authors: [{ name: 'Shubban Library Editorial Council' }],
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: 'বই, জ্ঞান ও মননশীলতার এক সমৃদ্ধ ঠিকানা। উন্মুক্ত ও প্রিমিয়াম ডিজিটাল লাইব্রেরী।',
    locale: 'bn_BD',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen flex flex-col font-bengali bg-shubban-ivory dark:bg-shubban-darkBg text-shubban-charcoal dark:text-stone-100 transition-colors"
      >
        <Script
          id="extension-and-cache-guard"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window === 'undefined') return;

                function isExtensionErr(evt) {
                  try {
                    var msg = evt && (evt.message || (evt.reason && (evt.reason.message || evt.reason.stack)) || '');
                    var file = (evt && evt.filename) || '';
                    var stack = (evt && evt.error && evt.error.stack) || '';
                    var str = (String(msg) + ' ' + String(file) + ' ' + String(stack)).toLowerCase();
                    return (
                      str.indexOf('metamask') !== -1 ||
                      str.indexOf('nkbihfbeogaeaoehlefnkodbefgpgknn') !== -1 ||
                      str.indexOf('chrome-extension://') !== -1 ||
                      str.indexOf('moz-extension://') !== -1 ||
                      str.indexOf('inpage.js') !== -1
                    );
                  } catch (e) {
                    return false;
                  }
                }

                function isChunkOrFactoryErr(evt) {
                  try {
                    var msg = evt && (evt.message || (evt.reason && (evt.reason.message || evt.reason.stack)) || '');
                    var stack = (evt && evt.error && evt.error.stack) || '';
                    var str = (String(msg) + ' ' + String(stack)).toLowerCase();
                    return (
                      str.indexOf("reading 'call'") !== -1 ||
                      str.indexOf("reading \\"call\\"") !== -1 ||
                      str.indexOf("options.factory") !== -1 ||
                      str.indexOf("loading chunk") !== -1
                    );
                  } catch (e) {
                    return false;
                  }
                }

                function handleRuntimeErr(e) {
                  if (isExtensionErr(e)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return;
                  }
                  if (isChunkOrFactoryErr(e)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    console.warn('[Auto-Heal] Stale webpack chunk detected. Purging cache and auto-reloading...');
                    try {
                      if ('caches' in window) {
                        caches.keys().then(function(keys) {
                          keys.forEach(function(k) { caches.delete(k); });
                        });
                      }
                      if ('serviceWorker' in navigator && (location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
                        navigator.serviceWorker.getRegistrations().then(function(regs) {
                          regs.forEach(function(r) { r.unregister(); });
                        });
                      }
                    } catch(err) {}
                    var lastReload = sessionStorage.getItem('shubban_chunk_reload');
                    if (!lastReload || (Date.now() - parseInt(lastReload, 10)) > 6000) {
                      sessionStorage.setItem('shubban_chunk_reload', String(Date.now()));
                      window.location.reload();
                    }
                  }
                }

                window.addEventListener('error', handleRuntimeErr, true);
                window.addEventListener('unhandledrejection', handleRuntimeErr, true);

                // In development / localhost, proactively unregister any Service Workers and purge caches
                try {
                  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function(regs) {
                        for (var i = 0; i < regs.length; i++) {
                          regs[i].unregister();
                        }
                      });
                    }
                    if ('caches' in window) {
                      caches.keys().then(function(keys) {
                        keys.forEach(function(key) {
                          caches.delete(key);
                        });
                      });
                    }
                  } else if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      keys.forEach(function(key) {
                        if (key.indexOf('v1.0.0') !== -1 || key.indexOf('v1.0.1') !== -1) {
                          caches.delete(key);
                        }
                      });
                    });
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
