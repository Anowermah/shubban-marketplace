'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthContext';
import {
  Feather,
  BookOpen,
  FileText,
  GraduationCap,
  Newspaper,
  CheckCircle2,
  Upload,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function SubmitContentPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [type, setType] = useState<'BOOK' | 'ARTICLE' | 'RESEARCH' | 'MAGAZINE'>('ARTICLE');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('সাহিত্য ও প্রবন্ধ');
  const [description, setDescription] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          category,
          description: description.trim(),
          fileUrl: fileUrl || '/samples/sample-author-submission.pdf',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'জমা দিতে সমস্যা হয়েছে।');
      }

      setSuccessMsg('আপনার লেখা/পাণ্ডুলিপি সফলভাবে জমা হয়েছে! শুব্বান সম্পাদকীয় পরিষদ পর্যালোচনা করে আপনার সাথে যোগাযোগ করবে।');
      setTitle('');
      setDescription('');
      setFileUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || 'সাবমিশন ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-bengali space-y-10">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-shubban-gold/15 text-shubban-gold border border-shubban-gold/30">
          <Feather className="w-4 h-4" />
          <span>শুব্বান লেখক ও প্রকাশক পোর্টাল</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          বই, প্রবন্ধ বা গবেষণাপত্র জমা দিন
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
          আপনার মৌলিক সাহিত্যকর্ম, গ্রন্থ পাণ্ডুলিপি বা গবেষণাপত্র শুব্বান লাইব্রেরীর সম্পাদকীয় বোর্ডের নিকট সরাসরি মূল্যায়নের জন্য দাখিল করুন।
        </p>
      </div>

      {/* Submission Card */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-10 shadow-sm space-y-8">
        {/* Content Type Selector */}
        <div>
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-3">
            ১. দাখিলকৃত বিষয়ের ধরণ নির্বাচন করুন:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setType('ARTICLE')}
              className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                type === 'ARTICLE'
                  ? 'border-shubban-green bg-shubban-green/5 dark:bg-shubban-green-950/20 ring-2 ring-shubban-green/30 font-bold text-shubban-green dark:text-shubban-gold'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
              }`}
            >
              <FileText className="w-5 h-5 text-shubban-gold" />
              <span className="text-xs">প্রবন্ধ বা নিবন্ধ</span>
            </button>

            <button
              type="button"
              onClick={() => setType('BOOK')}
              className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                type === 'BOOK'
                  ? 'border-shubban-green bg-shubban-green/5 dark:bg-shubban-green-950/20 ring-2 ring-shubban-green/30 font-bold text-shubban-green dark:text-shubban-gold'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
              }`}
            >
              <BookOpen className="w-5 h-5 text-shubban-gold" />
              <span className="text-xs">সম্পূর্ণ বই পাণ্ডুলিপি</span>
            </button>

            <button
              type="button"
              onClick={() => setType('RESEARCH')}
              className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                type === 'RESEARCH'
                  ? 'border-shubban-green bg-shubban-green/5 dark:bg-shubban-green-950/20 ring-2 ring-shubban-green/30 font-bold text-shubban-green dark:text-shubban-gold'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
              }`}
            >
              <GraduationCap className="w-5 h-5 text-shubban-gold" />
              <span className="text-xs">একাডেমিক গবেষণাপত্র</span>
            </button>

            <button
              type="button"
              onClick={() => setType('MAGAZINE')}
              className={`p-4 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                type === 'MAGAZINE'
                  ? 'border-shubban-green bg-shubban-green/5 dark:bg-shubban-green-950/20 ring-2 ring-shubban-green/30 font-bold text-shubban-green dark:text-shubban-gold'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
              }`}
            >
              <Newspaper className="w-5 h-5 text-shubban-gold" />
              <span className="text-xs">সাময়িকীর বিশেষ সংখ্যা</span>
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              লেখা বা বইয়ের শিরোনাম *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: বঙ্গীয় সাহিত্য পরিষদের শতবর্ষ ও পাণ্ডুলিপি ঐতিহ্য"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              বিষয়শ্রেণী / ক্যাটাগরি *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            >
              <option value="সাহিত্য ও প্রবন্ধ">সাহিত্য ও প্রবন্ধ</option>
              <option value="ইতিহাস ও ঐতিহ্য">ইতিহাস ও ঐতিহ্য</option>
              <option value="দর্শন ও চিন্তা">দর্শন ও চিন্তা</option>
              <option value="ইসলামিক ঐতিহ্য">ইসলামিক ঐতিহ্য</option>
              <option value="ভাষাতত্ত্ব ও গবেষণা">ভাষাতত্ত্ব ও গবেষণা</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              সারসংক্ষেপ, ভূমিকা বা মূল লেখা *
            </label>
            <textarea
              rows={6}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="আপনার লেখার সারসংক্ষেপ, গবেষণার মূল বিষয়বস্তু অথবা রচনার পূর্ণাঙ্গ টেক্সট এখানে প্রদান করুন..."
              className="w-full p-4 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
              পাণ্ডুলিপি বা পিডিএফ ফাইল লিংক / ড্রাইভ লিংক (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://drive.google.com/... অথবা অনুমোদিত ফাইল ইউআরএল"
              className="w-full px-4 py-2.5 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-shubban-gold"
            />
          </div>

          {/* Copyright Declaration */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              আমি নিশ্চয়তা প্রদান করছি যে দাখিলকৃত রচনাটি আমার স্বত্বাধিকারভুক্ত/অনুমোদিত মৌলিক সাহিত্যকর্ম। শুব্বান লাইব্রেরী কোনো ধরণের চৌর্যবৃত্তি বা অনুমতিহীন কপিরাইট লঙ্ঘনকে সমর্থন করে না।
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'দাখিল হচ্ছে...' : 'পাণ্ডুলিপি দাখিল করুন'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

