'use client';

import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-bengali space-y-12">
      <div className="text-center space-y-3">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 dark:text-stone-100">
          যোগাযোগ ও পাঠক সহায়তা
        </h1>
        <p className="text-sm text-stone-500 max-w-lg mx-auto">
          যেকোনো জিজ্ঞাসা, বই সংক্রান্ত তথ্য বা প্রাতিষ্ঠানিক সহযোগিতার জন্য আমাদের সাথে যোগাযোগ করুন।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Contact info details */}
        <div className="md:col-span-5 bg-shubban-green text-shubban-ivory rounded-2xl p-8 space-y-6 flex flex-col justify-between shadow-lg">
          <div className="space-y-6">
            <h2 className="font-serif font-bold text-2xl text-white">
              শুব্বান লাইব্রেরী কার্যালয়
            </h2>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-shubban-gold flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-shubban-gold">ঠিকানা</span>
                  <p className="text-shubban-ivory/80 leading-relaxed mt-0.5">
                    বাংলাবাজার ও কাঁটাবন জ্ঞান চত্বর, ঢাকা, বাংলাদেশ
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-shubban-gold flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-shubban-gold">হেল্পলাইন</span>
                  <p className="text-shubban-ivory/80 mt-0.5">+৮৮০ ১৭১১-০০০০০০ (সকাল ৯টা - রাত ৯টা)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-shubban-gold flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-shubban-gold">ইমেইল</span>
                  <p className="text-shubban-ivory/80 mt-0.5">support@shubbanlibrary.com</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/10 text-xs text-shubban-ivory/80 leading-relaxed">
            প্রাতিষ্ঠানিক ও বাল্ক বই ক্রয়ের জন্য সরাসরি আমাদের হেল্পলাইনে কল করুন।
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 shadow-sm">
          {submitted ? (
            <div className="py-12 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-stone-100">
                ধন্যবাদ! আপনার বার্তাটি গৃহীত হয়েছে
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                আমাদের পাঠক সেবা দল দ্রুততম সময়ে আপনার ইমেইলে উত্তর প্রদান করবে।
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  আপনার নাম *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  ইমেইল ঠিকানা *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  বিষয় *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                  আপনার বার্তা / জিজ্ঞাসা *
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 text-xs rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-shubban-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs shadow flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>বার্তা পাঠান</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

