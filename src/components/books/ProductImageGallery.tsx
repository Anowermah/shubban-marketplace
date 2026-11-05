'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BookOpen, ZoomIn, Eye, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

interface ProductImageGalleryProps {
  title: string;
  coverImage: string;
  sampleImages?: string[];
  isFree?: boolean;
  discountPercent?: number | null;
  stockQuantity: number;
}

export default function ProductImageGallery({
  title,
  coverImage,
  sampleImages = [],
  isFree = false,
  discountPercent = null,
  stockQuantity = 10,
}: ProductImageGalleryProps) {
  // Generate sample pages if none provided for realistic look inside
  const galleryImages = [
    coverImage,
    ...(sampleImages.length > 0
      ? sampleImages
      : [
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
          'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600',
          'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600',
        ]),
  ];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [modalPageIndex, setModalPageIndex] = useState(0);

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto">
      {/* Primary Image Viewer */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 group select-none">
        <Image
          src={galleryImages[activeImageIndex]}
          alt={`${title} - ছবি ${activeImageIndex + 1}`}
          fill
          priority={activeImageIndex === 0}
          sizes="(max-width: 640px) 100vw, 384px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {isFree && (
            <span className="bg-shubban-green text-shubban-gold font-bold text-[11px] px-2.5 py-1 rounded-md shadow-md border border-shubban-gold/40">
              মুক্ত পাঠাগার (Free PDF)
            </span>
          )}
          {discountPercent && discountPercent > 0 && (
            <span className="bg-red-600 text-white font-bold text-[11px] px-2.5 py-1 rounded-md shadow-md">
              {toBengaliNumber(discountPercent)}% ছাড়
            </span>
          )}
        </div>

        {/* Stock Badge */}
        <div className="absolute top-3 right-3">
          {stockQuantity > 0 ? (
            <span className="bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              ইন স্টক ({toBengaliNumber(stockQuantity)})
            </span>
          ) : (
            <span className="bg-stone-700/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
              স্টক শেষ
            </span>
          )}
        </div>

        {/* Look Inside Floating Button */}
        <button
          onClick={() => {
            setModalPageIndex(0);
            setIsPreviewModalOpen(true);
          }}
          className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-amber-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-amber-400/30 transition-transform active:scale-95"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>এক নজরে দেখুন</span>
        </button>
      </div>

      {/* Thumbnails Strip */}
      <div className="grid grid-cols-4 gap-2.5 w-full mt-3">
        {galleryImages.slice(0, 4).map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveImageIndex(idx)}
            className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-stone-50 dark:bg-stone-800 ${
              activeImageIndex === idx
                ? 'border-shubban-green dark:border-shubban-gold shadow-md scale-102'
                : 'border-stone-200 dark:border-stone-700 opacity-70 hover:opacity-100'
            }`}
          >
            <img
              src={img}
              alt={`থাম্বনেইল ${idx + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
          </button>
        ))}
      </div>

      {/* Look Inside Modal Dialog */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-bengali">
          <div className="bg-white dark:bg-shubban-darkCard rounded-3xl max-w-2xl w-full border border-stone-200 dark:border-stone-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-900/60">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-shubban-gold" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 truncate max-w-xs sm:max-w-md">
                  {title} — নমুনা পৃষ্ঠা পাঠ
                </h3>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Active Sample Image with Navigation */}
            <div className="relative flex-1 min-h-[350px] sm:min-h-[460px] bg-stone-100 dark:bg-stone-900 flex items-center justify-center p-4 overflow-hidden">
              <img
                src={galleryImages[modalPageIndex]}
                alt={`পৃষ্ঠা ${modalPageIndex + 1}`}
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg border border-stone-200 dark:border-stone-800"
              />

              {modalPageIndex > 0 && (
                <button
                  onClick={() => setModalPageIndex((prev) => Math.max(0, prev - 1))}
                  className="absolute left-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 shadow transition-all"
                  aria-label="Previous Page"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {modalPageIndex < galleryImages.length - 1 && (
                <button
                  onClick={() => setModalPageIndex((prev) => Math.min(galleryImages.length - 1, prev + 1))}
                  className="absolute right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 shadow transition-all"
                  aria-label="Next Page"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 bg-stone-50 dark:bg-stone-900/60">
              <span>
                পৃষ্ঠা: {toBengaliNumber(modalPageIndex + 1)} / {toBengaliNumber(galleryImages.length)}
              </span>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory rounded-xl font-bold text-xs"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

