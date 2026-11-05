import React from 'react';

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-bengali space-y-8">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          রিফান্ড ও রিটার্ন নীতি (Refund & Returns Policy)
        </h1>
        <p className="text-xs text-stone-500 mt-1">সর্বশেষ পরিমার্জন: অক্টোবর ২০২৬</p>
      </div>

      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 sm:p-12 shadow-sm space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">১. মুদ্রিত বইয়ের রিটার্ন ও পরিবর্তন</h2>
        <p>
          মুদ্রিত বই হাতে পাওয়ার পর কোনো পৃষ্ঠা ছেঁড়া, বাইন্ডিং ত্রুটি বা ভুল বই পৌঁছালে ৭ দিনের মধ্যে অভিযোগ জানালে সম্পূর্ণ বিনামূল্যে সঠিক বইটি প্রতিস্থাপন করা হবে।
        </p>

        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">২. ডিজিটাল সাবস্ক্রিপশন ও বই রিফান্ড</h2>
        <p>
          ডিজিটাল পণ্যের তাৎক্ষণিক ডেলিভারির কারণে সম্পূর্ণ ডাউনলোডকৃত বা পঠিত বইয়ের মূল্য ফেরতযোগ্য নয়। তবে ভুলবশত একাধিকবার একই বইয়ের মূল্য কর্তিত হলে বা প্রযুক্তিগত ত্রুটিতে ডিজিটাল বই পড়া সম্ভব না হলে ৩ কার্যদিবসের মধ্যে পূর্ণ অর্থ রিফান্ড করা হবে।
        </p>
      </div>
    </div>
  );
}

