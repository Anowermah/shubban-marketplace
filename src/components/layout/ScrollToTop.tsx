'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 320) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="পৃষ্ঠার শীর্ষে যান (Scroll to top)"
      title="পৃষ্ঠার শীর্ষে যান"
      className="fixed bottom-28 sm:bottom-20 right-3 sm:right-6 z-35 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 shadow-lg hover:shadow-xl hover:border-amber-500/60 hover:text-amber-600 dark:hover:text-amber-400 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center group font-bengali animate-in fade-in zoom-in-75"
    >
      <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-y-0.5 duration-200" />
      <span className="sr-only">পৃষ্ঠার শীর্ষে যান</span>
    </button>
  );
}
