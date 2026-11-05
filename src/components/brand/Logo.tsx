import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  whiteText?: boolean;
}

export default function Logo({
  className = '',
  showTagline = false,
  size = 'md',
  whiteText = false,
}: LogoProps) {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const titleSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <Link href="/" className={`inline-flex items-center gap-3 group focus:outline-none ${className}`}>
      {/* Brand Icon: Book + Ascending Flame / Knowledge Motif */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-shubban-green shadow-md border border-shubban-gold/40 text-shubban-gold transition-transform group-hover:scale-105 overflow-hidden flex-shrink-0`}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
        >
          {/* Subtle knowledge aura */}
          <circle cx="24" cy="18" r="12" fill="#C49A45" fillOpacity="0.15" />
          
          {/* Flame / Knowledge Ray */}
          <path
            d="M24 6C24 6 20 12 20 16C20 18.2 21.8 20 24 20C26.2 20 28 18.2 28 16C28 12 24 6 24 6Z"
            fill="#C49A45"
          />
          <circle cx="24" cy="16" r="2" fill="#F8F5ED" />

          {/* Open Book Wings */}
          <path
            d="M8 36C12 33 18 33 24 35C30 33 36 33 40 36V22C36 19 30 19 24 21C18 19 12 19 8 22V36Z"
            stroke="#F8F5ED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Book Spine */}
          <path
            d="M24 21V35"
            stroke="#C49A45"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Pages lines */}
          <path
            d="M13 26C16 24.5 19.5 24.5 22 25"
            stroke="#F8F5ED"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M26 25C28.5 24.5 32 24.5 35 26"
            stroke="#F8F5ED"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M13 29C16 27.5 19.5 27.5 22 28"
            stroke="#F8F5ED"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
          <path
            d="M26 28C28.5 27.5 32 27.5 35 29"
            stroke="#F8F5ED"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />
        </svg>
      </div>

      {/* Brand Title and Tagline */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-serif font-bold tracking-tight leading-none ${titleSizes[size]} ${
              whiteText ? 'text-white' : 'text-shubban-green dark:text-shubban-ivory'
            }`}
          >
            শুব্বান
          </span>
          <span
            className={`font-bengali font-semibold tracking-tight leading-none ${titleSizes[size]} text-shubban-gold`}
          >
            লাইব্রেরী
          </span>
        </div>
        {showTagline && (
          <span
            className={`text-[11px] leading-tight font-bengali tracking-wide mt-0.5 ${
              whiteText ? 'text-shubban-ivory/80' : 'text-shubban-charcoal-muted dark:text-stone-300'
            }`}
          >
            বই, জ্ঞান ও মননশীলতার এক সমৃদ্ধ ঠিকানা
          </span>
        )}
      </div>
    </Link>
  );
}
