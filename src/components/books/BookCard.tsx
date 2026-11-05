'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, ShoppingCart, Check, Star } from 'lucide-react';
import { formatTaka, toBengaliNumber } from '@/lib/utils';
import { useCart } from '@/components/providers/CartContext';

interface BookCardProps {
  book: {
    id: string;
    title: string;
    slug: string;
    price: number;
    discountPrice?: number | null;
    coverImage: string;
    isFree?: boolean;
    isDigitalAvailable?: boolean;
    isPhysicalAvailable?: boolean;
    author: {
      name: string;
      slug: string;
    };
    category: {
      name: string;
      slug: string;
    };
  };
}

export default function BookCard({ book }: BookCardProps) {
  const { addItem, items } = useCart();
  const isInCart = items.some((i) => i.id === book.id && i.type === 'PHYSICAL');

  const discountPercent =
    book.discountPrice && book.price > book.discountPrice
      ? Math.round(((book.price - book.discountPrice) / book.price) * 100)
      : null;

  return (
    <div className="group relative flex flex-col bg-white dark:bg-shubban-darkCard rounded-xl border border-stone-200/80 dark:border-stone-800 shadow-sm hover:shadow-md hover:border-shubban-gold/40 transition-all duration-300 overflow-hidden font-bengali">
      {/* Cover Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
        <Link href={`/books/${book.slug}`} className="block relative w-full h-full">
          <Image
            src={book.coverImage || '/icons/book-placeholder.svg'}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {discountPercent && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-600 text-white shadow-sm">
              {toBengaliNumber(discountPercent)}% ছাড়
            </span>
          )}
          {book.isFree && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-shubban-green text-shubban-gold border border-shubban-gold/40 shadow-sm">
              মুক্ত PDF
            </span>
          )}
          {!book.isFree && book.isDigitalAvailable && (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-600 text-white shadow-sm">
              ই-বুক
            </span>
          )}
        </div>

        {/* Quick Read Button Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {book.isDigitalAvailable && (
            <Link
              href={`/read/${book.slug}`}
              className="px-3 py-1.5 rounded-lg bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-semibold flex items-center gap-1.5 shadow-md"
            >
              <BookOpen className="w-3.5 h-3.5 text-shubban-gold" />
              <span>অনলাইনে পড়ুন</span>
            </Link>
          )}
        </div>
      </div>

      {/* Book Information */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category */}
        <Link
          href={`/books?category=${book.category.slug}`}
          className="text-[11px] font-medium text-shubban-gold hover:underline mb-1 tracking-wide"
        >
          {book.category.name}
        </Link>

        {/* Book Title */}
        <Link
          href={`/books/${book.slug}`}
          className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 hover:text-shubban-green dark:hover:text-shubban-gold transition-colors line-clamp-1 leading-snug"
        >
          {book.title}
        </Link>

        {/* Author Name */}
        <Link
          href={`/authors/${book.author.slug}`}
          className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 mt-1 line-clamp-1"
        >
          {book.author.name}
        </Link>

        {/* Price & Action */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
          <div className="flex flex-col">
            {book.discountPrice ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-base text-shubban-green dark:text-shubban-gold">
                  {formatTaka(book.discountPrice)}
                </span>
                <span className="text-xs text-stone-400 line-through">
                  {formatTaka(book.price)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-base text-shubban-green dark:text-shubban-gold">
                {book.isFree ? 'বিনামূল্যে' : formatTaka(book.price)}
              </span>
            )}
          </div>

          {/* Add to Cart button */}
          {book.isPhysicalAvailable && (
            <button
              onClick={() =>
                addItem({
                  id: book.id,
                  title: book.title,
                  slug: book.slug,
                  price: book.discountPrice || book.price,
                  type: 'PHYSICAL',
                  coverImage: book.coverImage,
                  authorName: book.author.name,
                })
              }
              aria-label="Add to cart"
              className={`p-2 rounded-lg transition-colors ${
                isInCart
                  ? 'bg-shubban-gold text-shubban-green-950'
                  : 'bg-stone-100 dark:bg-stone-800 hover:bg-shubban-green hover:text-shubban-ivory text-stone-700 dark:text-stone-300'
              }`}
            >
              {isInCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
