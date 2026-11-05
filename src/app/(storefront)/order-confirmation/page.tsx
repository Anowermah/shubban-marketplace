import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { CheckCircle2, Package, ArrowRight, BookOpen, Clock, ShieldCheck, Gift, Truck } from 'lucide-react';
import { formatTaka, formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import PrintButton from '@/components/donations/PrintButton';

interface OrderConfirmationProps {
  searchParams: {
    orderNumber?: string;
  };
}

export default async function OrderConfirmationPage({ searchParams }: OrderConfirmationProps) {
  const { orderNumber } = searchParams;

  if (!orderNumber) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center font-bengali">
        <p className="text-stone-500">কোনো অর্ডার নম্বর পাওয়া যায়নি।</p>
        <Link href="/" className="mt-4 inline-block text-shubban-gold font-bold">হোমে ফিরুন</Link>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: { book: true },
      },
      subOrders: {
        include: {
          vendor: true,
          items: true,
        },
      },
    },
  });

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center font-bengali">
        <p className="text-stone-500">অর্ডারটি খুঁজে পাওয়া যায়নি।</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-bengali space-y-8">
      {/* Success Badge Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-semibold text-shubban-gold uppercase tracking-wider">
          ধন্যবাদ! আপনার অর্ডারটি নিশ্চিত হয়েছে
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100">
          অর্ডার নম্বর: {order.orderNumber}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
          অর্ডারের নিশ্চিতকরণ বিবরণী সংরক্ষণ করা হয়েছে। ডেলিভারির অগ্রগতি আপনি যেকোনো সময় ট্র্যাক করতে পারেন।
        </p>
      </div>

      {/* Invoice Card */}
      <div className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800 gap-3">
          <div>
            <span className="text-xs text-stone-400">অর্ডারের তারিখ</span>
            <p className="font-bold text-xs sm:text-sm text-stone-800 dark:text-stone-200">
              {formatBengaliDate(order.createdAt)}
            </p>
          </div>
          <div>
            <span className="text-xs text-stone-400">পেমেন্ট স্ট্যাটাস</span>
            <span className="block font-bold text-xs sm:text-sm text-emerald-600">
              {order.paymentStatus === 'PAID' ? 'পরিশোধিত (PAID)' : 'ক্যাশ অন ডেলিভারি (পরিশোধ বাকি)'}
            </span>
          </div>
          <div>
            <span className="text-xs text-stone-400">পেমেন্ট মেথড</span>
            <span className="block font-bold text-xs sm:text-sm uppercase font-mono text-stone-800 dark:text-stone-200">
              {order.paymentMethod}
            </span>
          </div>
        </div>

        {/* Shipping address details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 text-xs">
          <div>
            <span className="text-stone-400 block">প্রাপকের নাম ও ফোন:</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{order.shippingName}</span>
            <span className="block text-stone-500">{order.shippingPhone}</span>
          </div>
          <div>
            <span className="text-stone-400 block">ডেলিভারি ঠিকানা:</span>
            <span className="text-stone-800 dark:text-stone-200 font-medium">{order.shippingAddress}</span>
            <span className="block text-stone-500">{order.shippingCity}</span>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
            অর্ডারকৃত আইটেমসমূহ
          </h3>
          <div className="divide-y divide-stone-100 dark:divide-stone-800 border-y border-stone-100 dark:border-stone-800">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-800 dark:text-stone-200 block">
                    {item.book.title}
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {item.type === 'PHYSICAL'
                      ? `মুদ্রিত সংস্করণ (${toBengaliNumber(item.quantity)} কপি × ${formatTaka(item.unitPrice)})`
                      : 'ডিজিটাল ই-বুক সংস্করণ'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {formatTaka(item.totalPrice)}
                  </span>
                  {item.type === 'DIGITAL' && (
                    <Link
                      href={`/read/${item.book.slug}`}
                      className="block text-[11px] font-bold text-shubban-gold hover:underline mt-0.5"
                    >
                      এখনই পড়ুন &rarr;
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gift Wrapping Banner if requested */}
        {order.isGiftWrapped && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <Gift className="w-4 h-4 text-shubban-gold" />
              <span>উপহার র‍্যাপিং ও শুভেচ্ছা বার্তা অন্তর্ভুক্ত রয়েছে:</span>
            </div>
            {order.giftMessage ? (
              <p className="italic pl-6">“{order.giftMessage}”</p>
            ) : (
              <p className="italic pl-6">বিশেষ শুভেচ্ছা বার্তা ব্যতীত উপহার হিসেবে মোড়ানো হবে।</p>
            )}
          </div>
        )}

        {/* Multi-Vendor Packages Breakdown (Daraz / Rokomari Style) */}
        {order.subOrders && order.subOrders.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-shubban-gold" />
              <span>মাল্টি-ভেন্ডর ডেলিভারি প্যাকেজসমূহ ({toBengaliNumber(order.subOrders.length)}টি প্যাকেজ)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.subOrders.map((so, idx) => (
                <div
                  key={so.id}
                  className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-stone-900 dark:text-stone-100 font-bold">
                      প্যাকেজ {toBengaliNumber(idx + 1)}: {so.vendor.name}
                    </strong>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {so.status === 'PROCESSING' && 'প্রসেসিং'}
                      {so.status === 'PACKED' && 'প্যাকড'}
                      {so.status === 'SHIPPED' && 'শিপড'}
                      {so.status === 'DELIVERED' && 'ডেলিভার্ড'}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block">
                    সাব-অর্ডার: #{so.subOrderNumber} • আইটেম: {toBengaliNumber(so.items.length)}টি
                  </span>
                  <span className="text-[10px] text-stone-400 block font-mono">
                    কুরিয়ার: {so.courierName || 'Pathao Courier'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bill Summary */}
        <div className="space-y-2 text-xs max-w-xs ml-auto">
          <div className="flex justify-between text-stone-600 dark:text-stone-400">
            <span>উপমোট:</span>
            <span>{formatTaka(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-stone-600 dark:text-stone-400">
            <span>ডেলিভারি ফি:</span>
            <span>{formatTaka(order.shippingFee)}</span>
          </div>
          {order.isGiftWrapped && (
            <div className="flex justify-between text-shubban-gold font-medium">
              <span>গিফট র‍্যাপিং ফি:</span>
              <span>+ {formatTaka(order.giftWrapFee)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>ছাড়:</span>
              <span>- {formatTaka(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-shubban-green dark:text-shubban-gold pt-2 border-t border-stone-200 dark:border-stone-800">
            <span>সর্বমোট পরিশোধিত:</span>
            <span>{formatTaka(order.total)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 no-print">
          <PrintButton />

          <div className="flex items-center gap-3">
            <Link
              href="/orders/track"
              className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-semibold flex items-center gap-1.5"
            >
              <Package className="w-4 h-4 text-shubban-gold" />
              <span>অর্ডার ট্র্যাক করুন</span>
            </Link>
            <Link
              href="/"
              className="px-5 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory font-bold text-xs"
            >
              মূল পাতায় ফিরুন
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
