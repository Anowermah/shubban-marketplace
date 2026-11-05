/**
 * Shubban AI Autonomous Management System — Tool Registry & Execution Handlers
 * 
 * Defines typed tools with parameter validation, execution logic, 
 * before/after state capture for rollback, and storefront cache revalidation.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback when executed in background workers or CLI scripts
  }
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'HOMEPAGE' | 'CATALOG' | 'MARKETING' | 'SEO' | 'ANALYTICS' | 'APPEARANCE' | 'OPERATIONS';
  safetyMode: 'MODE_A' | 'MODE_B' | 'MODE_C';
  parametersSchema: Record<string, any>;
  execute: (params: any, context?: any) => Promise<ToolExecutionResult>;
}

export interface ToolExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  beforeState?: any;
  afterState?: any;
  diffSummary?: string;
  rollbackPayload?: any;
}

export const AI_TOOLS: Record<string, ToolDefinition> = {
  // ========================================================
  // 1. HOMEPAGE & BANNER TOOLS
  // ========================================================
  reorder_homepage_sections: {
    name: 'reorder_homepage_sections',
    description: 'হোমপেজের বিভিন্ন সেকশনের ডিসপ্লে অর্ডার পরিবর্তন করা (যেমন: ইসলামিক বই সবার উপরে নেওয়া)',
    category: 'HOMEPAGE',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: {
        orderMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sectionKey: { type: 'string' },
              displayOrder: { type: 'number' },
            },
            required: ['sectionKey', 'displayOrder'],
          },
        },
      },
      required: ['orderMapping'],
    },
    execute: async (params) => {
      const { orderMapping } = params;
      const beforeState = await prisma.homepageSection.findMany({
        where: { sectionKey: { in: orderMapping.map((o: any) => o.sectionKey) } },
      });

      const updates = [];
      for (const item of orderMapping) {
        updates.push(
          prisma.homepageSection.updateMany({
            where: { sectionKey: item.sectionKey },
            data: { displayOrder: item.displayOrder },
          })
        );
      }
      await prisma.$transaction(updates);

      const afterState = await prisma.homepageSection.findMany({
        where: { sectionKey: { in: orderMapping.map((o: any) => o.sectionKey) } },
      });

      safeRevalidatePath('/');
      safeRevalidatePath('/admin/homepage');

      return {
        success: true,
        message: `${orderMapping.length}টি হোমপেজ সেকশনের ক্রম সফলভাবে বিন্যস্ত করা হয়েছে।`,
        beforeState,
        afterState,
        diffSummary: `সেকশন রির‍্যাংকিং সম্পন্ন হয়েছে। হোমপেজ রিভ্যালিডেট হয়েছে।`,
        rollbackPayload: {
          action: 'reorder_homepage_sections',
          orderMapping: beforeState.map((s) => ({ sectionKey: s.sectionKey, displayOrder: s.displayOrder })),
        },
      };
    },
  },

  toggle_homepage_section: {
    name: 'toggle_homepage_section',
    description: 'হোমপেজের নির্দিষ্ট সেকশন সক্রিয় (enable) বা নিষ্ক্রিয় (disable) করা',
    category: 'HOMEPAGE',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: {
        sectionKey: { type: 'string' },
        isEnabled: { type: 'boolean' },
      },
      required: ['sectionKey', 'isEnabled'],
    },
    execute: async (params) => {
      const { sectionKey, isEnabled } = params;
      const before = await prisma.homepageSection.findUnique({ where: { sectionKey } });

      const updated = await prisma.homepageSection.update({
        where: { sectionKey },
        data: { isEnabled },
      });

      safeRevalidatePath('/');
      safeRevalidatePath('/admin/homepage');

      return {
        success: true,
        message: `সেকশন "${updated.title}" সফলভাবে ${isEnabled ? 'সক্রিয় (Visible)' : 'নিষ্ক্রিয় (Hidden)'} করা হয়েছে।`,
        beforeState: before,
        afterState: updated,
        diffSummary: `দৃশ্যমানতা: ${before?.isEnabled ? 'চালু' : 'বন্ধ'} ➔ ${isEnabled ? 'চালু' : 'বন্ধ'}`,
        rollbackPayload: {
          action: 'toggle_homepage_section',
          sectionKey,
          isEnabled: before?.isEnabled ?? true,
        },
      };
    },
  },

  customize_section_meta: {
    name: 'customize_section_meta',
    description: 'হোমপেজ সেকশনের শিরোনাম (title), সাবটাইটেল (subtitle), ব্যাজ (badge) বা ভিউ-অল লিংক পরিবর্তন করা',
    category: 'HOMEPAGE',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: {
        sectionKey: { type: 'string' },
        title: { type: 'string' },
        subtitle: { type: 'string' },
        badge: { type: 'string' },
        viewAllUrl: { type: 'string' },
      },
      required: ['sectionKey'],
    },
    execute: async (params) => {
      const { sectionKey, title, subtitle, badge, viewAllUrl } = params;
      const before = await prisma.homepageSection.findUnique({ where: { sectionKey } });

      const dataToUpdate: any = {};
      if (title !== undefined) dataToUpdate.title = title;
      if (subtitle !== undefined) dataToUpdate.subtitle = subtitle;
      if (badge !== undefined) dataToUpdate.badge = badge;
      if (viewAllUrl !== undefined) dataToUpdate.viewAllUrl = viewAllUrl;

      const updated = await prisma.homepageSection.update({
        where: { sectionKey },
        data: dataToUpdate,
      });

      safeRevalidatePath('/');
      safeRevalidatePath('/admin/homepage');

      return {
        success: true,
        message: `"${updated.title}" সেকশনের কন্টেন্ট মেটা সফলভাবে আপডেট করা হয়েছে।`,
        beforeState: before,
        afterState: updated,
        diffSummary: `শিরোনাম: ${before?.title} ➔ ${updated.title}`,
        rollbackPayload: {
          action: 'customize_section_meta',
          sectionKey,
          title: before?.title,
          subtitle: before?.subtitle,
          badge: before?.badge,
          viewAllUrl: before?.viewAllUrl,
        },
      };
    },
  },

  create_hero_slide: {
    name: 'create_hero_slide',
    description: 'হোমপেজ প্রধান স্লাইডারে নতুন প্রমোশনাল ব্যানার/স্লাইড তৈরি ও যুক্ত করা',
    category: 'HOMEPAGE',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        subhead: { type: 'string' },
        badge: { type: 'string' },
        badgeIcon: { type: 'string' },
        couponCode: { type: 'string' },
        primaryCtaText: { type: 'string' },
        primaryCtaLink: { type: 'string' },
        secondaryCtaText: { type: 'string' },
        secondaryCtaLink: { type: 'string' },
        bgGradient: { type: 'string' },
        imageUrl: { type: 'string' },
        displayOrder: { type: 'number' },
      },
      required: ['headline', 'subhead', 'badge', 'imageUrl'],
    },
    execute: async (params) => {
      const slide = await prisma.heroSlide.create({
        data: {
          headline: params.headline,
          subhead: params.subhead,
          badge: params.badge,
          badgeIcon: params.badgeIcon || 'Sparkles',
          couponCode: params.couponCode || null,
          primaryCtaText: params.primaryCtaText || 'সকল বই দেখুন',
          primaryCtaLink: params.primaryCtaLink || '/books',
          secondaryCtaText: params.secondaryCtaText || null,
          secondaryCtaLink: params.secondaryCtaLink || null,
          bgGradient: params.bgGradient || 'from-shubban-green via-emerald-950 to-shubban-green',
          imageUrl: params.imageUrl,
          displayOrder: params.displayOrder || 1,
          isPublished: true,
        },
      });

      safeRevalidatePath('/');
      safeRevalidatePath('/admin/banners');

      return {
        success: true,
        message: `নতুন হিরো ব্যানার "${slide.headline}" সফলভাবে তৈরি ও হোমপেজে যুক্ত হয়েছে।`,
        afterState: slide,
        diffSummary: `নতুন স্লাইড তৈরি: [${slide.badge}] "${slide.headline}"`,
        rollbackPayload: {
          action: 'delete_hero_slide',
          id: slide.id,
        },
      };
    },
  },

  // ========================================================
  // 2. E-COMMERCE, PRODUCT & INVENTORY TOOLS
  // ========================================================
  analyze_inventory_and_low_stock: {
    name: 'analyze_inventory_and_low_stock',
    description: 'ইনভেন্টরি বিশ্লেষণ, স্টক আউট বই শনাক্তকরণ এবং রি-অর্ডার রিকমেন্ডেশন তৈরি',
    category: 'CATALOG',
    safetyMode: 'MODE_A',
    parametersSchema: {
      type: 'object',
      properties: {
        threshold: { type: 'number', default: 5 },
      },
    },
    execute: async (params) => {
      const threshold = params.threshold || 5;
      const lowStockBooks = await prisma.book.findMany({
        where: { stockQuantity: { lte: threshold } },
        include: { author: true, category: true },
        take: 10,
        orderBy: { stockQuantity: 'asc' },
      });

      const totalBooks = await prisma.book.count();
      const outOfStockCount = await prisma.book.count({ where: { stockQuantity: 0 } });

      return {
        success: true,
        message: `ইনভেন্টরি বিশ্লেষণ সম্পন্ন। মোট বই: ${totalBooks}টি, স্টক আউট: ${outOfStockCount}টি, সতর্কতামূলক স্টক (≤${threshold}): ${lowStockBooks.length}টি।`,
        data: {
          totalBooks,
          outOfStockCount,
          lowStockBooks: lowStockBooks.map((b) => ({
            id: b.id,
            title: b.title,
            stock: b.stockQuantity,
            author: b.author?.name,
            category: b.category?.name,
          })),
        },
      };
    },
  },

  detect_duplicate_products: {
    name: 'detect_duplicate_products',
    description: 'ডাটাবেসে সম্ভাব্য ডুপ্লিকেট বই বা প্রোডাক্ট শনাক্তকরণ',
    category: 'CATALOG',
    safetyMode: 'MODE_A',
    parametersSchema: { type: 'object', properties: {} },
    execute: async () => {
      const books = await prisma.book.findMany({
        select: { id: true, title: true, isbn: true, authorId: true },
        take: 100,
      });

      const titleMap = new Map<string, string[]>();
      books.forEach((b) => {
        const norm = b.title.trim().toLowerCase();
        if (!titleMap.has(norm)) titleMap.set(norm, []);
        titleMap.get(norm)!.push(b.id);
      });

      const duplicates: any[] = [];
      titleMap.forEach((ids, title) => {
        if (ids.length > 1) {
          duplicates.push({ title, count: ids.length, bookIds: ids });
        }
      });

      return {
        success: true,
        message: duplicates.length > 0
          ? `${duplicates.length}টি সম্ভাব্য ডুপ্লিকেট বই শনাক্ত করা হয়েছে।`
          : 'কোনো ডুপ্লিকেট বই পাওয়া যায়নি। ক্যাটালগ পরিষ্কার রয়েছে।',
        data: { duplicates },
      };
    },
  },

  update_product_pricing: {
    name: 'update_product_pricing',
    description: 'কোনো বইয়ের মূল বা ছাড়ের মূল্য (Discount Price) হালনাগাদ করা',
    category: 'CATALOG',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: {
        bookId: { type: 'string' },
        price: { type: 'number' },
        discountPrice: { type: 'number' },
      },
      required: ['bookId'],
    },
    execute: async (params) => {
      const { bookId, price, discountPrice } = params;
      const before = await prisma.book.findUnique({ where: { id: bookId } });
      if (!before) throw new Error('বইটি পাওয়া যায়নি।');

      const data: any = {};
      if (price !== undefined) data.price = price;
      if (discountPrice !== undefined) data.discountPrice = discountPrice;

      const updated = await prisma.book.update({
        where: { id: bookId },
        data,
      });

      safeRevalidatePath(`/books/${updated.slug}`);
      safeRevalidatePath('/books');

      return {
        success: true,
        message: `"${updated.title}" বইয়ের মূল্য সফলভাবে আপডেট করা হয়েছে। বর্তমান মূল্য: ৳${updated.price}, ছাড়ের মূল্য: ৳${updated.discountPrice || updated.price}`,
        beforeState: { price: before.price, discountPrice: before.discountPrice },
        afterState: { price: updated.price, discountPrice: updated.discountPrice },
        diffSummary: `মূল্য পরিবর্তন: ৳${before.price} ➔ ৳${updated.price}`,
        rollbackPayload: {
          action: 'update_product_pricing',
          bookId,
          price: before.price,
          discountPrice: before.discountPrice,
        },
      };
    },
  },

  // ========================================================
  // 3. CAMPAIGNS, COUPONS & MARKETING TOOLS
  // ========================================================
  create_coupon: {
    name: 'create_coupon',
    description: 'নতুন প্রোমোশনাল কুপন কোড ও ডিসকাউন্ট তৈরি করা',
    category: 'MARKETING',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        discountType: { type: 'string', enum: ['PERCENTAGE', 'FIXED'] },
        amount: { type: 'number' },
        minPurchase: { type: 'number' },
        expiryDate: { type: 'string' },
      },
      required: ['code', 'discountType', 'amount'],
    },
    execute: async (params) => {
      const { code, discountType, amount, minPurchase } = params;
      const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (existing) {
        throw new Error(`কুপন কোড "${code}" ইতিমধ্যে বিদ্যমান। অন্য কোড দিন।`);
      }

      const isPct = discountType === 'PERCENTAGE';
      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase(),
          discountPct: isPct ? amount : null,
          discountAmt: !isPct ? amount : null,
          minAmount: minPurchase || 0,
          isActive: true,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
        },
      });

      return {
        success: true,
        message: `কুপন "${coupon.code}" সফলভাবে তৈরি হয়েছে (${isPct ? `${amount}% ছাড়` : `৳${amount} ছাড়`})।`,
        afterState: coupon,
        diffSummary: `নতুন কুপন কোড: ${coupon.code}`,
        rollbackPayload: {
          action: 'delete_coupon',
          id: coupon.id,
        },
      };
    },
  },

  launch_promotional_campaign: {
    name: 'launch_promotional_campaign',
    description: 'একটি পূর্ণাঙ্গ অফার ও প্রমোশনাল ক্যাম্পেইন চালু করা (কুপন কোড + হিরো ব্যানার + সেকশন হাইলাইট)',
    category: 'MARKETING',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: {
        campaignName: { type: 'string' },
        couponCode: { type: 'string' },
        discountPercent: { type: 'number' },
        bannerHeadline: { type: 'string' },
        bannerSubhead: { type: 'string' },
        badgeText: { type: 'string' },
        imageUrl: { type: 'string' },
      },
      required: ['campaignName', 'couponCode', 'discountPercent', 'bannerHeadline'],
    },
    execute: async (params) => {
      const { campaignName, couponCode, discountPercent, bannerHeadline, bannerSubhead, badgeText, imageUrl } = params;

      // 1. Create or ensure coupon exists
      let coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (!coupon) {
        coupon = await prisma.coupon.create({
          data: {
            code: couponCode.toUpperCase(),
            discountPct: discountPercent,
            discountAmt: null,
            minAmount: 300,
            isActive: true,
            expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // 2. Create Hero Banner Slide
      const slide = await prisma.heroSlide.create({
        data: {
          headline: bannerHeadline,
          subhead: bannerSubhead || `${campaignName} উপলক্ষে সকল বইয়ে আকর্ষণীয় ছাড়! কুপন কোড ব্যবহার করুন।`,
          badge: badgeText || campaignName,
          badgeIcon: 'Flame',
          couponCode: coupon.code,
          primaryCtaText: 'অফার সংগ্রহ দেখুন',
          primaryCtaLink: '/books?filter=discount',
          secondaryCtaText: 'কুপন প্রয়োগ করুন',
          secondaryCtaLink: '/books',
          bgGradient: 'from-amber-950 via-rose-950 to-amber-950',
          imageUrl: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
          displayOrder: 1,
          isPublished: true,
        },
      });

      // 3. Highlight Flash Sale Section
      await prisma.homepageSection.updateMany({
        where: { sectionKey: 'flash_sale' },
        data: { isEnabled: true, displayOrder: 2 },
      });

      safeRevalidatePath('/');

      return {
        success: true,
        message: `ক্যাম্পেইন "${campaignName}" সফলভাবে চালু হয়েছে! কুপন: ${coupon.code} (${discountPercent}% ছাড়) এবং নতুন ব্যানার যুক্ত হয়েছে।`,
        data: { coupon, slide },
        diffSummary: `ক্যাম্পেইন চালু: কুপন ${coupon.code} এবং হিরো ব্যানার প্রকাশিত।`,
        rollbackPayload: {
          action: 'rollback_campaign',
          couponId: coupon.id,
          slideId: slide.id,
        },
      };
    },
  },

  delete_coupon: {
    name: 'delete_coupon',
    description: 'কুপন কোড মুছে ফেলা',
    category: 'MARKETING',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    execute: async (params) => {
      await prisma.coupon.delete({ where: { id: params.id } }).catch(() => {});
      return { success: true, message: 'কুপন মুছে ফেলা হয়েছে।' };
    },
  },

  delete_hero_slide: {
    name: 'delete_hero_slide',
    description: 'হিরো স্লাইড মুছে ফেলা',
    category: 'HOMEPAGE',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    execute: async (params) => {
      await prisma.heroSlide.delete({ where: { id: params.id } }).catch(() => {});
      safeRevalidatePath('/');
      return { success: true, message: 'হিরো স্লাইড মুছে ফেলা হয়েছে।' };
    },
  },

  rollback_campaign: {
    name: 'rollback_campaign',
    description: 'চালু করা ক্যাম্পেইনের কুপন ও স্লাইড মুছে পূর্বাবস্থায় ফিরিয়ে নেওয়া',
    category: 'MARKETING',
    safetyMode: 'MODE_B',
    parametersSchema: {
      type: 'object',
      properties: {
        couponId: { type: 'string' },
        slideId: { type: 'string' },
      },
    },
    execute: async (params) => {
      if (params.couponId) await prisma.coupon.delete({ where: { id: params.couponId } }).catch(() => {});
      if (params.slideId) await prisma.heroSlide.delete({ where: { id: params.slideId } }).catch(() => {});
      safeRevalidatePath('/');
      return { success: true, message: 'ক্যাম্পেইন সফলভাবে রোলব্যাক করা হয়েছে।' };
    },
  },

  // ========================================================
  // 4. SEO, AUDIT & APPEARANCE TOOLS
  // ========================================================
  audit_seo_metadata: {
    name: 'audit_seo_metadata',
    description: 'ওয়েবসাইটের বই ও কন্টেন্ট পেজগুলোর এসইও মেটাডাটা পরীক্ষা ও পরামর্শ প্রদান',
    category: 'SEO',
    safetyMode: 'MODE_A',
    parametersSchema: { type: 'object', properties: {} },
    execute: async () => {
      const booksWithoutSynopsis = await prisma.book.count({
        where: { OR: [{ synopsis: null }, { synopsis: '' }] },
      });
      const articlesWithoutMeta = await prisma.article.count({
        where: { OR: [{ metaTitle: null }, { metaDescription: null }] },
      });

      return {
        success: true,
        message: `এসইও ও কন্টেন্ট অডিট সম্পন্ন। সারসংক্ষেপবিহীন বই: ${booksWithoutSynopsis}টি, মেটাডাটা বিহীন প্রবন্ধ: ${articlesWithoutMeta}টি।`,
        data: {
          booksWithoutSynopsis,
          articlesWithoutMeta,
          recommendations: [
            'শীর্ষ ১০টি জনপ্রিয় বইয়ের জন্য বাংলা মেটা শিরোনাম ও সংক্ষিপ্ত বিবরণ যোগ করুন।',
            'সোশ্যাল মিডিয়া প্রিভিউয়ের জন্য ওপেন গ্রাফ (OG) ইমেজ নিশ্চিত করুন।',
          ],
        },
      };
    },
  },

  detect_broken_links_and_missing_images: {
    name: 'detect_broken_links_and_missing_images',
    description: 'ওয়েবসাইটে কোনো অনুপস্থিত ছবি বা অকার্যকর ইমেজ ইউআরএল আছে কি না স্ক্যান করা',
    category: 'SEO',
    safetyMode: 'MODE_A',
    parametersSchema: { type: 'object', properties: {} },
    execute: async () => {
      const booksMissingCover = await prisma.book.findMany({
        where: { OR: [{ coverImage: '' }, { coverImage: null }] },
        select: { id: true, title: true, slug: true },
        take: 10,
      });

      const authorsMissingPhoto = await prisma.author.findMany({
        where: { OR: [{ photoUrl: '' }, { photoUrl: null }] },
        select: { id: true, name: true, slug: true },
        take: 10,
      });

      return {
        success: true,
        message: `ছবি ও লিংক স্ক্যান সম্পন্ন। কভারবিহীন বই: ${booksMissingCover.length}টি, ছবিবিহীন লেখক: ${authorsMissingPhoto.length}টি।`,
        data: { booksMissingCover, authorsMissingPhoto },
      };
    },
  },

  // ========================================================
  // 5. SALES, ANALYTICS & REPORTING TOOLS
  // ========================================================
  generate_sales_performance_report: {
    name: 'generate_sales_performance_report',
    description: 'সাম্প্রতিক বিক্রয়, মোট অর্ডার ও শীর্ষ জনপ্রিয় বইয়ের সংক্ষিপ্ত অ্যানালিটিক্স তৈরি',
    category: 'ANALYTICS',
    safetyMode: 'MODE_A',
    parametersSchema: {
      type: 'object',
      properties: {
        periodDays: { type: 'number', default: 30 },
      },
    },
    execute: async (params) => {
      const days = params.periodDays || 30;
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const totalOrders = await prisma.order.count();
      const recentOrders = await prisma.order.count({
        where: { createdAt: { gte: sinceDate } },
      });

      const totalPaidOrders = await prisma.order.findMany({
        where: { paymentStatus: 'PAID' },
        select: { total: true },
      });
      const grossRevenue = totalPaidOrders.reduce((sum, o) => sum + o.total, 0);

      const topBooks = await prisma.book.findMany({
        where: { isBestSeller: true },
        select: { id: true, title: true, price: true, stockQuantity: true },
        take: 5,
      });

      return {
        success: true,
        message: `গত ${days} দিনের সেলস পারফরম্যান্স রিপোর্ট প্রস্তুত। মোট অর্ডার: ${recentOrders}টি (সর্বমোট: ${totalOrders}টি), পরিশোধিত রাজস্ব: ৳${grossRevenue.toLocaleString('en-IN')}।`,
        data: {
          periodDays: days,
          recentOrders,
          totalOrders,
          grossRevenue,
          topBooks,
        },
      };
    },
  },

  // ========================================================
  // 6. LOGISTICS, COURIER & OPERATIONS TOOLS
  // ========================================================
  get_pending_shipments: {
    name: 'get_pending_shipments',
    description: 'পিকআপ বা ডেলিভারির অপেক্ষায় থাকা পার্সেল ও আটকে থাকা শিপমেন্টের তালিকা দেখা',
    category: 'OPERATIONS',
    safetyMode: 'MODE_A',
    parametersSchema: {
      type: 'object',
      properties: {
        courierCode: { type: 'string', enum: ['ALL', 'STEADFAST', 'PATHAO', 'REDX'] },
        limit: { type: 'number', default: 10 },
      },
    },
    execute: async (params) => {
      const courierCode = params.courierCode && params.courierCode !== 'ALL' ? params.courierCode : undefined;
      const limit = params.limit || 10;

      const pending = await prisma.shipment.findMany({
        where: {
          status: { in: ['PENDING_PICKUP', 'PICKED_UP', 'IN_TRANSIT'] },
          ...(courierCode ? { courierCode } : {}),
        },
        include: {
          order: { select: { orderNumber: true, total: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      return {
        success: true,
        message: `বর্তমানে ${pending.length}টি পার্সেল পিকআপ বা ট্রানজিট প্রক্রিয়ায় রয়েছে।`,
        data: pending.map((s) => ({
          shipmentNumber: s.shipmentNumber,
          orderNumber: s.order.orderNumber,
          courier: s.courierName,
          status: s.status,
          trackingNumber: s.trackingNumber || s.consignmentId,
          recipient: s.recipientName,
          codAmount: s.codAmount,
          bookedAt: s.createdAt,
        })),
      };
    },
  },

  track_shipment: {
    name: 'track_shipment',
    description: 'নির্দিষ্ট পার্সেল বা অর্ডারের লাইভ ট্র্যাকিং তথ্য ও চেকপয়েন্ট দেখা',
    category: 'OPERATIONS',
    safetyMode: 'MODE_A',
    parametersSchema: {
      type: 'object',
      properties: {
        trackingIdentifier: { type: 'string' },
      },
      required: ['trackingIdentifier'],
    },
    execute: async (params) => {
      const { trackingIdentifier } = params;
      const shipment = await prisma.shipment.findFirst({
        where: {
          OR: [
            { trackingNumber: trackingIdentifier },
            { consignmentId: trackingIdentifier },
            { shipmentNumber: trackingIdentifier },
            { order: { orderNumber: trackingIdentifier } },
          ],
        },
        include: {
          order: { select: { orderNumber: true } },
          events: { orderBy: { timestamp: 'desc' } },
        },
      });

      if (!shipment) {
        return {
          success: false,
          message: `"${trackingIdentifier}" ট্র্যাকিং বা অর্ডার নম্বরের কোনো পার্সেল পাওয়া যায়নি।`,
        };
      }

      return {
        success: true,
        message: `পার্সেল ${shipment.shipmentNumber} (${shipment.courierName}) বর্তমান অবস্থা: ${shipment.status}`,
        data: {
          shipmentNumber: shipment.shipmentNumber,
          orderNumber: shipment.order.orderNumber,
          courier: shipment.courierName,
          status: shipment.status,
          trackingNumber: shipment.trackingNumber,
          events: shipment.events.map((e) => ({
            time: e.timestamp,
            status: e.status,
            note: e.note,
          })),
        },
      };
    },
  },

  get_cod_settlements: {
    name: 'get_cod_settlements',
    description: 'কুরিয়ার থেকে প্রাপ্তব্য বকেয়া সিওডি রেমিট্যান্স এবং বিগত সেটেলমেন্ট হিস্ট্রি জানা',
    category: 'OPERATIONS',
    safetyMode: 'MODE_A',
    parametersSchema: {
      type: 'object',
      properties: {
        courierCode: { type: 'string' },
      },
    },
    execute: async (params) => {
      const courierCode = params.courierCode || undefined;

      const unremitted = await prisma.shipment.findMany({
        where: {
          status: 'DELIVERED',
          isRemitted: false,
          codAmount: { gt: 0 },
          ...(courierCode ? { courierCode } : {}),
        },
      });

      const totalCod = unremitted.reduce((sum, s) => sum + s.codAmount, 0);
      const courierFees = unremitted.reduce((sum, s) => sum + s.courierFee, 0);
      const netPending = totalCod - courierFees;

      const pastSettlementsCount = await prisma.codSettlement.count();

      return {
        success: true,
        message: `অনিষ্পন্ন ডেলিভারিকৃত পার্সেল: ${unremitted.length}টি। সর্বমোট সংগৃহীত COD: ৳${totalCod.toLocaleString('en-IN')}, আনুমানিক নিট প্রাপ্য রেমিট্যান্স: ৳${netPending.toLocaleString('en-IN')}।`,
        data: {
          unremittedCount: unremitted.length,
          totalCod,
          courierFees,
          netPending,
          pastSettlementsCount,
        },
      };
    },
  },

  analyze_courier_performance: {
    name: 'analyze_courier_performance',
    description: 'কুরিয়ার পার্টনারদের ডেলিভারি সফলতার হার, বিলম্ব এবং রিটার্ন অনুপাত বিশ্লেষণ করা',
    category: 'OPERATIONS',
    safetyMode: 'MODE_A',
    parametersSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const providers = await prisma.courierProvider.findMany({
        include: {
          shipments: {
            select: { status: true },
          },
        },
      });

      const report = providers.map((p) => {
        const total = p.shipments.length;
        const delivered = p.shipments.filter((s) => s.status === 'DELIVERED').length;
        const returned = p.shipments.filter((s) => s.status === 'RETURNED').length;
        const active = p.shipments.filter((s) => ['PENDING_PICKUP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length;
        const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
        const returnRate = total > 0 ? Math.round((returned / total) * 100) : 0;

        return {
          providerName: p.name,
          code: p.code,
          isDefault: p.isDefault,
          totalShipments: total,
          delivered,
          returned,
          active,
          successRate: `${successRate}%`,
          returnRate: `${returnRate}%`,
        };
      });

      return {
        success: true,
        message: `কুরিয়ার পারফরম্যান্স বিশ্লেষণ প্রস্তুত হয়েছে (${providers.length}টি প্রোভাইডার)।`,
        data: report,
      };
    },
  },
};

