import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile } from '@/lib/auth';
import WishlistClient, { WishlistItem } from '@/components/account/WishlistClient';
import { Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'আমার পছন্দের তালিকা (Wishlist) | শুব্বান লাইব্রেরী',
  description: 'আপনার সংরক্ষিত ও পছন্দের বইসমূহের তালিকা।',
};

export default async function AccountWishlistPage() {
  const user = await getCurrentUserWithProfile();
  if (!user) return null;

  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId: user.id,
      bookId: { not: null },
    },
    include: {
      book: {
        include: {
          author: true,
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const items: WishlistItem[] = bookmarks
    .filter((bm) => bm.book !== null)
    .map((bm) => ({
      bookmarkId: bm.id,
      book: {
        id: bm.book!.id,
        title: bm.book!.title,
        slug: bm.book!.slug,
        price: bm.book!.price,
        discountPrice: bm.book!.discountPrice,
        stockQuantity: bm.book!.stockQuantity,
        coverImage: bm.book!.coverImage || '/placeholder.jpg',
        author: {
          name: bm.book!.author?.name || 'অজ্ঞাত লেখক',
          slug: bm.book!.author?.slug || '',
        },
        category: {
          name: bm.book!.category?.name || 'সাধারণ',
          slug: bm.book!.category?.slug || '',
        },
      },
    }));

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          <span>আমার পছন্দের তালিকা (Wishlist)</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          আপনার সংরক্ষিত প্রিয় বইসমূহ। এখান থেকে সরাসরি ১-ক্লিকে কার্টে যুক্ত করে অর্ডার করতে পারেন।
        </p>
      </div>

      <WishlistClient initialItems={items} />
    </div>
  );
}

