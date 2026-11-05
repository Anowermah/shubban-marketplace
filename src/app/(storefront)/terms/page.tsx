import React from 'react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-bengali space-y-8">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          ব্যবহারের শর্তাবলি (Terms & Conditions)
        </h1>
        <p className="text-xs text-stone-500 mt-1">সর্বশেষ পরিমার্জন: অক্টোবর ২০২৬</p>
      </div>

      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 sm:p-12 shadow-sm space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">১. প্ল্যাটফর্ম ব্যবহারের অঙ্গীকার</h2>
        <p>
          শুব্বান লাইব্রেরীতে প্রবেশের মাধ্যমে আপনি এই শর্তাবলি মেনে নিতে সম্মত হচ্ছেন। এই প্ল্যাটফর্মের সমস্ত সাহিত্য, বই, সাময়িকী এবং গবেষণামূলক সামগ্রী জ্ঞানচর্চা, ব্যক্তিগত পাঠ এবং গবেষণার উদ্দেশ্যে ব্যবহৃত হবে।
        </p>

        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">২. ডিজিটাল কনটেন্ট লাইসেন্স</h2>
        <p>
          ডিজিটাল লাইব্রেরীর বই ও সাময়িকী ইন-ব্রাউজার পড়ার জন্য অনুমোদিত। কোনো ডিজিটাল কনটেন্ট অননুমোদিতভাবে বাণিজ্যিক উদ্দেশ্যে পুনরুৎপাদন, পাইরেসি বা গণবণ্টন করা আইনত দণ্ডনীয়।
        </p>

        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">৩. অ্যাকাউন্ট ও নিরাপত্তা</h2>
        <p>
          ব্যবহারকারী তাঁর অ্যাকাউন্টের তথ্যের গোপনীয়তা রক্ষার জন্য দায়ী। কোনো অ্যাকাউন্ট অপব্যবহার বা বাণিজ্যিক শেয়ারিং চিহ্নিত হলে তা স্থগিত করার অধিকার শুব্বান লাইব্রেরী সংরক্ষণ করে।
        </p>
      </div>
    </div>
  );
}

