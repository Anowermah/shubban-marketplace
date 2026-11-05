import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminOrderDetailClient from '@/components/admin/AdminOrderDetailClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { id: params.id },
        { orderNumber: params.id },
      ],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          book: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              price: true,
              author: { select: { name: true } },
            },
          },
        },
      },
      subOrders: {
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              legalName: true,
            },
          },
        },
      },
      shipments: {
        include: {
          events: { orderBy: { timestamp: 'desc' } },
          provider: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const providers = await prisma.courierProvider.findMany({
    orderBy: { isDefault: 'desc' },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      isEnabled: true,
      isDefault: true,
      defaultChargeInsideDhaka: true,
      defaultChargeOutsideDhaka: true,
    },
  });

  // Convert dates and any complex types to plain JSON format
  const formattedOrder = JSON.parse(JSON.stringify(order));
  const formattedProviders = JSON.parse(JSON.stringify(providers));

  return (
    <div className="space-y-6">
      <AdminOrderDetailClient
        initialOrder={formattedOrder}
        providers={formattedProviders}
      />
    </div>
  );
}
