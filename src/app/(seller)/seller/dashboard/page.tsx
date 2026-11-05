import React from 'react';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAuthenticatedVendor } from '@/lib/auth';
import SellerDashboardClient from '@/components/seller/SellerDashboardClient';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Store, Clock, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

export const metadata = {
  title: 'সেলার সেন্টার ও ড্যাশবোর্ড — শুব্বান মার্কেটপ্লেস',
  description: 'মাল্টি-ভেন্ডর সেলার ড্যাশবোর্ড ও শপ ম্যানেজমেন্ট',
};

export default async function SellerDashboardPage() {
  const session = await getSessionUser();

  if (!session) {
    redirect('/login?redirect=/seller/dashboard');
  }

  // Strictly resolve authenticated vendor for the logged-in user
  const vendorAuth = await getAuthenticatedVendor(session);

  // If user is not yet an approved vendor member
  if (!vendorAuth) {
    // Check if user has an existing vendor application
    const existingApp = await prisma.vendorApplication.findFirst({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' },
    });

    if (existingApp && existingApp.status === 'PENDING') {
      return (
        <div className="max-w-2xl mx-auto px-4 py-20 font-bengali">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold rounded-full">
                পর্যালোচনাধীন রয়েছে
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                আপনার বিক্রেতা আবেদনটি বিবেচনাধীন
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
                “<strong>{existingApp.shopName}</strong>” শপের জন্য আপনার আবেদনটি আমাদের টিম যাচাই করছে। সাধারণ কার্যদিবসের মধ্যে অনুমোদিত হলে আপনি ইমেইল বা এসএমএসে কনফার্মেশন পাবেন।
              </p>
            </div>

            <div className="p-4 bg-stone-50 dark:bg-stone-800/60 rounded-2xl text-xs text-stone-600 dark:text-stone-400 space-y-1.5 text-left max-w-md mx-auto">
              <div className="flex justify-between">
                <span>দোকানের নাম:</span>
                <strong className="text-stone-900 dark:text-stone-100">{existingApp.shopName}</strong>
              </div>
              <div className="flex justify-between">
                <span>মালিক:</span>
                <strong className="text-stone-900 dark:text-stone-100">{existingApp.ownerName}</strong>
              </div>
              <div className="flex justify-between">
                <span>ফোন নম্বর:</span>
                <strong className="text-stone-900 dark:text-stone-100 font-mono">{existingApp.phone}</strong>
              </div>
              <div className="flex justify-between">
                <span>আবেদনের তারিখ:</span>
                <strong className="text-stone-900 dark:text-stone-100">
                  {new Date(existingApp.createdAt).toLocaleDateString('bn-BD')}
                </strong>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="px-6 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-xs font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors inline-block"
              >
                মূল ওয়েবসাইটে ফিরুন
              </Link>
            </div>
          </div>
        </div>
      );
    }

    if (existingApp && existingApp.status === 'REJECTED') {
      return (
        <div className="max-w-2xl mx-auto px-4 py-20 font-bengali">
          <div className="bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900/40 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold rounded-full">
                আবেদন প্রত্যাখ্যান
              </span>
              <h2 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                আবেদনটি অনুমোদন করা সম্ভব হয়নি
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
                {existingApp.adminNotes ||
                  'প্রদত্ত তথ্য অথবা ট্রেড লাইসেন্স তথ্যে গরমিল থাকার কারণে আবেদনটি বাতিল করা হয়েছে।'}
              </p>
            </div>

            <Link
              href="/seller/apply"
              className="px-6 py-3 rounded-xl bg-shubban-green text-shubban-ivory font-bold text-xs inline-flex items-center gap-2 shadow hover:bg-shubban-green-700"
            >
              <span>সঠিক তথ্য দিয়ে পুনরায় আবেদন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      );
    }

    // No application exists at all
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 font-bengali">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 sm:p-12 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-shubban-green/10 text-shubban-green dark:text-shubban-gold flex items-center justify-center mx-auto">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">
              শুব্বান সেলার সেন্টারে স্বাগতম
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-lg mx-auto">
              আপনার প্রকাশনা প্রতিষ্ঠান অথবা বুকস্টোরকে শুব্বান মাল্টি-ভেন্ডর প্ল্যাটফর্মে যুক্ত করুন। সারা দেশের লক্ষাধিক পাঠকের কাছে পৌঁছে দিন আপনার বইসমূহ।
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/seller/apply"
              className="px-7 py-3.5 rounded-2xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-sm inline-flex items-center gap-2 shadow-lg transition-all"
            >
              <span>বিক্রেতা হিসেবে নিবন্ধন করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Vendor is authenticated! Fetch strictly authorized data
  const vendorId = vendorAuth.vendor.id;

  const [
    vendorDetails,
    subOrders,
    products,
    payouts,
    ledgerEntries,
    reviews,
    categories,
    authors,
  ] = await Promise.all([
    prisma.vendor.findUnique({
      where: { id: vendorId },
    }),
    prisma.subOrder.findMany({
      where: { vendorId },
      include: {
        items: true,
        order: {
          select: {
            orderNumber: true,
            shippingName: true,
            shippingPhone: true,
            shippingAddress: true,
            shippingCity: true,
            paymentStatus: true,
            paymentMethod: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.book.findMany({
      where: { vendorId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, slug: true } },
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sellerPayout.findMany({
      where: { vendorId },
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.sellerLedgerEntry.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.review.findMany({
      where: {
        book: { vendorId },
      },
      include: {
        book: { select: { id: true, title: true, slug: true, coverImage: true } },
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.author.findMany({
      select: { id: true, name: true },
      take: 100,
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <SellerDashboardClient
        vendor={vendorDetails || vendorAuth.vendor}
        isSuspended={vendorAuth.isSuspended}
        initialSubOrders={subOrders.map((o) => ({
          id: o.id,
          subOrderNumber: o.subOrderNumber,
          subtotal: o.subtotal,
          commissionAmt: o.commissionAmt,
          payoutAmt: o.payoutAmt,
          status: o.status,
          courierName: o.courierName,
          trackingNumber: o.trackingNumber,
          createdAt: o.createdAt.toISOString(),
          customerName: o.order.shippingName,
          customerPhone: o.order.shippingPhone,
          customerAddress: `${o.order.shippingAddress}, ${o.order.shippingCity}`,
          paymentStatus: o.order.paymentStatus,
          paymentMethod: o.order.paymentMethod,
          items: o.items.map((it) => ({
            id: it.id,
            title: it.title,
            price: it.price,
            quantity: it.quantity,
            total: it.total,
          })),
        }))}
        initialProducts={products.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: p.price,
          discountPrice: p.discountPrice,
          stockQuantity: p.stockQuantity,
          coverImage: p.coverImage,
          categoryName: p.category.name,
          categoryId: p.categoryId,
          authorName: p.author.name,
          authorId: p.authorId,
          description: p.description,
          isbn: p.isbn,
          edition: p.edition,
          pageCount: p.pages,
          isPublished: p.isPhysicalAvailable,
          variants: p.variants.map((v) => ({
            id: v.id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            stockQuantity: v.stockQuantity,
          })),
        }))}
        initialPayouts={payouts.map((po) => ({
          id: po.id,
          payoutNumber: po.payoutNumber,
          amount: po.amount,
          method: po.method,
          accountDetails: po.accountDetails,
          status: po.status,
          transactionRef: po.transactionRef,
          requestedAt: po.requestedAt.toISOString(),
          notes: po.notes,
        }))}
        initialLedger={ledgerEntries.map((l) => ({
          id: l.id,
          type: l.type,
          amount: l.amount,
          balanceAfter: l.balanceAfter,
          description: l.description,
          createdAt: l.createdAt.toISOString(),
        }))}
        initialReviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          customerName: r.user.name || 'গ্রাহক',
          bookTitle: r.book.title,
          bookSlug: r.book.slug,
          bookImage: r.book.coverImage,
        }))}
        categories={categories}
        authors={authors}
      />
    </div>
  );
}
