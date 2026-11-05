import React from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export default function FAQPage() {
  const faqs = [
    {
      q: 'শুব্বান লাইব্রেরীতে বই কীভাবে পড়া যায়?',
      a: 'শুব্বান ডিজিটাল লাইব্রেরীর সমস্ত মুক্ত বই যেকোনো ডিভাইসে সরাসরি ইন-ব্রাউজার রিডারের মাধ্যমে পড়া যায়। কোনো অ্যাপ্লিকেশন ডাউনলোড বা ইন্সটল করার প্রয়োজন নেই। প্রিমিয়াম বইগুলোর ক্ষেত্রে সদস্যপদ গ্রহণ করে সম্পূর্ণ বই আনলক করা যায়।',
    },
    {
      q: 'মুদ্রিত বই কেনার পর কীভাবে ডেলিভারি পাব?',
      a: 'আমরা ঢাকা মেট্রোপলিটনে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে এবং ঢাকার বাইরে সারাদেশের যেকোনো জেলায় ২ থেকে ৩ কার্যদিবসের মধ্যে কুরিয়ার সার্ভিসের মাধ্যমে হোম ডেলিভারি প্রদান করি। ক্যাশ অন ডেলিভারি সুবিধা উপলব্ধ রয়েছে।',
    },
    {
      q: 'পেমেন্টের কী কী মাধ্যম সমর্থিত?',
      a: 'আমরা বিকাশ (bKash), নগদ (Nagad), ভিসা ও মাস্টারকার্ড, ইন্টারনেট ব্যাংকিং (SSLCommerz) এবং ক্যাশ অন ডেলিভারি (COD) সমর্থন করি। সমস্ত অনলাইন ট্রানজেকশন সম্পূর্ণ এনক্রিপ্টেড ও নিরাপদ।',
    },
    {
      q: 'ডিজিটাল ই-বুক কি ডাউনলোড করা যায়?',
      a: 'যেসব বই মুক্ত লাইসেন্সের আওতাভুক্ত বা প্রকাশকের অনুমোদন রয়েছে, সেগুলো অনুমোদিত PDF হিসেবে ডাউনলোড করা যায়। আপনার ক্রয়কৃত বইয়ের ওপর আপনার অ্যাকাউন্ট রেফারেন্স সহ নিরাপত্তা জলছাপ থাকবে।',
    },
    {
      q: 'লেখক বা প্রকাশক হিসেবে কীভাবে লেখা বা বই জমা দেওয়া যাবে?',
      a: 'আমাদের ‘লেখক ও প্রকাশক’ পোর্টাল বা সরাসরি “বই জমা দিন” মেনুতে গিয়ে আপনার রচনার পাণ্ডুলিপি, সারসংক্ষেপ ও ড্রাইভ লিংক দাখিল করতে পারেন। আমাদের সম্পাদকীয় পরিষদ পাণ্ডুলিপি যাচাই করে অনুমোদনের সিদ্ধান্ত জানাবে।',
    },
    {
      q: 'বইয়ে মুদ্রণ ত্রুটি থাকলে কি পরিবর্তন করা সম্ভব?',
      a: 'হ্যাঁ, বই হাতে পাওয়ার ৭ দিনের মধ্যে যেকোনো পৃষ্ঠা মিসিং বা মুদ্রণ ত্রুটি পরিলক্ষিত হলে আমরা সম্পূর্ণ বিনামূল্যে বইটি পরিবর্তন করে দেই।',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-bengali space-y-10">
      <div className="text-center space-y-3">
        <h1 className="font-serif text-3xl sm:text-5xl font-bold text-stone-900 dark:text-stone-100">
          সাধারণ জিজ্ঞাসা (FAQ)
        </h1>
        <p className="text-sm text-stone-500 max-w-lg mx-auto">
          শুব্বান লাইব্রেরী ব্যবহার, বই পড়া, অর্ডার ও ডেলিভারি সম্পর্কিত সচরাচর প্রশ্নের উত্তর।
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div
            key={i}
            className="p-6 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2"
          >
            <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 flex items-start gap-2">
              <span className="text-shubban-gold font-bold">প্র:</span>
              <span>{f.q}</span>
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed pl-5">
              {f.a}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

