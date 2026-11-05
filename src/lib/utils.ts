import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Convert English digits to Bengali digits
export function toBengaliNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/[0-9]/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

// Format Bangladeshi Taka (e.g. ৳ ৩৫০)
export function formatTaka(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '৳ ০';
  return `৳ ${toBengaliNumber(Math.round(amount))}`;
}

// Format Date in natural Bengali
export function formatBengaliDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const day = toBengaliNumber(date.getDate());
  const month = months[date.getMonth()];
  const year = toBengaliNumber(date.getFullYear());
  return `${day} ${month}, ${year}`;
}
