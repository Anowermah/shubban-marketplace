import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import HomePromoSlider, { DynamicHeroSlide } from '@/components/home/HomePromoSlider';
import CategoryIconGrid from '@/components/home/CategoryIconGrid';
import FlashSaleBanner from '@/components/home/FlashSaleBanner';
import HomeNewsletterSection from '@/components/home/HomeNewsletterSection';
import HomeIslamicAiSection from '@/components/home/HomeIslamicAiSection';
import BookCard from '@/components/books/BookCard';
import AdSlot from '@/components/ads/AdSlot';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Newspaper,
  FileText,
  GraduationCap,
  HelpCircle,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Download,
  Eye,
  Award,
  HeartHandshake,
  Store,
  ShieldCheck,
  Star,
  PackageCheck,
  Flame,
  Building2,
  BookOpenCheck,
  Compass,
} from 'lucide-react';
import { formatBengaliDate, toBengaliNumber } from '@/lib/utils';
import {
  getCachedSiteSettings,
  getCachedHomepageSections,
  getCachedHeroSlides,
} from '@/lib/cache';

export const revalidate = 60; // ISR cache revalidation every minute

const bookCardSelect = {
  id: true,
  title: true,
  slug: true,
  price: true,
  discountPrice: true,
  coverImage: true,
  isFree: true,
  isDigitalAvailable: true,
  isPhysicalAvailable: true,
  author: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
};

