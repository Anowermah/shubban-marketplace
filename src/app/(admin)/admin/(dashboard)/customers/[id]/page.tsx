import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminCustomerDetailClient from '@/components/admin/AdminCustomerDetailClient';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export default async function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      },
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          subtotal: true,
          discount: true,
          shippingFee: true,
          paymentStatus: true,
          orderStatus: true,
          paymentMethod: true,
          shippingAddress: true,
          shippingPhone: true,
          createdAt: true,
          items: {
            select: {
              id: true,
              bookId: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
              book: {
                select: {
                  title: true,
                  coverImage: true,
                  slug: true,
                },
              },
            },
          },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
            },
          },
        },
      },
      comments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
      _count: {
        select: {
          orders: true,
          reviews: true,
          comments: true,
          bookmarks: true,
          addresses: true,
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  // Fetch admin audit logs for this customer
  const entityAuditLogs = await prisma.auditLog.findMany({
    where: {
      entity: 'USER',
      entityId: id,
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Calculate stats
  const allPaidOrders = customer.orders.filter((o) => o.paymentStatus === 'PAID');
  const totalSpent = allPaidOrders.reduce((sum, o) => sum + o.total, 0);
  const completedOrders = customer.orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const pendingOrders = customer.orders.filter((o) =>
    ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.orderStatus)
  ).length;
  const cancelledOrders = customer.orders.filter((o) =>
    ['CANCELLED', 'RETURNED'].includes(o.orderStatus)
  ).length;
  const avgOrderValue = allPaidOrders.length > 0 ? Math.round(totalSpent / allPaidOrders.length) : 0;

  // Build timeline
  const timeline: any[] = [
    {
      id: `reg-${customer.id}`,
      title: 'অ্যাকাউন্ট নিবন্ধন সম্পন্ন',
      timestamp: customer.createdAt.toISOString(),
      details: `গ্রাহক ${customer.role} হিসেবে সফলভাবে প্ল্যাটফর্মে নিবন্ধিত হয়েছেন।`,
    },
  ];

  if (customer.lastLoginAt) {
    timeline.push({
      id: `login-${customer.id}`,
      title: 'সর্বশেষ লগইন কার্যক্রম',
      timestamp: customer.lastLoginAt.toISOString(),
      details: 'সফলভাবে প্ল্যাটফর্মে লগইন করেছেন।',
    });
  }

  customer.orders.forEach((o) => {
    timeline.push({
      id: `order-${o.id}`,
      title: `নতুন অর্ডার #${o.orderNumber || o.id.slice(-6).toUpperCase()}`,
      timestamp: o.createdAt.toISOString(),
      details: `অর্ডারের মূল্য: ৳${o.total} (${o.orderStatus})`,
    });
  });

  entityAuditLogs.forEach((log) => {
    timeline.push({
      id: `audit-${log.id}`,
      title: log.action,
      timestamp: log.createdAt.toISOString(),
      details: `${log.user?.name || 'অ্যাডমিন'}: ${log.details || ''}`,
    });
  });

  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const formattedCustomer = {
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    lastLoginAt: customer.lastLoginAt ? customer.lastLoginAt.toISOString() : null,
    membershipExpiry: customer.membershipExpiry ? customer.membershipExpiry.toISOString() : null,
    stats: {
      totalOrders: customer._count.orders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalSpent,
      avgOrderValue,
      reviewsCount: customer._count.reviews,
      commentsCount: customer._count.comments,
      bookmarksCount: customer._count.bookmarks,
      addressesCount: customer._count.addresses,
    },
    timeline,
    orders: customer.orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
    reviews: customer.reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
    comments: customer.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
    addresses: customer.addresses.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  };

  return <AdminCustomerDetailClient customer={formattedCustomer} />;
}
