import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminCategoriesManager, {
  CategoryItem,
  ParentOption,
  CategoryStats,
  PaginationInfo,
} from '@/components/admin/AdminCategoriesManager';

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const [
    totalCategories,
    totalSubcategories,
    activeCategories,
    inactiveCategories,
    allParents,
    parents,
    subcategories,
  ] = await Promise.all([
    prisma.category.count({ where: { parentId: null } }),
    prisma.category.count({ where: { parentId: { not: null } } }),
    prisma.category.count({ where: { isActive: true } }),
    prisma.category.count({ where: { isActive: false } }),
    prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true, nameEn: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { parentId: null },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            magazines: true,
            questions: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      take: 25,
    }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      include: {
        _count: {
          select: {
            books: true,
            articles: true,
            magazines: true,
            questions: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    }),
  ]);

  const subcategoryMap: Record<string, typeof subcategories> = {};
  subcategories.forEach((sub) => {
    if (sub.parentId) {
      if (!subcategoryMap[sub.parentId]) subcategoryMap[sub.parentId] = [];
      subcategoryMap[sub.parentId].push(sub);
    }
  });

  const formattedCategories: CategoryItem[] = parents.map((parent) => {
    const subs = subcategoryMap[parent.id] || [];
    const subProductsCount = subs.reduce((sum, s) => sum + s._count.books, 0);
    return {
      ...parent,
      subcategories: subs,
      subcategoryCount: subs.length,
      totalProducts: parent._count.books + subProductsCount,
    };
  });

  const initialStats: CategoryStats = {
    totalCategories,
    totalSubcategories,
    activeCategories,
    inactiveCategories,
  };

  const initialPagination: PaginationInfo = {
    total: totalCategories,
    page: 1,
    limit: 25,
    totalPages: Math.ceil(totalCategories / 25) || 1,
  };

  return (
    <AdminCategoriesManager
      initialCategories={formattedCategories}
      initialAllParents={allParents}
      initialStats={initialStats}
      initialPagination={initialPagination}
    />
  );
}
