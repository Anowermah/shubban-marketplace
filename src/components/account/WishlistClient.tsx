'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  ShoppingCart,
  Trash2,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';
import { formatTaka, toBengaliNumber } from '@/lib/utils';

export interface WishlistItem {
  bookmarkId: string;
  book: {
    id: string;
    title: string;
    slug: string;
    price: number;
    discountPrice?: number | null;
    stockQuantity: number;
    coverImage: string;
    author: { name: string; slug: string };
    category: { name: string; slug: string };
  };
}

export default function WishlistClient({ initialItems }: { initialItems: WishlistItem[] }) {
  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const { addItem } = useCart();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRemove = async (bookId: string) => {
    try {
      const res = await fetch('/api/account/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId }),
      });
      if (res.ok) {
        setItems(items.filter((i) => i.book.id !== bookId));
        setFeedback('পণ্যটি উইশলিস্ট থেকে সরানো হয়েছে!');
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToCart = (book: WishlistItem['book']) => {
    const finalPrice = book.discountPrice !== null && book.discountPrice !== undefined ? book.discountPrice : book.price;
    addItem({
      id: book.id,
      title: book.title,
      slug: book.slug,
      price: finalPrice,
      type: 'PHYSICAL',
      coverImage: book.coverImage || '/placeholder.jpg',
      authorName: book.author.name,
      quantity: 1,
      maxStock: book.stockQuantity,
    });
    setFeedback(`"${book.title}" সফলভাবে শপিং কার্টে যুক্ত হয়েছে!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-12 text-center text-xs text-stone-400 space-y-3">
        <Heart className="w-10 h-10 text-stone-300 mx-auto" />
        <h3 className="font-serif font-bold text-base text-stone-700 dark:text-stone-300">
          আপনার পছন্দের তালিকা খালি রয়েছে
        </h3>
        <p className="max-w-sm mx-auto text-stone-500">
          বইয়ের ক্যাটালগ ব্রাউজ করে আপনার পছন্দের বই উইশলিস্টে যুক্ত করুন এবং পরবর্তীতে সহজে ক্রয় করুন।
        </p>
        <div className="pt-2">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-xs shadow-sm transition-colors"
          >
            <BookOpen className="w-4 h-4 text-shubban-gold" />
            <span>বইয়ের ক্যাটালগ দেখুন</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="p-3 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(({ bookmarkId, book }) => {
          const finalPrice = book.discountPrice !== null && book.discountPrice !== undefined ? book.discountPrice : book.price;
          const isOutOfStock = book.stockQuantity <= 0;

          return (
            <div
              key={bookmarkId}
              className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm flex flex-col justify-between hover:border-shubban-gold/50 transition-all group"
            >
              <div>
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 mb-3 border border-stone-100 dark:border-stone-800">
                  <img
                    src={book.coverImage || '/placeholder.jpg'}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <button
                    onClick={() => handleRemove(book.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-stone-900/90 text-stone-400 hover:text-rose-600 shadow-sm transition-colors"
                    title="তালিকা থেকে মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-stone-400">{book.category.name}</span>
                  <h4 className="font-serif font-bold text-xs text-stone-900 dark:text-stone-100 line-clamp-1 hover:text-shubban-gold">
                    <Link href={`/books/${book.slug}`}>{book.title}</Link>
                  </h4>
                  <p className="text-[11px] text-stone-500">{book.author.name}</p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-shubban-green dark:text-shubban-gold">
                    {formatTaka(finalPrice)}
                  </span>
                  {book.discountPrice && (
                    <span className="font-mono text-[10px] text-stone-400 line-through ml-1.5">
                      {formatTaka(book.price)}
                    </span>
                  )}
                </div>

                <button
                  disabled={isOutOfStock}
                  onClick={() => handleAddToCart(book)}
                  className="px-3 py-1.5 rounded-xl bg-shubban-green hover:bg-shubban-darkGreen text-shubban-ivory font-bold text-[11px] flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition-colors"
                >
                  <ShoppingCart className="w-3 h-3 text-shubban-gold" />
                  <span>{isOutOfStock ? 'স্টক শেষ' : 'কার্টে নিন'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

