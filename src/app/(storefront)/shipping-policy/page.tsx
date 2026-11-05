import React from 'react';

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 font-bengali space-y-8">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          ডেলিভারি ও শিপিং পলিসি
        </h1>
        <p className="text-xs text-stone-500 mt-1">সর্বশেষ পরিমার্জন: অক্টোবর ২০২৬</p>
      </div>

      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-8 sm:p-12 shadow-sm space-y-6 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed font-serif">
        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">১. ডেলিভারির সময়সীমা</h2>
        <p>
          ঢাকা মেট্রোপলিটন এলাকায় ২৪ থেকে ৪৮ ঘণ্টার মধ্যে বই পৌঁছে দেওয়া হয়। ঢাকার বাইরে দেশের যেকোনো জেলা, উপজেলা বা প্রত্যন্ত অঞ্চলে ২ থেকে ৪ কার্যদিবসের মধ্যে কুরিয়ার সার্ভিসের মাধ্যমে ডেলিভারি সম্পন্ন হয়।
        </p>

        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">২. শিপিং চার্জ ও প্যাকিং</h2>
        <p>
          ঢাকা মেট্রোপলিটনে স্ট্যান্ডার্ড ডেলিভারি ফি ৳ ৬০ এবং ঢাকার বাইরে সারাদেশের জন্য ৳ ১১০। বই যাতে পরিবহনে সামান্যতম ক্ষতিগ্রস্ত না হয় সেজন্য ওয়াটারপ্রুফ বাবল র‍্যাপ ও মজবুত কার্ডবোর্ড প্যাকিংয়ে বই প্রেরণ করা হয়।
        </p>

        <h2 className="font-serif font-bold text-lg text-stone-900 dark:text-stone-100">৩. ডিজিটাল অর্ডারের ডেলিভারি</h2>
        <p>
          ডিজিটাল ই-বুক বা সাবস্ক্রিপশন অর্ডারে কোনো শিপিং ফি প্রযোজ্য নয়। পেমেন্ট নিশ্চিত হওয়ামাত্র আপনার অ্যাকাউন্টের “আমার লাইব্রেরী” সেকশনে তাৎক্ষণিকভাবে বইটি পাঠের উপযোগী হয়ে যাবে।
        </p>
      </div>
    </div>
  );
}