export default async function HomePage() {
  // Concurrent data fetching with lean projections, resilient fallbacks and cached settings
  let siteSettingsList: any[] = [];
  let homepageSectionsDb: any[] = [];
  let heroSlidesDb: any[] = [];
  let featuredBooks: any[] = [];
  let newArrivals: any[] = [];
  let bestSellers: any[] = [];
  let freeBooks: any[] = [];
  let recentIssues: any[] = [];
  let latestArticles: any[] = [];
  let researchPapers: any[] = [];
  let questions: any[] = [];
  let authors: any[] = [];
  let publishers: any[] = [];
  let donationCampaigns: any[] = [];
  let featuredVendors: any[] = [];
  let lifestyleProducts: any[] = [];
  let islamicBooks: any[] = [];

  try {
    [
      siteSettingsList,
      homepageSectionsDb,
      heroSlidesDb,
      featuredBooks,
      newArrivals,
      bestSellers,
      freeBooks,
      recentIssues,
      latestArticles,
      researchPapers,
      questions,
      authors,
      publishers,
      donationCampaigns,
      featuredVendors,
      lifestyleProducts,
      islamicBooks,
    ] = await Promise.all([
      getCachedSiteSettings(),
      getCachedHomepageSections(),
      getCachedHeroSlides(),
      prisma.book.findMany({
        where: { isFeatured: true },
        select: bookCardSelect,
        take: 6,
      }),
      prisma.book.findMany({
        where: { isNewArrival: true },
        select: bookCardSelect,
        take: 6,
      }),
      prisma.book.findMany({
        where: { isBestSeller: true },
        select: bookCardSelect,
        take: 6,
      }),
      prisma.book.findMany({
        where: { isFree: true, isDigitalAvailable: true },
        select: bookCardSelect,
        take: 6,
      }),
      prisma.publicationIssue.findMany({
        select: {
          id: true,
          issueTitle: true,
          volume: true,
          issueNumber: true,
          summary: true,
          coverImage: true,
          publicationDate: true,
          magazine: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { publicationDate: 'desc' },
        take: 3,
      }),
      prisma.article.findMany({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
          readingTime: true,
          author: { select: { name: true, photoUrl: true } },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      }),
      prisma.researchPaper.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          abstract: true,
          doi: true,
          institution: true,
          createdAt: true,
          author: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 2,
      }),
      prisma.question.findMany({
        select: {
          id: true,
          title: true,
          slug: true,
          content: true,
          views: true,
          createdAt: true,
          category: { select: { name: true } },
          _count: { select: { answers: true, votes: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.author.findMany({
        where: { isFeatured: true },
        select: {
          id: true,
          name: true,
          slug: true,
          photoUrl: true,
          bio: true,
          _count: { select: { books: true } },
        },
        take: 4,
      }),
      prisma.publisher.findMany({
        where: { isFeatured: true },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          description: true,
          _count: { select: { books: true } },
        },
        take: 4,
      }),
      prisma.donationCampaign.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          description: true,
          coverImage: true,
          goalAmount: true,
          raisedAmount: true,
          donorCount: true,
        },
        take: 3,
        orderBy: { raisedAmount: 'desc' },
      }),
      prisma.vendor.findMany({
        where: { status: 'APPROVED' },
        take: 3,
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          bannerUrl: true,
          description: true,
          city: true,
          books: {
            take: 3,
            select: { id: true, title: true, coverImage: true, price: true, discountPrice: true, slug: true },
          },
        },
      }),
      prisma.book.findMany({
        where: {
          category: { slug: 'islamic-lifestyle' },
        },
        select: {
          ...bookCardSelect,
          description: true,
          vendor: { select: { id: true, name: true, slug: true } },
          variants: { select: { id: true, name: true, price: true } },
        },
        take: 4,
      }),
      prisma.book.findMany({
        where: {
          OR: [
            { category: { slug: 'islamic' } },
            { category: { slug: 'philosophy' } },
          ],
        },
        select: bookCardSelect,
        take: 6,
      }),
    ]);
  } catch (error) {
    console.warn('[HomePage] Database query fallback triggered:', error);
  }

  // Transform hero slides into format expected by slider
  const initialHeroSlides: DynamicHeroSlide[] = (heroSlidesDb && heroSlidesDb.length > 0)
    ? heroSlidesDb.map((s) => ({
      id: s.id,
      badge: s.badge || 'জ্ঞান ও প্রজ্ঞার ভাণ্ডার',
      badgeIcon: s.badgeIcon || 'BookOpen',
      headline: s.headline,
      subhead: s.subhead,
      couponCode: s.couponCode,
      primaryCtaText: s.primaryCtaText || 'বইয়ের ক্যাটালগ',
      primaryCtaLink: s.primaryCtaLink || '/books',
      secondaryCtaText: s.secondaryCtaText,
      secondaryCtaLink: s.secondaryCtaLink,
      bgGradient: s.bgGradient,
      image: s.imageUrl,
      imageUrl: s.imageUrl,
    }))
    : [
      {
        id: 'default-hero-1',
        badge: 'জ্ঞান ও প্রজ্ঞার ভাণ্ডার',
        badgeIcon: 'BookOpen',
        headline: 'শুব্বান লাইব্রেরী — বই, জ্ঞান ও মননশীলতার এক সমৃদ্ধ ঠিকানা',
        subhead: 'হাজারো নির্বাচিত মুদ্রিত বই, বাংলা ই-বুক, গবেষণাপত্র ও সাময়িকীর ডিজিটাল সংগ্রহশালা।',
        primaryCtaText: 'বইয়ের ক্যাটালগ দেখুন',
        primaryCtaLink: '/books',
        secondaryCtaText: 'ইসলামিক এআই জিজ্ঞেস করুন',
        secondaryCtaLink: '/islamic-ai',
        bgGradient: 'from-emerald-950 via-teal-900 to-stone-900',
      },
    ];

  // Default fallback sections if DB table is unseeded
  const fallbackSections = [
    { id: 'sec_slider', sectionKey: 'slider', title: 'হিরো প্রমোশনাল স্লাইডার', subtitle: '', isEnabled: true, badge: 'হিরো', viewAllUrl: null },
    { id: 'sec_categories', sectionKey: 'categories', title: 'জনপ্রিয় বিষয় ও বিভাগসমূহ', subtitle: '', isEnabled: true, badge: 'ক্যাটাগরি', viewAllUrl: '/categories' },
    { id: 'sec_islamic_ai', sectionKey: 'islamic_ai', title: 'আপনার ইসলামিক প্রশ্নের উত্তর খুঁজুন', subtitle: 'পবিত্র কুরআন, নির্ভরযোগ্য তাফসির ও যাচাইকৃত হাদিসের আলোকে ইসলামিক বিষয়ে জানুন ও শিখুন।', isEnabled: true, badge: 'প্রামাণ্য ইসলামিক এআই', viewAllUrl: '/islamic-ai' },
    { id: 'sec_flash_sale', sectionKey: 'flash_sale', title: 'ফ্ল্যাশ সেল ও বিশেষ অফার', subtitle: '', isEnabled: true, badge: 'হট ডিল', viewAllUrl: '/books?filter=discount' },
    { id: 'sec_featured_books', sectionKey: 'featured_books', title: 'বিশেষ নির্বাচিত বইসমূহ', subtitle: 'নির্বাচিত গ্রন্থ সংগ্রহ', isEnabled: true, badge: 'নির্বাচিত সংগ্রহ', viewAllUrl: '/books?featured=true' },
    { id: 'sec_digital_library', sectionKey: 'digital_library', title: 'জনপ্রিয় উন্মুক্ত ও ফ্রি ডিজিটাল বই', subtitle: 'কোনো চার্জ ছাড়াই যে-কেউ ব্রাউজারে পড়তে এবং অনুমোদিত কপি ডাউনলোড করতে পারেন।', isEnabled: true, badge: 'মুক্ত পাঠাগার', viewAllUrl: '/digital-library?free=true' },
    { id: 'sec_new_bestsellers', sectionKey: 'new_bestsellers', title: 'নতুন আগমন ও বেস্টসেলার সংকলন', subtitle: '', isEnabled: true, badge: 'শীর্ষ তালিকা', viewAllUrl: '/books' },
    { id: 'sec_islamic_books', sectionKey: 'islamic_books', title: 'ইসলামিক বই ও প্রামাণ্য শাস্ত্রীয় সংকলন', subtitle: 'চিরায়ত তাফসীর, বিশুদ্ধ হাদিস গ্রন্থ, নবীজীবন এবং আদর্শিক ইসলামিক জ্ঞানকোষ', isEnabled: true, badge: 'কুরআন, হাদিস, সীরাত ও ফিকহ', viewAllUrl: '/books?category=islamic' },
    { id: 'sec_lifestyle', sectionKey: 'lifestyle', title: 'ইসলামিক লাইফস্টাইল ও আতর কালেকশন', subtitle: 'ওয়াফিজীবন সুন্নাহ সামগ্রী', isEnabled: true, badge: 'সুন্নাহসম্মত সামগ্রী', viewAllUrl: '/books?category=islamic-lifestyle' },
    { id: 'sec_donations', sectionKey: 'donations', title: 'মানবতার কল্যাণে আপনার সাদাকায়ে জারিয়া', subtitle: 'শতভাগ আমানতদারিতা ও শরিয়াহসম্মত উপায়ে পরিচালিত দ্বীনি শিক্ষা ও মানবসেবামূলক প্রজেক্ট', isEnabled: true, badge: 'আস-সুন্নাহ ও শুব্বান সদকাহ ফান্ড', viewAllUrl: '/donations' },
    { id: 'sec_magazines', sectionKey: 'magazines', title: 'সাপ্তাহিক ও মাসিক পত্রিকা', subtitle: 'নিয়মিত প্রকাশনা ও সাময়িকী', isEnabled: true, badge: 'সাময়িকী ও আর্কাইভ', viewAllUrl: '/magazines' },
    { id: 'sec_articles', sectionKey: 'articles', title: 'সাম্প্রতিক প্রবন্ধ ও চিন্তাশীল নিবন্ধ', subtitle: 'মননশীল সম্পাদকীয়', isEnabled: true, badge: 'মননশীল সম্পাদকীয়', viewAllUrl: '/articles' },
    { id: 'sec_research_qa', sectionKey: 'research_qa', title: 'গবেষণাপত্র ও একাডেমিয়া / প্রশ্নোত্তর ফোরাম', subtitle: '', isEnabled: true, badge: 'জ্ঞানজিজ্ঞাসা', viewAllUrl: '/questions' },
    { id: 'sec_vendors', sectionKey: 'vendors', title: 'শীর্ষ মার্কেটপ্লেস বিক্রেতা ও প্রতিষ্ঠান', subtitle: '', isEnabled: true, badge: 'মাল্টি-ভেন্ডর মার্কেটপ্লেস', viewAllUrl: '/seller/apply' },
    { id: 'sec_authors', sectionKey: 'authors', title: 'বরেণ্য লেখক ও চিন্তাশীল সাহিত্যিক', subtitle: '', isEnabled: true, badge: 'বরেণ্য লেখক', viewAllUrl: '/authors' },
    { id: 'sec_publishers', sectionKey: 'publishers', title: 'শীর্ষ প্রকাশনী সংস্থা', subtitle: '', isEnabled: true, badge: 'প্রকাশনা প্রতিষ্ঠান', viewAllUrl: '/publishers' },
    { id: 'sec_membership', sectionKey: 'membership', title: 'পুরো ডিজিটাল লাইব্রেরীর অবারিত প্রবেশাধিকার নিন', subtitle: 'মাত্র ১৯৯ টাকা/মাস থেকে শুরু', isEnabled: true, badge: 'শুব্বান জ্ঞান সাধক মেম্বারশিপ', viewAllUrl: '/membership' },
    { id: 'sec_newsletter', sectionKey: 'newsletter', title: 'শুব্বান পাঠক ও গবেষক কমিউনিটি', subtitle: '', isEnabled: true, badge: 'নিউজলেটার', viewAllUrl: null },
  ];

  // Ensure Islamic AI section is present on the homepage
  let sectionsToRender = homepageSectionsDb.length > 0 ? [...homepageSectionsDb] : [...fallbackSections];
  if (!sectionsToRender.some((s) => s.sectionKey === 'islamic_ai')) {
    sectionsToRender.splice(2, 0, {
      id: 'sec_islamic_ai',
      sectionKey: 'islamic_ai',
      title: 'আপনার ইসলামিক প্রশ্নের উত্তর খুঁজুন',
      subtitle: 'পবিত্র কুরআন, নির্ভরযোগ্য তাফসির ও যাচাইকৃত হাদিসের আলোকে ইসলামিক বিষয়ে জানুন ও শিখুন।',
      isEnabled: true,
      badge: 'প্রামাণ্য ইসলামিক এআই',
      viewAllUrl: '/islamic-ai',
    } as any);
  }

  // Helper to render individual sections dynamically
  const renderSection = (key: string, sec: any) => {
    switch (key) {
      // 0. Islamic AI Public Assistant Section
      case 'islamic_ai':
        return <HomeIslamicAiSection key={sec.id} />;

      // 1. Hero Promo Slider
      case 'slider':
        return (
          <React.Fragment key={sec.id}>
            <HomePromoSlider initialSlides={initialHeroSlides.length > 0 ? initialHeroSlides : undefined} />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
              <AdSlot placementKey="home_hero_below" />
            </div>
          </React.Fragment>
        );

      // 2. Featured Category Icons Grid
      case 'categories':
        return <CategoryIconGrid key={sec.id} />;

      // 3. Flash Sale & Special Offers Bar
      case 'flash_sale':
        return <FlashSaleBanner key={sec.id} />;

      // 4. Featured Books Showcase
      case 'featured_books':
        if (featuredBooks.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>{sec.badge || 'নির্বাচিত সংগ্রহ'}</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  {sec.title || 'বিশেষ নির্বাচিত বইসমূহ'}
                </h2>
                {sec.subtitle && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
                    {sec.subtitle}
                  </p>
                )}
              </div>
              <Link
                href={sec.viewAllUrl || '/books?featured=true'}
                className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
              >
                <span>সব দেখুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4 md:gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </section>
        );

      // 5. Free Digital Library / PDF Shelf Banner
      case 'digital_library':
        if (freeBooks.length === 0) return null;
        return (
          <section key={sec.id} className="bg-shubban-green-50 dark:bg-shubban-darkCard/40 border-y border-stone-200/80 dark:border-stone-800 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-8 pb-3 border-b border-shubban-green-200/60 dark:border-stone-800">
                <div>
                  <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{sec.badge || 'মুক্ত পাঠাগার'}</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                    {sec.title || 'জনপ্রিয় উন্মুক্ত ও ফ্রি ডিজিটাল বই'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
                    {sec.subtitle || 'কোনো চার্জ ছাড়াই যে-কেউ ব্রাউজারে পড়তে এবং অনুমোদিত কপি ডাউনলোড করতে পারেন।'}
                  </p>
                </div>
                <Link
                  href={sec.viewAllUrl || '/digital-library?free=true'}
                  className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
                >
                  <span>মুক্ত লাইব্রেরী</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4 md:gap-6">
                {freeBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          </section>
        );

      // 6. New Arrivals & Best-Sellers Grid
      case 'new_bestsellers':
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* New Arrivals */}
              <div>
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-200 dark:border-stone-800">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    নতুন প্রকাশিত বই
                  </h3>
                  <Link href="/books?sort=newest" className="text-xs text-shubban-gold hover:underline">
                    সকল নতুন বই &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {newArrivals.slice(0, 3).map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </div>

              {/* Best Sellers */}
              <div>
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-stone-200 dark:border-stone-800">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                    সর্বাধিক পঠিত ও জনপ্রিয়
                  </h3>
                  <Link href="/books?sort=bestseller" className="text-xs text-shubban-gold hover:underline">
                    জনপ্রিয় তালিকা &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {bestSellers.slice(0, 3).map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      // 7. Islamic Book Collections (Quran, Hadith, Seerah, Fiqh Curated Showcase)
      case 'islamic_books':
        if (islamicBooks.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-r from-emerald-900/10 via-stone-50 to-emerald-900/10 dark:from-stone-900 dark:via-stone-900/80 dark:to-stone-900 p-6 sm:p-8 border border-emerald-900/20 dark:border-emerald-800/30 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 border-b border-stone-200 dark:border-stone-800 pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-1">
                    <BookOpenCheck className="w-4 h-4" />
                    <span>{sec.badge || 'কুরআন, হাদিস, সীরাত ও ফিকহ'}</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                    {sec.title || 'ইসলামিক বই ও প্রামাণ্য শাস্ত্রীয় সংকলন'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
                    {sec.subtitle || 'চিরায়ত তাফসীর, বিশুদ্ধ হাদিস গ্রন্থ, নবীজীবন এবং আদর্শিক ইসলামিক জ্ঞানকোষ'}
                  </p>
                </div>
                <Link
                  href={sec.viewAllUrl || '/books?category=islamic'}
                  className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-end whitespace-nowrap"
                >
                  <span>সকল ইসলামিক বই</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Category Quick Pills */}
              <div className="flex flex-wrap gap-2 mb-6 text-xs">
                <Link
                  href="/books?category=islamic&search=তাফসীর"
                  className="px-3 py-1 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-emerald-600 transition-colors"
                >
                  তাফসীর ও কুরআনুল কারীম
                </Link>
                <Link
                  href="/books?category=islamic&search=হাদিস"
                  className="px-3 py-1 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-emerald-600 transition-colors"
                >
                  সহীহ হাদিস ও সুন্নাহ
                </Link>
                <Link
                  href="/books?category=islamic&search=সীরাত"
                  className="px-3 py-1 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-emerald-600 transition-colors"
                >
                  সীরাতুন্নবী (সা.)
                </Link>
                <Link
                  href="/books?category=islamic&search=ফিকহ"
                  className="px-3 py-1 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-emerald-600 transition-colors"
                >
                  ফিকহ ও ফতোয়া
                </Link>
                <Link
                  href="/books?category=islamic&search=মনীষা"
                  className="px-3 py-1 rounded-full bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-emerald-600 transition-colors"
                >
                  মুসলিম ইতিহাস ও জীবনী
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4 md:gap-6">
                {islamicBooks.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </div>
          </section>
        );

      // 8. Islamic Lifestyle & Sunnah Essentials
      case 'lifestyle':
        if (lifestyleProducts.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
                  <Sparkles className="w-4 h-4" />
                  <span>{sec.badge || 'সুন্নাহসম্মত সামগ্রী'}</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  {sec.title || 'ইসলামিক লাইফস্টাইল ও আতর কালেকশন'}
                </h2>
                {sec.subtitle && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">{sec.subtitle}</p>
                )}
              </div>
              <Link
                href={sec.viewAllUrl || '/books?category=islamic-lifestyle'}
                className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
              >
                <span>সকল লাইফস্টাইল পণ্য</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {lifestyleProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="group bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md hover:border-shubban-gold/40 transition-all flex flex-col"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={prod.coverImage}
                      alt={prod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {prod.discountPrice && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        ছাড়
                      </span>
                    )}
                    {prod.vendor && (
                      <span className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-stone-200 text-[10px] px-2 py-1 rounded truncate">
                        দোকান: {prod.vendor.name}
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-shubban-gold transition-colors line-clamp-1 mb-1">
                      <Link href={`/books/${prod.slug}`}>{prod.title}</Link>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">
                      {prod.description}
                    </p>

                    {prod.variants && prod.variants.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {prod.variants.map((v) => (
                          <span
                            key={v.id}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                          >
                            {v.name}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <div>
                        <div className="font-serif font-bold text-base text-shubban-green dark:text-shubban-gold">
                          ৳{toBengaliNumber(prod.discountPrice || prod.price)}
                        </div>
                        {prod.discountPrice && (
                          <div className="text-[11px] text-stone-400 line-through">
                            ৳{toBengaliNumber(prod.price)}
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/books/${prod.slug}`}
                        className="px-3 py-1.5 rounded-lg bg-shubban-green hover:bg-shubban-green-700 text-shubban-ivory text-xs font-medium transition-colors"
                      >
                        অর্ডার করুন
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      // 9. As-Sunnah & Shubban Sadaqah Fund
      case 'donations':
        if (donationCampaigns.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-shubban-green to-emerald-950 text-white p-6 sm:p-10 border-2 border-shubban-gold/30 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-emerald-800/80 pb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
                    <HeartHandshake className="w-4 h-4" />
                    <span>{sec.badge || 'আস-সুন্নাহ ও শুব্বান সদকাহ ফান্ড'}</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                    {sec.title || 'মানবতার কল্যাণে আপনার সাদাকায়ে জারিয়া'}
                  </h2>
                  <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
                    {sec.subtitle || 'শতভাগ আমানতদারিতা ও শরিয়াহসম্মত উপায়ে পরিচালিত দ্বীনি শিক্ষা ও মানবসেবামূলক প্রজেক্ট। প্রতিটি অনুদানের সাথে পাবেন সরকারি কর অব্যাহতিযোগ্য ডিজিটাল ভেরিফায়েড রসিদ।'}
                  </p>
                </div>
                <Link
                  href={sec.viewAllUrl || '/donations'}
                  className="px-5 py-2.5 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs sm:text-sm shadow-md transition-transform hover:-translate-y-0.5 whitespace-nowrap self-start md:self-end flex items-center gap-1.5"
                >
                  <span>সকল ফান্ড ও ক্যাম্পেইন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {donationCampaigns.map((camp) => {
                  const percent = Math.min(100, Math.round((camp.raisedAmount / camp.goalAmount) * 100));
                  return (
                    <div
                      key={camp.id}
                      className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 overflow-hidden flex flex-col hover:bg-white/15 transition-all"
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <img
                          src={camp.coverImage}
                          alt={camp.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2.5 py-1 rounded-md border border-amber-400/30">
                          {camp.category === 'RELIEF'
                            ? 'জরুরি ত্রাণ'
                            : camp.category === 'QURAN_DISTRIBUTION'
                              ? 'কুরআন বিতরণ'
                              : camp.category === 'WATER_WELL'
                                ? 'বিশুদ্ধ পানি'
                                : 'সদকায়ে জারিয়া'}
                        </span>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-serif font-bold text-base text-white hover:text-amber-300 transition-colors mb-2 line-clamp-1">
                          <Link href={`/donations/${camp.slug}`}>{camp.title}</Link>
                        </h3>
                        <p className="text-xs text-emerald-100/75 line-clamp-2 leading-relaxed mb-4">
                          {camp.description}
                        </p>

                        <div className="mt-auto space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-amber-300">
                              উত্তোলিত: ৳{toBengaliNumber(Math.round(camp.raisedAmount).toLocaleString('en-IN'))}
                            </span>
                            <span className="text-emerald-200">
                              {toBengaliNumber(percent)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-emerald-200/70 pt-1">
                            <span>লক্ষ্য: ৳{toBengaliNumber(Math.round(camp.goalAmount).toLocaleString('en-IN'))}</span>
                            <span>{toBengaliNumber(camp.donorCount)} জন দাতা</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10">
                          <Link
                            href={`/donations/${camp.slug}`}
                            className="w-full py-2 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                          >
                            <HeartHandshake className="w-3.5 h-3.5" />
                            <span>সরাসরি দান করুন</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-800/80 flex flex-wrap items-center justify-between text-xs text-emerald-100/80 gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>১০০% আমানতদারিতা ও শরিয়াহ বোর্ড কর্তৃক নিয়মিত অডিটকৃত ফান্ড</span>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <span>✓ তাত্ক্ষণিক ডিজিটাল কিউআর রসিদ</span>
                  <span>✓ বিকাশ, নগদ ও ভিসা/মাস্টারকার্ড সুরক্ষিত গেটওয়ে</span>
                </div>
              </div>
            </div>
          </section>
        );

      // 10. Periodicals & Magazines
      case 'magazines':
        if (recentIssues.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 border-b border-stone-200/80 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
                  <Newspaper className="w-4 h-4" />
                  <span>{sec.badge || 'সাময়িকী ও আর্কাইভ'}</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  {sec.title || 'সাপ্তাহিক ও মাসিক পত্রিকা'}
                </h2>
                {sec.subtitle && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">{sec.subtitle}</p>
                )}
              </div>
              <Link
                href={sec.viewAllUrl || '/magazines'}
                className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
              >
                <span>সকল সাময়িকী</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="group bg-white dark:bg-shubban-darkCard rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                    <img
                      src={issue.coverImage}
                      alt={issue.issueTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-shubban-green text-shubban-gold text-[11px] font-bold px-2.5 py-1 rounded-md shadow">
                      {issue.volume} {issue.issueNumber}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-xs font-semibold text-shubban-gold">
                      {issue.magazine.title}
                    </span>
                    <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 group-hover:text-shubban-green dark:group-hover:text-shubban-gold transition-colors mt-1 mb-2 line-clamp-1">
                      {issue.issueTitle}
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mb-4">
                      {issue.summary}
                    </p>
                    <div className="mt-auto pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatBengaliDate(issue.publicationDate)}
                      </span>
                      <Link
                        href={`/magazines/${issue.magazine.slug}/issues/${issue.id}`}
                        className="text-xs font-bold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
                      >
                        <span>অনলাইনে পড়ুন</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      // 11. Editorial Articles & Essays
      case 'articles':
        if (latestArticles.length === 0) return null;
        return (
          <section key={sec.id} className="bg-stone-100/60 dark:bg-stone-900/40 py-12 border-y border-stone-200/80 dark:border-stone-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-8 border-b border-stone-200 dark:border-stone-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
                    <FileText className="w-4 h-4" />
                    <span>{sec.badge || 'মননশীল সম্পাদকীয়'}</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                    {sec.title || 'সাম্প্রতিক প্রবন্ধ ও চিন্তাশীল নিবন্ধ'}
                  </h2>
                  {sec.subtitle && (
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">{sec.subtitle}</p>
                  )}
                </div>
                <Link
                  href={sec.viewAllUrl || '/articles'}
                  className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
                >
                  <span>সকল প্রবন্ধ</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestArticles.map((art) => (
                  <article
                    key={art.id}
                    className="bg-white dark:bg-shubban-darkCard rounded-xl border border-stone-200 dark:border-stone-800 p-6 flex flex-col shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                      <span className="font-semibold text-shubban-gold">{art.category.name}</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        {toBengaliNumber(art.readingTime)} মিনিট পাঠ
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-lg text-stone-900 dark:text-white hover:text-shubban-green dark:hover:text-shubban-gold transition-colors mb-2">
                      <Link href={`/articles/${art.slug}`}>{art.title}</Link>
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3 leading-relaxed mb-4">
                      {art.excerpt}
                    </p>
                    <div className="mt-auto pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-700 dark:text-stone-300">
                        {art.author.name}
                      </span>
                      <Link
                        href={`/articles/${art.slug}`}
                        className="font-semibold text-shubban-green dark:text-shubban-gold hover:underline"
                      >
                        সম্পূর্ণ পড়ুন &rarr;
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        );

      // 12. Academic Research & Community Q&A Split
      case 'research_qa':
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Research & Academia */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-shubban-gold" />
                    গবেষণাপত্র ও একাডেমিয়া
                  </h3>
                  <Link href="/research" className="text-xs text-shubban-gold hover:underline">
                    সকল গবেষণা &rarr;
                  </Link>
                </div>

                <div className="space-y-4">
                  {researchPapers.map((paper) => (
                    <div
                      key={paper.id}
                      className="p-5 rounded-xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm hover:border-shubban-gold/50 transition-all"
                    >
                      <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                        <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-[10px] font-mono text-stone-600 dark:text-stone-400">
                          DOI: {paper.doi || '10.5281/zenodo.shubban'}
                        </span>
                        <span className="text-[11px] text-stone-400">• {paper.institution}</span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 hover:text-shubban-green dark:hover:text-shubban-gold transition-colors mb-2">
                        <Link href={`/research/${paper.slug}`}>{paper.title}</Link>
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed mb-3">
                        {paper.abstract}
                      </p>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100 dark:border-stone-800">
                        <span className="text-stone-600 dark:text-stone-400 font-medium">
                          {paper.author.name}
                        </span>
                        <Link
                          href={`/research/${paper.slug}`}
                          className="text-shubban-green dark:text-shubban-gold font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>গবেষণাপত্র দেখুন</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Q&A Knowledge Forum */}
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    <HelpCircle className="w-6 h-6 text-shubban-gold" />
                    প্রশ্নোত্তর কমিউনিটি
                  </h3>
                  <Link href="/questions" className="text-xs text-shubban-gold hover:underline">
                    প্রশ্ন করুন &rarr;
                  </Link>
                </div>

                <div className="space-y-4">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-xl bg-white dark:bg-shubban-darkCard border border-stone-200 dark:border-stone-800 shadow-sm hover:border-shubban-gold/50 transition-all"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[11px] font-semibold text-shubban-gold bg-shubban-gold/10 px-2 py-0.5 rounded">
                          {q.category.name}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {toBengaliNumber((q as any)._count?.answers ?? (q as any).answers?.length ?? 0)}টি উত্তর
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 hover:text-shubban-green dark:hover:text-shubban-gold transition-colors mb-2">
                        <Link href={`/questions/${q.slug}`}>{q.title}</Link>
                      </h4>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {q.content}
                      </p>
                      <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-stone-400 flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {toBengaliNumber(q.views)} বার দেখা হয়েছে
                        </span>
                        <Link
                          href={`/questions/${q.slug}`}
                          className="text-shubban-green dark:text-shubban-gold font-semibold hover:underline"
                        >
                          উত্তর দিন / আলোচনা দেখুন &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      // 13. Top Marketplace Sellers Hub
      case 'vendors':
        if (featuredVendors.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
                  <Store className="w-4 h-4" />
                  <span>{sec.badge || 'মাল্টি-ভেন্ডর মার্কেটপ্লেস'}</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  {sec.title || 'শীর্ষ মার্কেটপ্লেস বিক্রেতা ও প্রতিষ্ঠান'}
                </h2>
                {sec.subtitle && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">{sec.subtitle}</p>
                )}
              </div>
              <Link
                href={sec.viewAllUrl || '/seller/apply'}
                className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
              >
                <span>মার্কেটপ্লেসে দোকান খুলুন</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md hover:border-shubban-gold/40 transition-all flex flex-col"
                >
                  <div className="h-24 bg-gradient-to-r from-shubban-green to-emerald-800 relative">
                    {vendor.bannerUrl && (
                      <img
                        src={vendor.bannerUrl}
                        alt={vendor.name}
                        className="w-full h-full object-cover opacity-60"
                      />
                    )}
                    <div className="absolute -bottom-5 left-5 w-12 h-12 rounded-xl bg-white dark:bg-stone-800 border-2 border-white dark:border-stone-700 shadow-md overflow-hidden flex items-center justify-center">
                      {vendor.logoUrl ? (
                        <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-shubban-green dark:text-shubban-gold" />
                      )}
                    </div>
                  </div>

                  <div className="pt-7 p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100 line-clamp-1">
                        <Link href={`/sellers/${vendor.slug}`}>{vendor.name}</Link>
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>৫.০</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 mb-4">
                      {vendor.description || `${vendor.city} ভিত্তিক বিশ্বস্ত বিক্রেতা`}
                    </p>

                    {vendor.books && vendor.books.length > 0 && (
                      <div className="mb-4">
                        <span className="text-[11px] font-semibold text-stone-400 block mb-2">
                          শীর্ষ আইটেমসমূহ:
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          {vendor.books.map((b) => (
                            <Link
                              key={b.id}
                              href={`/books/${b.slug}`}
                              className="aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:opacity-85 transition-opacity"
                            >
                              <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <PackageCheck className="w-3.5 h-3.5" />
                        ভেরিফায়েড সেলার
                      </span>
                      <Link
                        href={`/sellers/${vendor.slug}`}
                        className="text-xs font-bold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-0.5"
                      >
                        <span>দোকান দেখুন</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      // 14. Featured Authors Showcase
      case 'authors':
        if (authors.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
                  <Users className="w-4 h-4" />
                  <span>{sec.badge || 'বরেণ্য লেখক'}</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  {sec.title || 'বরেণ্য লেখক ও চিন্তাশীল সাহিত্যিক'}
                </h2>
                {sec.subtitle && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">{sec.subtitle}</p>
                )}
              </div>
              <Link
                href={sec.viewAllUrl || '/authors'}
                className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
              >
                <span>সকল লেখক</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {authors.map((auth) => (
                <Link
                  key={auth.id}
                  href={`/authors/${auth.slug}`}
                  className="group p-5 bg-white dark:bg-shubban-darkCard rounded-xl border border-stone-200 dark:border-stone-800 text-center flex flex-col items-center shadow-sm hover:shadow-md hover:border-shubban-gold/50 transition-all"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-3 border-2 border-shubban-gold/30 shadow-md group-hover:scale-105 transition-transform">
                    <img
                      src={auth.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                      alt={auth.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-shubban-gold transition-colors text-base">
                    {auth.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-1">{auth.bio}</p>
                  <span className="mt-2 inline-block text-[11px] font-semibold text-shubban-green dark:text-shubban-gold">
                    {toBengaliNumber((auth as any)._count?.books ?? (auth as any).books?.length ?? 0)}টি বই সংরক্ষিত
                  </span>
                </Link>
              ))}
            </div>
          </section>
        );

      // 15. Featured Publishers Showcase
      case 'publishers':
        if (publishers.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-shubban-gold font-semibold text-xs tracking-wider uppercase mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>{sec.badge || 'প্রকাশনা প্রতিষ্ঠান'}</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                  {sec.title || 'শীর্ষ প্রকাশনী সংস্থা'}
                </h2>
                {sec.subtitle && (
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">{sec.subtitle}</p>
                )}
              </div>
              <Link
                href={sec.viewAllUrl || '/publishers'}
                className="text-xs sm:text-sm font-semibold text-shubban-green dark:text-shubban-gold hover:underline flex items-center gap-1"
              >
                <span>সকল প্রকাশনী</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {publishers.map((pub) => (
                <Link
                  key={pub.id}
                  href={`/books?publisher=${pub.slug}`}
                  className="group p-5 bg-white dark:bg-shubban-darkCard rounded-2xl border border-stone-200 dark:border-stone-800 flex items-start gap-4 shadow-sm hover:shadow-md hover:border-shubban-gold/50 transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-shubban-green-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {pub.logoUrl ? (
                      <img src={pub.logoUrl} alt={pub.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Building2 className="w-7 h-7 text-shubban-green dark:text-shubban-gold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 group-hover:text-shubban-gold transition-colors text-base truncate">
                      {pub.name}
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                      {pub.description || 'বাংলাদেশের ঐতিহ্যবাহী ও নির্ভরযোগ্য প্রকাশনা প্রতিষ্ঠান।'}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-shubban-green dark:text-shubban-gold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{toBengaliNumber((pub as any)._count?.books ?? (pub as any).books?.length ?? 0)}টি প্রামাণ্য বই</span>
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );

      // 16. Membership & Subscription Promo Banner
      case 'membership':
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-shubban-green via-shubban-green-900 to-shubban-green text-shubban-ivory p-8 sm:p-12 border-2 border-shubban-gold/40 shadow-xl">
              <div className="relative z-10 max-w-2xl space-y-4">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-shubban-gold text-shubban-green-950">
                  <Award className="w-3.5 h-3.5" />
                  <span>{sec.badge || 'শুব্বান জ্ঞান সাধক মেম্বারশিপ'}</span>
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {sec.title || 'পুরো ডিজিটাল লাইব্রেরীর অবারিত প্রবেশাধিকার নিন'}
                </h2>
                <p className="text-sm text-shubban-ivory/80 leading-relaxed">
                  {sec.subtitle || 'মাত্র ১৯৯ টাকা/মাস থেকে শুরু। হাজারো বিরল পাণ্ডুলিপি, সাহিত্য সাময়িকী এবং গবেষণাপত্রের আনলিমিটেড ইন-ব্রাউজার পড়া ও ডিজিটাল সুবিধার অংশীদার হোন।'}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href={sec.viewAllUrl || '/membership'}
                    className="px-6 py-3 rounded-xl bg-shubban-gold hover:bg-shubban-gold-hover text-shubban-green-950 font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <span>সদস্যপদ প্ল্যান দেখুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/digital-library"
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all"
                  >
                    মুক্ত বইগুলো আগে পড়ুন
                  </Link>
                </div>
              </div>

              <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
                <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
                  <circle cx="100" cy="100" r="80" stroke="#C49A45" strokeWidth="4" strokeDasharray="10 10" />
                  <circle cx="100" cy="100" r="50" stroke="#C49A45" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </section>
        );

      // 17. Newsletter & Community Subscriber Showcase
      case 'newsletter':
        return <HomeNewsletterSection key={sec.id} />;

      // Custom Sections created from Admin CMS
      default:
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-emerald-900/10 via-amber-500/5 to-emerald-900/10 dark:from-stone-900 dark:to-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  {sec.badge && (
                    <span className="text-xs font-bold text-shubban-gold uppercase tracking-wider block mb-1">
                      {sec.badge}
                    </span>
                  )}
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                    {sec.title}
                  </h2>
                  {sec.subtitle && (
                    <p className="text-sm text-stone-600 dark:text-stone-400 mt-2 max-w-2xl leading-relaxed">
                      {sec.subtitle}
                    </p>
                  )}
                </div>
                {sec.viewAllUrl && (
                  <Link
                    href={sec.viewAllUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-shubban-green hover:bg-shubban-green-700 text-white font-medium text-xs sm:text-sm self-start sm:self-center transition-colors shadow"
                  >
                    <span>বিস্তারিত দেখুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </section>
        );
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 font-bengali">
      {/* Top Header Announcement Ad Slot */}
      <AdSlot placementKey="header_announcement" />

      {/* Main Top Leaderboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <AdSlot placementKey="home_top" />
      </div>

      {sectionsToRender
        .filter((sec) => sec.isEnabled)
        .map((sec) => renderSection(sec.sectionKey, sec))}
    </div>
  );
}
