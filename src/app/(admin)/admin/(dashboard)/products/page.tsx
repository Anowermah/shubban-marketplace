import React from 'react';
import { prisma } from '@/lib/prisma';
import AdminProductsManager from '@/components/admin/AdminProductsManager';

export const revalidate = 0; // Dynamic admin operations

export default async function AdminProductsPage() {
  const [products, categories, authors, publishers, vendors] = await Promise.all([
    prisma.book.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: true,
        category: true,
        publisher: true,
        vendor: true,
        variants: true,
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.author.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.publisher.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.vendor.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <AdminProductsManager
      initialProducts={products.map((p) => ({
        id: p.id,
        title: p.title,
        titleEn: p.titleEn,
        slug: p.slug,
        price: p.price,
        discountPrice: p.discountPrice,
        stockQuantity: p.stockQuantity,
        coverImage: p.coverImage,
        categoryId: p.categoryId,
        categoryName: p.category.name,
        authorId: p.authorId,
        authorName: p.author.name,
        publisherId: p.publisherId,
        publisherName: p.publisher?.name,
        vendorId: p.vendorId,
        vendorName: p.vendor?.name,
        isPhysicalAvailable: p.isPhysicalAvailable,
        isDigitalAvailable: p.isDigitalAvailable,
        isFree: p.isFree,
        isFeatured: p.isFeatured,
        isBestSeller: p.isBestSeller,
        isbn: p.isbn,
        edition: p.edition,
        pages: p.pages,
        bindingType: p.bindingType,
        variants: p.variants.map((v) => ({
          id: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          stockQuantity: v.stockQuantity,
        })),
      }))}
      categories={categories}
      authors={authors}
      publishers={publishers}
      vendors={vendors}
    />
  );
}

