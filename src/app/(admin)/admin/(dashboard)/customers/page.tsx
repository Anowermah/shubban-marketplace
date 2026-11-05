import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminCustomersManager, {
  CustomerItem,
  CustomerStats,
  CustomerTagItem,
  PaginationInfo,
} from '@/components/admin/AdminCustomersManager';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const CUSTOMER_ROLES = ['CUSTOMER', 'REGISTERED_MEMBER', 'PAID_MEMBER', 'GUEST', 'READER', 'SUBSCRIBER'];

export default async function AdminCustomersPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Calculate Real Dynamic Statistics from Database (6 Cards)
  const [
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    newCustomersThisMonth,
    totalOrders,
    verifiedEmailAccounts,
    availableTags,
    totalCount,
    rawCustomers,
  ] = await Promise.all([
    // Card 1: Total Registered Customers
    prisma.user.count({ where: { role: { in: CUSTOMER_ROLES } } }),
    // Card 2: Active Customers
    prisma.user.count({
      where: {
        role: { in: CUSTOMER_ROLES },
        status: 'ACTIVE',
      },
    }),
    // Card 3: Inactive Customers
    prisma.user.count({
      where: {
        role: { in: CUSTOMER_ROLES },
        status: { in: ['INACTIVE', 'SUSPENDED', 'BLOCKED', 'PENDING_VERIFICATION'] },
      },
    }),
    // Card 4: New Customers This Month
    prisma.user.count({
      where: {
        role: { in: CUSTOMER_ROLES },
        createdAt: { gte: startOfMonth },
      },
    }),
    // Card 5: Total Orders
    prisma.order.count({
      where: {
        user: { role: { in: CUSTOMER_ROLES } },
      },
    }),
    // Card 6: Verified Email Accounts
    prisma.user.count({
      where: {
        role: { in: CUSTOMER_ROLES },
        isVerified: true,
      },
    }),
    // Tags
    prisma.customerTag.findMany({
      orderBy: { name: 'asc' },
    }),
    // Total for pagination
    prisma.user.count({
      where: { role: { in: CUSTOMER_ROLES } },
    }),
    // Initial page of customers (25 records)
    prisma.user.findMany({
      where: { role: { in: CUSTOMER_ROLES } },
      orderBy: { createdAt: 'desc' },
      take: 25,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        username: true,
        avatarUrl: true,
        bio: true,
        role: true,
        status: true,
        isVerified: true,
        isPhoneVerified: true,
        membershipTier: true,
        membershipExpiry: true,
        customerType: true,
        customerTags: true,
        country: true,
        division: true,
        city: true,
        area: true,
        postalCode: true,
        fullAddress: true,
        adminNotes: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        orders: {
          select: {
            id: true,
            total: true,
            paymentStatus: true,
            orderStatus: true,
          },
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            comments: true,
            bookmarks: true,
          },
        },
      },
    }),
  ]);

  // Format Customers
  const initialCustomers: CustomerItem[] = rawCustomers.map((c) => {
    const paidOrders = c.orders.filter((o) => o.paymentStatus === 'PAID');
    const totalSpent = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = paidOrders.length > 0 ? Math.round(totalSpent / paidOrders.length) : 0;

    let parsedTags: string[] = [];
    try {
      if (c.customerTags) {
        parsedTags = JSON.parse(c.customerTags);
      }
    } catch {
      parsedTags = [c.customerTags || ''];
    }

    let score = 0;
    if (c.name) score++;
    if (c.email) score++;
    if (c.phone) score++;
    if (c.avatarUrl) score++;
    if (c.city || c.fullAddress) score++;
    if (c.isVerified) score++;
    if (c.orders.length > 0) score++;
    if (c.customerTags) score++;
    const completionPercentage = Math.round((score / 8) * 100);

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      username: c.username,
      avatarUrl: c.avatarUrl,
      bio: c.bio,
      role: c.role,
      status: c.status || 'ACTIVE',
      isVerified: c.isVerified,
      isPhoneVerified: c.isPhoneVerified,
      membershipTier: c.membershipTier || 'FREE',
      membershipExpiry: c.membershipExpiry ? c.membershipExpiry.toISOString() : null,
      customerType: c.customerType || 'INDIVIDUAL',
      customerTags: parsedTags,
      country: c.country,
      division: c.division,
      city: c.city,
      area: c.area,
      postalCode: c.postalCode,
      fullAddress: c.fullAddress,
      adminNotes: c.adminNotes,
      lastLoginAt: c.lastLoginAt ? c.lastLoginAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      totalSpent,
      avgOrderValue,
      completionPercentage,
      orders: c.orders,
      _count: c._count,
    };
  });

  const initialStats: CustomerStats = {
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    newCustomersThisMonth,
    totalOrders,
    verifiedEmailAccounts,
  };

  const initialTagsFormatted: CustomerTagItem[] = availableTags.map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    color: t.color,
    description: t.description,
  }));

  const initialPagination: PaginationInfo = {
    total: totalCount,
    page: 1,
    limit: 25,
    totalPages: Math.ceil(totalCount / 25) || 1,
    showingFrom: totalCount > 0 ? 1 : 0,
    showingTo: Math.min(25, totalCount),
  };

  return (
    <AdminCustomersManager
      initialCustomers={initialCustomers}
      initialStats={initialStats}
      initialTags={initialTagsFormatted}
      initialPagination={initialPagination}
    />
  );
}
