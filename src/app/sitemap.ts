import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shubbanlibrary.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/books`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/publications`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/donations`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/authors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/publishers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/seller/apply`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const [books, authors, categories, articles, campaigns, vendors] = await Promise.all([
      prisma.book.findMany({
        select: { slug: true, updatedAt: true },
        take: 500,
      }),
      prisma.author.findMany({
        select: { slug: true, updatedAt: true },
        take: 200,
      }),
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
        take: 100,
      }),
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
        take: 300,
      }),
      prisma.donationCampaign.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updatedAt: true },
        take: 50,
      }),
      prisma.vendor.findMany({
        where: { status: 'APPROVED' },
        select: { slug: true, updatedAt: true },
        take: 100,
      }),
    ]);

    const bookRoutes: MetadataRoute.Sitemap = books.map((b) => ({
      url: `${baseUrl}/books/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const authorRoutes: MetadataRoute.Sitemap = authors.map((a) => ({
      url: `${baseUrl}/authors/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/categories/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const articleRoutes: MetadataRoute.Sitemap = articles.map((art) => ({
      url: `${baseUrl}/articles/${art.slug}`,
      lastModified: art.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const campaignRoutes: MetadataRoute.Sitemap = campaigns.map((camp) => ({
      url: `${baseUrl}/donations/${camp.slug}`,
      lastModified: camp.updatedAt,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    const vendorRoutes: MetadataRoute.Sitemap = vendors.map((v) => ({
      url: `${baseUrl}/sellers/${v.slug}`,
      lastModified: v.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [
      ...staticRoutes,
      ...bookRoutes,
      ...authorRoutes,
      ...categoryRoutes,
      ...articleRoutes,
      ...campaignRoutes,
      ...vendorRoutes,
    ];
  } catch (err) {
    console.error('Sitemap dynamic generation error:', err);
    return staticRoutes;
  }
}

