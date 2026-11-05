import { prisma } from './prisma';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export async function getCachedData<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
  fallbackValue?: T
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(key);

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  try {
    const freshData = await fetchFn();
    memoryCache.set(key, {
      data: freshData,
      expiresAt: now + ttlSeconds * 1000,
    });
    return freshData;
  } catch (error) {
    console.warn(`[Cache] Failed to fetch data for key "${key}", using fallback:`, error);
    if (cached?.data) {
      return cached.data;
    }
    return (fallbackValue !== undefined ? fallbackValue : ([] as unknown as T));
  }
}

export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }
  Array.from(memoryCache.keys()).forEach((key) => {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  });
}

// 1. Cached Site Settings (5 mins TTL)
export async function getCachedSiteSettings() {
  return getCachedData('site_settings', 300, async () => {
    return prisma.siteSetting.findMany();
  });
}

// 2. Cached Homepage Sections (5 mins TTL)
export async function getCachedHomepageSections() {
  return getCachedData('homepage_sections', 300, async () => {
    return prisma.homepageSection.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  });
}

// 3. Cached Hero Slides (5 mins TTL)
export async function getCachedHeroSlides() {
  return getCachedData('hero_slides', 300, async () => {
    return prisma.heroSlide.findMany({
      where: { isPublished: true },
      orderBy: { displayOrder: 'asc' },
    });
  });
}

// 4. Cached Categories List (5 mins TTL)
export async function getCachedCategories() {
  return getCachedData('all_categories_with_count', 300, async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { books: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  });
}

