import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import BookCard from '@/components/books/BookCard';
import { Store, ShieldCheck, MapPin, Phone, Mail, Star, Package, CheckCircle2 } from 'lucide-react';
import { toBengaliNumber, formatTaka } from '@/lib/utils';

interface SellerStorefrontProps {
  params: {
    slug: string;
  };
}

export default async function SellerStorefrontPage({ params }: SellerStorefrontProps) {
  const { slug } = params;

  const vendor = await prisma.vendor.findUnique({
    where: { slug },
    include: {
      books: {
        include: {
          author: true,
          category: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!vendor || vendor.status !== 'APPROVED') {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-bengali space-y-10">
      {/* Vendor Store Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-stone-900 shadow-xl border border-stone-200 dark:border-stone-800">
        {/* Banner Image */}
        <div className="h-48 sm:h-64 w-full overflow-hidden bg-stone-800">
          <img
            src={vendor.bannerUrl || 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200'}
            alt={vendor.name}
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        {/* Store Profile Card Overlay */}
        <div className="p-6 sm:p-8 bg-white dark:bg-shubban-darkCard flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
          {/* Logo */}
          <div className="-mt-16 sm:-mt-20 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white dark:border-shubban-darkCard shadow-xl bg-white flex-shrink-0">
            <img
              src={vendor.logoUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200'}
              alt={vendor.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900 dark:text-stone-100">
                {vendor.name}
              </h1>
              {vendor.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  যাচাইকৃত বিক্রেতা (Verified Seller)
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-2xl leading-relaxed">
              {vendor.description}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2 text-xs text-stone-500">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-current" />
                <span>{toBengaliNumber(vendor.rating.toFixed(1))} ({toBengaliNumber(vendor.ratingCount)}টি রেটিং)</span>
              </div>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{vendor.address}, {vendor.city}</span>
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Package className="w-3.5 h-3.5 text-stone-400" />
                <span>মোট পণ্য: {toBengaliNumber(vendor.books.length)}টি</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Catalog of Vendor */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-4">
          <div>
            <h2 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100">
              দোকানের পণ্যসম্ভার ({toBengaliNumber(vendor.books.length)})
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              এই বিক্রেতার সরাসরি ওয়্যারহাউস থেকে দ্রুত ডেলিভারিযোগ্য
            </p>
          </div>
        </div>

        {vendor.books.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 text-xs text-stone-500">
            এই বিক্রেতার কোনো পণ্য বর্তমানে সক্রিয় নেই।
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {vendor.books.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

