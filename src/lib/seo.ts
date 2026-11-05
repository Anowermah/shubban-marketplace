/**
 * Enterprise SEO & Structured Data (Schema.org) Generation Engine
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://shubbanlibrary.com';

export function getCanonicalUrl(pathname: string): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${BASE_URL}${cleanPath}`;
}

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: 'শুব্বান লাইব্রেরি',
    alternateName: 'Shubban Digital Library & Islamic Marketplace',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      'বাংলাদেশের সর্ববৃহৎ বিশ্বস্ত ইসলামী বই, সাময়িকী, মুক্ত রিসোর্স ও আস-সুন্নাহ সদকাহ মার্কেটপ্লেস।',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+8801700000000',
      contactType: 'customer service',
      availableLanguage: ['Bengali', 'English', 'Arabic'],
    },
  };
}

export function generateBookJsonLd(book: {
  title: string;
  slug: string;
  isbn?: string | null;
  description: string;
  coverImage: string;
  price: number;
  discountPrice?: number | null;
  stockQuantity: number;
  author?: { name: string } | null;
  publisher?: { name: string } | null;
  reviews?: Array<{ rating: number; comment?: string | null }>;
}) {
  const effectivePrice = book.discountPrice || book.price;
  const ratingCount = book.reviews?.length || 0;
  const avgRating =
    ratingCount > 0
      ? (
          book.reviews!.reduce((acc, r) => acc + r.rating, 0) / ratingCount
        ).toFixed(1)
      : '5.0';

  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    isbn: book.isbn || undefined,
    url: `${BASE_URL}/books/${book.slug}`,
    image: book.coverImage,
    description: book.description.slice(0, 300),
    author: book.author
      ? {
          '@type': 'Person',
          name: book.author.name,
        }
      : undefined,
    publisher: book.publisher
      ? {
          '@type': 'Organization',
          name: book.publisher.name,
        }
      : undefined,
    offers: {
      '@type': 'Offer',
      price: effectivePrice,
      priceCurrency: 'BDT',
      availability:
        book.stockQuantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: `${BASE_URL}/books/${book.slug}`,
    },
    ...(ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating,
            reviewCount: ratingCount,
          },
        }
      : {}),
  };
}

export function generateArticleJsonLd(article: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string | null;
  publishedAt: Date | string;
  author?: { name: string } | null;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage ? `${BASE_URL}${article.coverImage}` : undefined,
    datePublished: new Date(article.publishedAt).toISOString(),
    url: `${BASE_URL}/articles/${article.slug}`,
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author.name,
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: 'শুব্বান লাইব্রেরি',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
  };
}

export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BASE_URL}${item.path}`,
    })),
  };
}

