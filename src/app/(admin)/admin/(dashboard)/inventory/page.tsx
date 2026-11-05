import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminInventoryClient, {
  LowStockBook,
  InventoryLogItem,
} from '@/components/admin/AdminInventoryClient';
import { Boxes } from 'lucide-react';
import { toBengaliNumber } from '@/lib/utils';

export const revalidate = 0;

export default async function AdminInventoryPage() {
  const [logs, lowStockProducts, totalStockSum] = await Promise.all([
    prisma.inventoryLog.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.book.findMany({
      where: { stockQuantity: { lte: 5 } },
      include: { author: true, category: true },
      orderBy: { stockQuantity: 'asc' },
    }),
    prisma.book.aggregate({
      _sum: { stockQuantity: true },
    }),
  ]);

  const bookIds = Array.from(new Set(logs.map((l) => l.bookId)));
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    select: { id: true, title: true, slug: true },
  });
  const bookMap = new Map(books.map((b) => [b.id, b.title]));

  const formattedLogs: InventoryLogItem[] = logs.map((l) => ({
    id: l.id,
    bookId: l.bookId,
    bookTitle: bookMap.get(l.bookId) || 'বই / পণ্য',
    variantId: l.variantId,
    changeType: l.changeType,
    quantityChange: l.quantityChange,
    balanceAfter: l.balanceAfter,
    referenceId: l.referenceId,
    reason: l.reason,
    createdAt: l.createdAt,
  }));

  const formattedLowStock: LowStockBook[] = lowStockProducts.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    stockQuantity: p.stockQuantity,
    author: { name: p.author?.name || 'অজ্ঞাত' },
    category: { name: p.category?.name || 'সাধারণ' },
  }));

  return (
    <div className="space-y-6 font-bengali">
      <div className="pb-4 border-b border-stone-200 dark:border-stone-800">
        <h1 className="font-serif font-bold text-2xl text-stone-900 dark:text-stone-100 flex items-center gap-2">
          <Boxes className="w-6 h-6 text-shubban-gold" />
          <span>ইনভেন্টরি ও স্টক অডিট ট্রেইল (Inventory Management)</span>
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          ক্যাটালগে মুদ্রিত বই ও পণ্যের স্টক ট্র্যাকিং, স্বল্প স্টক অ্যালার্ট এবং রিয়েলটাইম অডিট ট্রেইল।
        </p>
      </div>

      <AdminInventoryClient
        initialLowStock={formattedLowStock}
        initialLogs={formattedLogs}
        totalStock={totalStockSum._sum.stockQuantity || 0}
      />
    </div>
  );
}
