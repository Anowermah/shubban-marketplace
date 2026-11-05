'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Check, Plus, Minus, BookOpen, ShieldCheck, Zap, AlertCircle, Package } from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';
import { formatTaka, toBengaliNumber } from '@/lib/utils';

export interface ProductVariantData {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  stockQuantity: number;
  attributes?: string | null;
}

interface BookDetailClientProps {
  book: {
    id: string;
    title: string;
    slug: string;
    price: number;
    discountPrice?: number | null;
    stockQuantity: number;
    coverImage: string;
    authorName: string;
    isPhysicalAvailable: boolean;
    isDigitalAvailable: boolean;
    isFree: boolean;
    sku?: string | null;
    variants?: ProductVariantData[];
  };
}

export default function BookDetailClient({ book }: BookDetailClientProps) {
  const router = useRouter();
  const { addItem, items } = useCart();
  const [format, setFormat] = useState<'PHYSICAL' | 'DIGITAL'>('PHYSICAL');
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  // Variant management
  const hasVariants = book.variants && book.variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantData | null>(
    hasVariants ? book.variants![0] : null
  );

  useEffect(() => {
    fetch('/api/bookmarks')
      .then((r) => r.json())
      .then((data) => {
        if (data.bookmarks && Array.isArray(data.bookmarks)) {
          const match = data.bookmarks.some((b: any) => b.bookId === book.id);
          if (match) setIsWishlisted(true);
        } else {
          try {
            const localList = JSON.parse(localStorage.getItem('shubban_wishlist') || '[]');
            if (localList.includes(book.id)) setIsWishlisted(true);
          } catch (e) {}
        }
      })
      .catch(() => {
        try {
          const localList = JSON.parse(localStorage.getItem('shubban_wishlist') || '[]');
          if (localList.includes(book.id)) setIsWishlisted(true);
        } catch (e) {}
      });
  }, [book.id]);

  const handleToggleWishlist = async () => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsWishlisted(data.isBookmarked);
        setAddedMessage(data.message || (data.isBookmarked ? 'পছন্দ তালিকায় যুক্ত হয়েছে!' : 'পছন্দ তালিকা থেকে সরানো হয়েছে।'));
        setTimeout(() => setAddedMessage(null), 3000);
      } else {
        // Fallback to local storage
        try {
          const localList = JSON.parse(localStorage.getItem('shubban_wishlist') || '[]');
          const exists = localList.includes(book.id);
          let updated;
          if (exists) {
            updated = localList.filter((id: string) => id !== book.id);
            setIsWishlisted(false);
            setAddedMessage('পছন্দ তালিকা থেকে সরানো হয়েছে।');
          } else {
            updated = [...localList, book.id];
            setIsWishlisted(true);
            setAddedMessage('পছন্দ তালিকায় যুক্ত হয়েছে!');
          }
          localStorage.setItem('shubban_wishlist', JSON.stringify(updated));
          setTimeout(() => setAddedMessage(null), 3000);
        } catch (e) {
          setIsWishlisted(!isWishlisted);
        }
      }
    } catch (e) {
      setIsWishlisted(!isWishlisted);
    }
  };

  // Pricing calculations
  const basePhysicalPrice = selectedVariant ? selectedVariant.price : (book.discountPrice || book.price);
  const originalPhysicalPrice = selectedVariant ? selectedVariant.price : book.price;
  const isDiscounted = !selectedVariant && !!book.discountPrice && book.discountPrice < book.price;
  const savings = isDiscounted ? book.price - book.discountPrice! : 0;
  const discountPercent = isDiscounted ? Math.round(((book.price - book.discountPrice!) / book.price) * 100) : 0;

  const activePrice =
    format === 'DIGITAL'
      ? book.isFree
        ? 0
        : Math.round(basePhysicalPrice * 0.4) // 60% off for digital edition
      : basePhysicalPrice;

  const currentStock = selectedVariant ? selectedVariant.stockQuantity : book.stockQuantity;
  const isOutOfStock = currentStock <= 0;
  const activeSku = selectedVariant?.sku || book.sku || `SHB-${book.slug.substring(0, 6).toUpperCase()}`;

  const handleAddToCart = () => {
    if (isOutOfStock && format === 'PHYSICAL') return;

    addItem({
      id: book.id,
      title: selectedVariant ? `${book.title} (${selectedVariant.name})` : book.title,
      slug: book.slug,
      price: activePrice,
      type: format,
      coverImage: book.coverImage,
      authorName: book.authorName,
      quantity,
    });
    setAddedMessage('পণ্যটি কার্টে সফলভাবে যোগ করা হয়েছে!');
    setTimeout(() => setAddedMessage(null), 3000);
  };

  const handleBuyNow = () => {
    if (isOutOfStock && format === 'PHYSICAL') return;
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <div className="py-4 space-y-6">
      {/* Price & SKU Bar */}
      <div className="flex flex-wrap items-baseline gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-serif font-bold text-3xl sm:text-4xl text-shubban-green dark:text-shubban-gold">
            {formatTaka(activePrice)}
          </span>
          {isDiscounted && format === 'PHYSICAL' && (
            <span className="text-base sm:text-lg text-stone-400 line-through">
              {formatTaka(originalPhysicalPrice)}
            </span>
          )}
        </div>

        {isDiscounted && format === 'PHYSICAL' && (
          <div className="flex items-center gap-1.5">
            <span className="bg-rose-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full shadow">
              {toBengaliNumber(discountPercent)}% ছাড়
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
              (সাশ্রয়: {formatTaka(savings)})
            </span>
          </div>
        )}
      </div>

      {/* SKU & Stock Row */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-stone-400">এসকেইউ (SKU):</span>
          <span className="font-mono font-bold text-stone-700 dark:text-stone-300">{activeSku}</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-stone-400">স্টক অবস্থা:</span>
          {isOutOfStock && format === 'PHYSICAL' ? (
            <span className="text-rose-600 font-bold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> স্টক শেষ
            </span>
          ) : (
            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              ইন স্টক ({toBengaliNumber(currentStock)} কপি উপলব্ধ)
            </span>
          )}
        </div>
      </div>

      {/* Product Variants (If any e.g. 6ml, 12ml, Hardcover) */}
      {hasVariants && (
        <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block">
            সাইজ / ভ্যারিয়েন্ট নির্বাচন করুন:
          </label>
          <div className="flex flex-wrap gap-2">
            {book.variants!.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'border-shubban-green bg-shubban-green/10 text-shubban-green dark:border-shubban-gold dark:text-shubban-gold ring-2 ring-shubban-green/30'
                      : 'border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-300'
                  }`}
                >
                  <span>{v.name}</span>
                  <span className="font-bold text-shubban-green dark:text-shubban-gold">
                    {formatTaka(v.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Format Switcher (Physical vs Digital) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wide block">
          পড়ার মাধ্যম / সংস্করণ:
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          {book.isPhysicalAvailable && (
            <button
              onClick={() => setFormat('PHYSICAL')}
              className={`p-3 rounded-xl border text-left transition-all ${
                format === 'PHYSICAL'
                  ? 'border-shubban-green bg-shubban-green/5 dark:bg-shubban-green-950/20 ring-2 ring-shubban-green/30'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
              }`}
            >
              <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                মুদ্রিত কপি (হোম ডেলিভারি)
              </span>
              <span className="text-xs text-shubban-green dark:text-shubban-gold font-bold mt-1 block">
                {formatTaka(basePhysicalPrice)}
              </span>
              <span className="text-[10px] text-stone-500">দেশব্যাপী কুরিয়ার সুবিধা</span>
            </button>
          )}

          {book.isDigitalAvailable && (
            <button
              onClick={() => setFormat('DIGITAL')}
              className={`p-3 rounded-xl border text-left transition-all ${
                format === 'DIGITAL'
                  ? 'border-shubban-green bg-shubban-green/5 dark:bg-shubban-green-950/20 ring-2 ring-shubban-green/30'
                  : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
              }`}
            >
              <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                ডিজিটাল সংস্করণ (e-Book)
              </span>
              <span className="text-xs text-shubban-green dark:text-shubban-gold font-bold mt-1 block">
                {book.isFree ? 'বিনামূল্যে পাঠ' : formatTaka(Math.round(basePhysicalPrice * 0.4))}
              </span>
              <span className="text-[10px] text-stone-500">তাৎক্ষণিক ইন-ব্রাউজার পাঠ</span>
            </button>
          )}
        </div>
      </div>

      {/* Quantity & Purchasing CTA Buttons */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-wrap items-center gap-4">
          {/* Quantity Selector */}
          {format === 'PHYSICAL' && (
            <div className="flex items-center border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800/80 p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-600 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-30 transition-all"
                aria-label="Decrease quantity"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center text-xs font-bold font-mono text-stone-900 dark:text-stone-100">
                {toBengaliNumber(quantity)}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                disabled={quantity >= currentStock || isOutOfStock}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-600 hover:bg-white dark:hover:bg-stone-700 disabled:opacity-30 transition-all"
                aria-label="Increase quantity"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock && format === 'PHYSICAL'}
            className="flex-1 min-w-[160px] py-3 px-6 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            <ShoppingCart className="w-4 h-4 text-shubban-gold" />
            <span>কার্টে যোগ করুন</span>
          </button>

          {/* Buy Now Button */}
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock && format === 'PHYSICAL'}
            className="py-3 px-6 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>এখনই কিনুন</span>
          </button>

          {/* Wishlist Heart Button */}
          <button
            onClick={handleToggleWishlist}
            className={`p-3 rounded-xl border transition-all ${
              isWishlisted
                ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'
            }`}
            title={isWishlisted ? 'পছন্দ তালিকা থেকে সরান' : 'পছন্দ তালিকায় যুক্ত করুন'}
          >
            <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current text-rose-600' : ''}`} />
          </button>
        </div>

        {/* Feedback Message */}
        {addedMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{addedMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
