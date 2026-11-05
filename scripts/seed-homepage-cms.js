const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedHomepageCms() {
  console.log('--- Seeding Homepage CMS & Hero Slides ---');

  // 1. Initial Hero Slides
  const defaultSlides = [
    {
      badge: 'শুব্বান বইমেলা ও সাহিত্য উৎসব ২০২৬',
      badgeIcon: 'Flame',
      headline: 'চিরায়ত ও আধুনিক শ্রেষ্ঠ গ্রন্থসম্ভারে ৩০% পর্যন্ত বিশেষ ছাড়!',
      subhead: 'রবীন্দ্রনাথ, নজরুল, মীর মশাররফ হোসেন থেকে শুরু করে বরেণ্য গবেষকদের বই এখন এক ঠিকানায়। রকমারি-স্টাইল উপহার মোড়কীকরণ সুবিধা সহ।',
      couponCode: 'SHUBBAN10',
      primaryCtaText: 'সকল বই দেখুন',
      primaryCtaLink: '/books',
      secondaryCtaText: 'ডিজিタル লাইব্রেরী (PDF)',
      secondaryCtaLink: '/digital-library',
      bgGradient: 'from-shubban-green via-emerald-950 to-shubban-green',
      imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&q=80',
      displayOrder: 1,
      isPublished: true,
    },
    {
      badge: 'ওয়াফিজীবন অনুপ্রাণিত সুন্নাহ লাইফস্টাইল',
      badgeIcon: 'Sparkles',
      headline: 'মদিনার খাঁটি রয়্যাল উদ আতর ও তুর্কি মখমল জায়নামাজ',
      subhead: 'প্রাকৃতিক অ্যালকোহলমুক্ত হালাল আতর (৬ মিলি / ১২ মিলি), প্রিমিয়াম কাঠের তসবিহ ও প্রাকৃতিক জয়তুন মিসওয়াক দিয়ে সাজান আপনার আত্মিক জীবন।',
      primaryCtaText: 'লাইফস্টাইল সংগ্রহ',
      primaryCtaLink: '/books?category=islamic-lifestyle',
      secondaryCtaText: 'দারুল হুদা স্টোর',
      secondaryCtaLink: '/sellers/darul-huda-lifestyle',
      bgGradient: 'from-amber-950 via-stone-900 to-amber-950',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80',
      displayOrder: 2,
      isPublished: true,
    },
    {
      badge: 'আস-সুন্নাহ ও শুব্বান চ্যারিটি পার্টনারশিপ',
      badgeIcon: 'HeartHandshake',
      headline: 'শীতবস্ত্র বিতরণ ও সুবিধাবঞ্চিত মাদরাসা শিক্ষার্থীদের পাশে দাঁড়ান',
      subhead: 'আপনার দেওয়া সাদাকাহ সরাসরি পৌঁছে যাবে প্রত্যন্ত অঞ্চলের অভাবী মানুষের কাছে। শতভাগ স্বচ্ছতা, নিয়মিত অডিট ও তাৎক্ষণিক কিউআর রসিদ।',
      primaryCtaText: 'সদকাহ তহবিলে দান করুন',
      primaryCtaLink: '/donations',
      secondaryCtaText: 'প্রকল্পসমূহ জানুন',
      secondaryCtaLink: '/donations/as-sunnah-winter-aid-2026',
      bgGradient: 'from-emerald-950 via-teal-950 to-emerald-950',
      imageUrl: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80',
      displayOrder: 3,
      isPublished: true,
    },
    {
      badge: 'দারাজ-স্টাইল উন্মুক্ত মার্কেটপ্লেস',
      badgeIcon: 'Store',
      headline: 'আপনার প্রকাশনী ও শপকে যুক্ত করুন শুব্বান সেলার সেন্টারে!',
      subhead: 'দেশের শীর্ষ বইপ্রেমী ও সংস্কৃতিমনা পাঠকদের কাছে আপনার মুদ্রিত বই, সাময়িকী ও ইসলামিক সামগ্রী সহজে বিক্রি করুন। ৭ কর্মদিবসে সরাসরি ব্যাংক পে-আউট।',
      primaryCtaText: 'সেলার হতে আবেদন করুন',
      primaryCtaLink: '/seller/apply',
      secondaryCtaText: 'সেলার ড্যাশবোর্ড',
      secondaryCtaLink: '/seller/dashboard',
      bgGradient: 'from-stone-900 via-stone-950 to-stone-900',
      imageUrl: 'https://images.unsplash.com/photo-1507842229451-774293d64ba8?w=800&q=80',
      displayOrder: 4,
      isPublished: true,
    },
  ];

  for (const s of defaultSlides) {
    const existing = await prisma.heroSlide.findFirst({ where: { headline: s.headline } });
    if (!existing) {
      await prisma.heroSlide.create({ data: s });
      console.log('Created HeroSlide:', s.headline.slice(0, 30) + '...');
    }
  }

  // 2. Initial Homepage Sections
  const defaultSections = [
    {
      sectionKey: 'slider',
      title: 'হিরো প্রমোশনাল স্লাইডার',
      subtitle: 'প্রধান হোমপেজ ব্যানার ও অফার স্লাইডার',
      displayOrder: 1,
      isEnabled: true,
      badge: 'হিরো সেকশন',
      viewAllUrl: null,
    },
    {
      sectionKey: 'categories',
      title: 'জনপ্রিয় বিষয় ও বিভাগসমূহ',
      subtitle: 'আপনার পছন্দের ক্যাটাগরি ব্রাউজ করুন',
      displayOrder: 2,
      isEnabled: true,
      badge: 'ক্যাটাগরি',
      viewAllUrl: '/categories',
    },
    {
      sectionKey: 'flash_sale',
      title: 'ফ্ল্যাশ সেল ও বিশেষ অফার',
      subtitle: 'সীমিত সময়ের বিশেষ মূল্যে প্রিমিয়াম বই ও সামগ্রী',
      displayOrder: 3,
      isEnabled: true,
      badge: 'হট ডিল',
      viewAllUrl: '/books?filter=discount',
    },
    {
      sectionKey: 'featured_books',
      title: 'নির্বাচিত বই ও সেরা সংকলন',
      subtitle: 'শুব্বান লাইব্রেরী পাঠকমহলে সমাদৃত ও সম্পাদক মনোনীত গ্রন্থসম্ভার',
      displayOrder: 4,
      isEnabled: true,
      badge: 'সম্পাদকের পছন্দ',
      viewAllUrl: '/books?filter=featured',
    },
    {
      sectionKey: 'digital_library',
      title: 'ডিজিটাল লাইব্রেরী ও উন্মুক্ত পাঠ',
      subtitle: 'ব্রাউজারেই পড়ুন ও বিনামূল্যে ডাউনলোড করুন শত শত প্রামাণ্য ই-বুক',
      displayOrder: 5,
      isEnabled: true,
      badge: 'ফ্রি ডিজিটাল ই-বুক',
      viewAllUrl: '/digital-library',
    },
    {
      sectionKey: 'new_bestsellers',
      title: 'নতুন আগমন ও বেস্টসেলার সংকলন',
      subtitle: 'সদ্য প্রকাশিত নতুন বই এবং শীর্ষ বিক্রিত সমকালীন সাহিত্য',
      displayOrder: 6,
      isEnabled: true,
      badge: 'শীর্ষ তালিকা',
      viewAllUrl: '/books',
    },
    {
      sectionKey: 'islamic_books',
      title: 'ইসলামিক চিন্তাধারা, তাফসির ও ইতিহাস',
      subtitle: 'কুরআন, হাদিস, সীরাত, ফিকহ ও ইসলামিক মননশীল দর্শন গ্রন্থাবলী',
      displayOrder: 7,
      isEnabled: true,
      badge: 'ইসলামিক জ্ঞানপীঠ',
      viewAllUrl: '/books?category=islamic',
    },
    {
      sectionKey: 'lifestyle',
      title: 'ওয়াফিজীবন সুন্নাহ লাইফস্টাইল কালেকশন',
      subtitle: 'হালাল আতর, তুর্কি জায়নামাজ, প্রাকৃতিক মিসওয়াক ও প্রিমিয়াম তসবিহ',
      displayOrder: 8,
      isEnabled: true,
      badge: 'সুন্নাহ লাইফস্টাইল',
      viewAllUrl: '/books?category=islamic-lifestyle',
    },
    {
      sectionKey: 'donations',
      title: 'সদকায়ে জারিয়া ও কল্যাণ ফান্ড',
      subtitle: 'অসহায় ও জ্ঞানান্বেষী শিক্ষার্থীদের সহায়তায় আপনার অনুদান সরাসরি পৌঁছে দেওয়া হয়',
      displayOrder: 9,
      isEnabled: true,
      badge: 'চ্যারিটি ও ত্রাণ ফান্ড',
      viewAllUrl: '/donations',
    },
    {
      sectionKey: 'magazines',
      title: 'সাময়িকী ও পত্রিকা আর্কাইভ',
      subtitle: 'সাপ্তাহিক ও মাসিক জ্ঞানভিত্তিক পত্রিকার ডিজিটাল সংখ্যাসমূহ ব্রাউজ করুন',
      displayOrder: 10,
      isEnabled: true,
      badge: 'নিয়মিত প্রকাশনা',
      viewAllUrl: '/magazines',
    },
    {
      sectionKey: 'articles',
      title: 'সাম্প্রতিক প্রবন্ধ ও গবেষণাপত্র',
      subtitle: 'চিন্তাশীল লেখক ও গবেষকদের সমকালীন দর্শন ও গবেষণামূলক বিশ্লেষণ',
      displayOrder: 11,
      isEnabled: true,
      badge: 'মননশীল প্রবন্ধ',
      viewAllUrl: '/articles',
    },
    {
      sectionKey: 'research_qa',
      title: 'গবেষণাপত্র ও প্রশ্নোত্তর ফোরাম',
      subtitle: 'প্রামাণ্য অ্যাকাডেমিক রেফারেন্স এবং কমিউনিটি প্রশ্নোত্তর প্ল্যাটফর্ম',
      displayOrder: 12,
      isEnabled: true,
      badge: 'ফোরাম ও জ্ঞানজিজ্ঞাসা',
      viewAllUrl: '/questions',
    },
    {
      sectionKey: 'vendors',
      title: 'মার্কেটপ্লেস বিশ্বস্ত বিক্রেতা ও স্টোর',
      subtitle: 'দেশের সেরা প্রকাশনী ও অনুমোদিত লাইফস্টাইল ভেন্ডরদের নিজস্ব দোকান',
      displayOrder: 13,
      isEnabled: true,
      badge: 'ভেরিফায়েড ভেন্ডর',
      viewAllUrl: '/sellers',
    },
    {
      sectionKey: 'authors',
      title: 'বরেণ্য লেখক ও চিন্তাবিদ',
      subtitle: 'যাঁদের কলমে সমৃদ্ধ হয়েছে বাংলা সাহিত্য ও চিন্তা দর্শন',
      displayOrder: 14,
      isEnabled: true,
      badge: 'লেখক পরিচিতি',
      viewAllUrl: '/authors',
    },
    {
      sectionKey: 'publishers',
      title: 'শীর্ষ প্রকাশনা সংস্থা',
      subtitle: 'জ্ঞান ও সাহিত্যের আলো ছড়িয়ে দেওয়া প্রথিতযশা প্রকাশনীসমূহ',
      displayOrder: 15,
      isEnabled: true,
      badge: 'প্রকাশনী সংস্থা',
      viewAllUrl: '/publishers',
    },
    {
      sectionKey: 'membership',
      title: 'শুব্বান জ্ঞান সাধক মেম্বারশিপ',
      subtitle: 'প্রিমিয়াম ডিজিটাল লাইব্রেরী ও বিশেষ সদস্যপদ সুবিধা উপভোগ করুন',
      displayOrder: 16,
      isEnabled: true,
      badge: 'মেম্বারশিপ প্ল্যান',
      viewAllUrl: '/membership',
    },
    {
      sectionKey: 'newsletter',
      title: 'সাহিত্য সংবাদ ও নতুন বইয়ের বিজ্ঞপ্তি',
      subtitle: 'শুব্বানের নিয়মিত সাপ্তাহিক সাহিত্য সারসংক্ষেপ পেতে ইমেইল সাবস্ক্রাইব করুন',
      displayOrder: 17,
      isEnabled: true,
      badge: 'নিউজলেটার',
      viewAllUrl: null,
    },
  ];

  for (const sec of defaultSections) {
    await prisma.homepageSection.upsert({
      where: { sectionKey: sec.sectionKey },
      update: {},
      create: sec,
    });
    console.log('Seeded HomepageSection:', sec.sectionKey);
  }

  console.log('✅ Homepage CMS & Hero Slides Seeded Successfully!');
}

seedHomepageCms()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

