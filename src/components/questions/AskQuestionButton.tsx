'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, HelpCircle, Send } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthContext';

interface AskQuestionButtonProps {
  categories: Array<{ id: string; name: string; slug: string }>;
}

export default function AskQuestionButton({ categories }: AskQuestionButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'প্রশ্ন প্রকাশে সমস্যা হয়েছে।');
      }

      setIsOpen(false);
      setTitle('');
      setContent('');
      router.push(`/questions/${data.question.slug}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'প্রশ্ন প্রকাশ ব্যর্থ হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs shadow flex items-center gap-2 transition-all"
      >
        <Plus className="w-4 h-4 text-shubban-gold" />
        <span>নতুন প্রশ্ন করুন</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-bengali">
          <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-shubban-gold" />
                <span>নতুন জ্ঞান জিজ্ঞাসা উপস্থাপন করুন</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  প্রশ্নের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="যেমন: প্রাচীন চর্যাপদের আবিষ্কার ও ভাষার বিকাশ কীভাবে হয়েছিল?"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  বিষয় / বিভাগ *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  প্রশ্নের বিশদ বিবরণ ও পটভূমি *
                </label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="আপনার জিজ্ঞাসা এবং যে বিষয়ে স্পষ্ট ধারণা প্রয়োজন তা বিশদে লিখুন..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'জমা দেওয়া হচ্ছে...' : 'প্রশ্ন প্রকাশ করুন'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
