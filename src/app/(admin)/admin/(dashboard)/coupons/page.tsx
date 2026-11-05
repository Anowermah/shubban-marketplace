import React from 'react';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminCouponsManager from '@/components/admin/AdminCouponsManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCouponsPage() {
  const user = await getCurrentUserWithProfile();
  if (!user || !isAdmin(user.role)) {
    redirect('/admin/login?redirect=/admin/coupons');
  }

  const [totalCoupons, coupons] = await Promise.all([
    prisma.coupon.count(),
    prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const serializedCoupons = coupons.map((c) => ({
    id: c.id,
    code: c.code,
    discountPct: c.discountPct,
    discountAmt: c.discountAmt,
    minAmount: c.minAmount,
    maxUsage: c.maxUsage,
    usedCount: c.usedCount,
    expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <AdminCouponsManager
      initialCoupons={serializedCoupons}
      initialTotal={totalCoupons}
    />
  );
}
