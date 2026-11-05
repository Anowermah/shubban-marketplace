'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export default function HomeNewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setEmail('');
    }, 600);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-shubban-green-950 via-shubban-green to-emerald-950 text-white p-8 sm:p-12 border-2 border-shubban-gold/40 shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-4 h-4" />
              <span>শুব্বান পাঠক ও গবেষক কমিউনিটি</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
              নতুন বই, সাহিত্য সাময়িকী ও বিশেষ অফারের নিয়মিত আপডেট নিন
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed max-w-xl">
              সপ্তাহের বাছাইকৃত চিন্তাশীল প্রবন্ধ, নতুন প্রকাশিত বইয়ের আলোচনা, বিশেষ ডিসকাউন্ট কুপন ও উন্মুক্ত ডিজিটাল লাইব্রেরীর রিলিজ সরাসরি আপনার ইমেইলে পৌঁছে যাবে।
            </p>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-emerald-200/90 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>সাপ্তাহিক সাহিত্য ডাইজেস্ট</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>কোনো স্প্যাম নয়</span>
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>{toBengaliNumber('12500')}+ পাঠক যুক্ত আছেন</span>
              </span>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-white/15 shadow-inner">
            {isSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto text-amber-300 border border-amber-400/30">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-lg text-white">
                  ধন্যবাদ! আপনি যুক্ত হয়েছেন
                </h3>
                <p className="text-xs text-emerald-100/80">
                  আমাদের পরবর্তী প্রকাশনা ও বিশেষ কুপন কোড আপনার ইনবক্সে পাঠিয়ে দেওয়া হবে।
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="text-xs text-amber-300 hover:underline pt-2 inline-block font-semibold"
                >
                  অন্য ইমেইল যুক্ত করুন &rarr;
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-serif font-bold text-base text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-300" />
                  <span>বিনামূল্যে সাবস্ক্রাইব করুন</span>
                </h3>

                <div className="space-y-2">
                  <label className="text-[11px] text-emerald-100/70 block">
                    আপনার ইমেইল ঠিকানা
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@domain.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/20 text-white placeholder-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'প্রক্রিয়াধীন...' : 'নিউজলেটার যুক্ত করুন'}</span>
                </button>

                <p className="text-[10px] text-emerald-200/60 text-center">
                  আপনার তথ্য সম্পূর্ণ সুরক্ষিত। যেকোনো সময় আনসাবস্ক্রাইব করতে পারেন।
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Subtle background decoration */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
      </div>
    </section>
  );
}

