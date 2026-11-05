import React from 'react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-bengali space-y-8">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          গোপনীয়তা নীতি (Privacy Policy)
        </h1>
        <p className="text-xs text-stone-500 mt-1">সর্বশেষ পরিমার্জন: অক্টোবর ২০২৬</p>
      </div>

      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 sm:p-12 shadow-sm space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">১. ব্যক্তিগত তথ্যের নিরাপত্তা</h2>
        <p>
          শুব্বান লাইব্রেরী ব্যবহারকারীদের তথ্যের গোপনীয়তাকে সর্বোচ্চ গুরুত্ব দেয়। আপনার নাম, ইমেইল, মোবাইল নম্বর ও ডেলিভারি ঠিকানা কেবলমাত্র অর্ডার ডেলিভারি ও যোগাযোগ ব্যতিরেকে কোনো তৃতীয় পক্ষের কাছে বিক্রয় বা হস্তান্তর করা হয় না।
        </p>

        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">২. পেমেন্ট তথ্য সংরক্ষণ</h2>
        <p>
          আমরা কোনো ধরণের ক্রেডিট/ডেবিট কার্ড নম্বর, CVV কোড বা মোবাইল ফাইন্যান্সিয়াল সার্ভিসের গোপন পিন (PIN) সার্ভারে সংরক্ষণ করি না। পেমেন্ট গেটওয়ের সমস্ত লেনদেন সরাসরি বাংলাদেশ ব্যাংক অনুমোদিত এনক্রিপ্টেড চ্যানেলে পরিচালিত হয়।
        </p>

        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">৩. কুকিজ ও পাঠ অগ্রগতি</h2>
        <p>
          আমরা ইন-ব্রাউজার রিডারের শেষ পঠিত পৃষ্ঠা মনে রাখা এবং থিম পছন্দ সংরক্ষণ করতে ব্রাউজার লোকাল স্টোরেজ ও নিরাপদ কুকিজ ব্যবহার করি।
        </p>
      </div>
    </div>
  );
}

