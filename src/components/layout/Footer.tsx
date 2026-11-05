'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/brand/Logo';
import { FOOTER_LINKS, SITE_TAGLINE } from '@/lib/constants';
import { Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setIsSubscribed(true);
    setNewsletterEmail('');
  };

  return (
    <footer className="bg-shubban-green text-shubban-ivory pt-16 pb-24 md:pb-12 border-t-4 border-shubban-gold font-bengali">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-shubban-ivory/10">
          {/* Brand & Mission column */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size="md" whiteText={true} />
            <p className="text-shubban-ivory/80 text-sm leading-relaxed max-w-sm pt-2">
              {SITE_TAGLINE}। শুব্বান লাইব্রেরী বাংলা ভাষার চিরায়ত ও সমকালীন সাহিত্যের এক সুবিশাল সমন্বিত জ্ঞানক্ষেত্র। মুদ্রিত বই ক্রয়, ডিজিটাল পাঠ ও গবেষণার বিশ্বস্ত প্ল্যাটফর্ম।
            </p>

            <div className="pt-2 space-y-2 text-xs text-shubban-ivory/70">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-shubban-gold flex-shrink-0" />
                <span>বাংলাবাজার ও কাঁটাবন জ্ঞান চত্বর, ঢাকা, বাংলাদেশ</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-shubban-gold flex-shrink-0" />
                <span>+৮৮০ ১৭১১-০০০০০০ (সকাল ৯টা - রাত ৯টা)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-shubban-gold flex-shrink-0" />
                <span>support@shubbanlibrary.com</span>
              </div>
            </div>

            {/* Newsletter Subscription Box */}
            <div className="pt-4">
              <h4 className="text-xs uppercase tracking-wider text-shubban-gold font-bold mb-2">
                সাহিত্য সংবাদ ও নতুন বইয়ের বিজ্ঞপ্তি
              </h4>
              {isSubscribed ? (
                <div className="flex items-center gap-2 text-xs text-shubban-gold bg-shubban-green-900/60 p-2.5 rounded-lg border border-shubban-gold/40">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>ধন্যবাদ! আপনি সফলভাবে আমাদের সাহিত্য সারসংক্ষেপে যুক্ত হয়েছেন।</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="আপনার ইমেইল ঠিকানা দিন..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-shubban-green-900 border border-shubban-green-600/60 text-white placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>যুক্ত হোন</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick Explore Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-shubban-gold tracking-wider uppercase border-b border-shubban-ivory/10 pb-2">
              আর্কাইভ ও অন্বেষণ
            </h3>
            <ul className="space-y-2 text-xs text-shubban-ivory/80">
              {FOOTER_LINKS.explore.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-shubban-gold transition-colors block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular Categories */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-shubban-gold tracking-wider uppercase border-b border-shubban-ivory/10 pb-2">
              জনপ্রিয় বিভাগ
            </h3>
            <ul className="space-y-2 text-xs text-shubban-ivory/80">
              {FOOTER_LINKS.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-shubban-gold transition-colors block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Customer Policies */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-shubban-gold tracking-wider uppercase border-b border-shubban-ivory/10 pb-2">
              নীতিমালা ও সহায়তা
            </h3>
            <ul className="space-y-2 text-xs text-shubban-ivory/80">
              {FOOTER_LINKS.policies.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-shubban-gold transition-colors block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/submit"
                  className="text-shubban-gold font-medium hover:underline block py-0.5"
                >
                  লেখক ও প্রকাশক নির্দেশিকা &rarr;
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Payment Badges */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-shubban-ivory/60 gap-4">
          <div className="flex items-center gap-2">
            <span>© ২০২৬ শুব্বান লাইব্রেরী (Shubban Library)। সর্বস্বত্ব সংরক্ষিত।</span>
          </div>

          {/* Trust & Payment Badges */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-shubban-ivory/50">নিরাপদ পেমেন্ট পদ্ধতি:</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-pink-300 border border-white/10">
                bKash
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-orange-300 border border-white/10">
                Nagad
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-blue-300 border border-white/10">
                SSLCommerz
              </span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-green-300 border border-white/10">
                ক্যাশ অন ডেলিভারি
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
