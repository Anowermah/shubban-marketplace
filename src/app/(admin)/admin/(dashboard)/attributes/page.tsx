import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminAttributesManager from '@/components/admin/AdminAttributesManager';

export const revalidate = 0;

export default async function AdminAttributesPage() {
  // Fetch real database records and stats for SSR
  const [
    totalAttributes,
    totalAttributeValues,
    totalProductVariants,
    activeAttributes,
    productsUsingAttributes,
    attributes,
    groups,
  ] = await Promise.all([
    prisma.productAttribute.count(),
    prisma.productAttributeValue.count(),
    prisma.productVariant.count(),
    prisma.productAttribute.count({ where: { status: 'ACTIVE' } }),
    prisma.book.count({ where: { attributeAssignments: { some: {} } } }),
    prisma.productAttribute.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      take: 25,
      include: {
        group: {
          select: { id: true, name: true, slug: true },
        },
        values: {
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            assignments: true,
            values: true,
          },
        },
      },
    }),
    prisma.productAttributeGroup.findMany({
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: {
          select: { attributes: true },
        },
      },
    }),
  ]);

  const stats = {
    totalAttributes,
    totalAttributeValues,
    totalProductVariants,
    activeAttributes,
    productsUsingAttributes,
  };

  return (
    <AdminAttributesManager
      initialAttributes={JSON.parse(JSON.stringify(attributes))}
      initialStats={stats}
      initialGroups={JSON.parse(JSON.stringify(groups))}
    />
  );
}
