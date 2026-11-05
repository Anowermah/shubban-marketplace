const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Islamic Books Showcase...');

  // Ensure category exists
  let islamicCat = await prisma.category.findUnique({
    where: { slug: 'islamic' },
  });

  if (!islamicCat) {
    islamicCat = await prisma.category.create({
      data: {
        name: 'ইসলামিক বই ও ঐতিহ্য',
        nameEn: 'Islamic Books & Heritage',
        slug: 'islamic',
        description: 'কুরআন, হাদিস, সীরাত ও ইসলামিক জ্ঞানকোষের প্রামাণিক গ্রন্থ সম্ভার।',
      },
    });
  }

  // Ensure Publisher exists
  let islamicFoundation = await prisma.publisher.findUnique({
    where: { slug: 'islamic-foundation' },
  });

  if (!islamicFoundation) {
    islamicFoundation = await prisma.publisher.create({
      data: {
        name: 'ইসলামিক ফাউন্ডেশন বাংলাদেশ',
        nameEn: 'Islamic Foundation Bangladesh',
        slug: 'islamic-foundation',
        description: 'বাংলাদেশ সরকারের অধীনস্থ ইসলামিক গবেষণা ও প্রকাশনা প্রতিষ্ঠান।',
        isFeatured: true,
        isVerified: true,
      },
    });
  }

  // Authors
  const authorsData = [
    {
      name: 'আল্লামা সফিউর রহমান মুবারকপুরী',
      nameEn: 'Safiur Rahman Mubarakpuri',
      slug: 'safiur-rahman-mubarakpuri',
      bio: 'বিশ্ববিখ্যাত সীরাত গবেষক ও রাবেতায়ে আলমে ইসলামি সীরাত প্রতিযোগিতায় প্রথম পুরস্কারপ্রাপ্ত লেখক।',
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
      isFeatured: true,
    },
    {
      name: 'ইমাম ইমাদুদ্দীন ইবনে কাসীর (রহি.)',
      nameEn: 'Imam Ibn Kathir',
      slug: 'imam-ibn-kathir',
      bio: 'চিরায়ত তাফসীর, ইতিহাস ও হাদিস শাস্ত্রের মহান ইমাম ও মুফাসসির।',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
      isFeatured: true,
    },
    {
      name: 'ইমাম মুহিউদ্দীন আন-নববী (রহি.)',
      nameEn: 'Imam Al-Nawawi',
      slug: 'imam-al-nawawi',
      bio: 'হাদিস শাস্ত্র ও ফিকহের সুবিখ্যাত গবেষক ও রিয়াযুস সালেহীনের সংকলক।',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      isFeatured: true,
    },
    {
      name: 'ইমাম মুহাম্মদ বিন ইসমাইল আল-বুখারী',
      nameEn: 'Imam Al-Bukhari',
      slug: 'imam-al-bukhari',
      bio: 'হাদিস শাস্ত্রের অবিসংবাদিত শ্রেষ্ঠ ইমাম ও জামে সহীহ বুখারী সংকলক।',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      isFeatured: true,
    },
  ];

  const authorMap = {};
  for (const auth of authorsData) {
    const created = await prisma.author.upsert({
      where: { slug: auth.slug },
      update: auth,
      create: auth,
    });
    authorMap[auth.slug] = created.id;
  }

  // Books
  const islamicBooksData = [
    {
      title: 'আর-রাহীকুল মাখতূম (অনবদ্য সীরাত গ্রন্থ)',
      titleEn: 'Ar-Raheeq Al-Makhtum',
      slug: 'ar-raheeq-al-makhtum',
      isbn: '978-984-06-1234-1',
      edition: 'পরিমার্জিত সংকলন',
      language: 'bn',
      pages: 680,
      bindingType: 'Hardcover',
      description: 'রাবেতায়ে আলমে ইসলামি কর্তৃক আন্তর্জাতিক সীরাত প্রতিযোগিতায় ১১৮২টি গ্রন্থের মধ্যে প্রথম স্থান অধিকারী কালজয়ী সীরাতগ্রন্থ।',
      synopsis: 'রাসূলুল্লাহ (সা.)-এর পবিত্র জীবনের সূক্ষ্মাতিসূক্ষ্ম ঘটনাবলি, মক্কী ও মাদানী যুগের বাস্তব চিত্র এবং আদর্শিক জীবনের অতুলনীয় বিবরণ।',
      price: 650,
      discountPrice: 480,
      stockQuantity: 45,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: false,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500',
      authorId: authorMap['safiur-rahman-mubarakpuri'],
      publisherId: islamicFoundation.id,
      publishedYear: '২০২৩',
    },
    {
      title: 'তাফসীরে ইবনে কাসীর (১ম-১১শ খণ্ড সমগ্র)',
      titleEn: 'Tafsir Ibn Kathir Complete',
      slug: 'tafsir-ibn-kathir-complete',
      isbn: '978-984-06-1235-8',
      edition: 'প্রামাণ্য সংস্করণ',
      language: 'bn',
      pages: 1200,
      bindingType: 'Hardcover',
      description: 'কুরআনুল কারীমের সর্বাধিক গ্রহণযোগ্য ও প্রামাণিক তাফসীর গ্রন্থ। হাদিস ও আসার দ্বারা কুরআনের আয়াতের অনবদ্য ব্যাখ্যা।',
      synopsis: 'কুরআনের সাথে কুরআন এবং সহীহ হাদিসের মেলবন্ধনে রচিত সর্বজনশ্রদ্ধেয় ক্লাসিক তাফসীর।',
      price: 3200,
      discountPrice: 2450,
      stockQuantity: 20,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: false,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500',
      authorId: authorMap['imam-ibn-kathir'],
      publisherId: islamicFoundation.id,
      publishedYear: '২০২২',
    },
    {
      title: 'রিয়াযুস সালেহীন (হাদিস ও জীবন দর্শন)',
      titleEn: 'Riyad us-Saliheen',
      slug: 'riyad-us-saliheen-bangla',
      isbn: '978-984-06-1236-5',
      edition: 'পরিমার্জিত সংস্করণ',
      language: 'bn',
      pages: 850,
      bindingType: 'Hardcover',
      description: 'দৈনন্দিন জীবনে আমলযোগ্য সহীহ হাদিসের অন্যতম শ্রেষ্ঠ ও বহুল পঠিত নির্ভরযোগ্য সংকলন।',
      synopsis: 'আখলাক, শিষ্টাচার, আত্মশুদ্ধি ও ইবাদত সংক্রান্ত গুরুত্বপূর্ণ সহীহ হাদিসসমূহের বিষয়ভিত্তিক অনন্য সমাহার।',
      price: 780,
      discountPrice: 590,
      stockQuantity: 30,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: false,
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: true,
      coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=500',
      authorId: authorMap['imam-al-nawawi'],
      publisherId: islamicFoundation.id,
      publishedYear: '২০২৩',
    },
    {
      title: 'সহীহুল বুখারী (ইসলামিক ফাউন্ডেশন বঙ্গানুবাদ)',
      titleEn: 'Sahih Al-Bukhari Bangla',
      slug: 'sahih-al-bukhari-bangla',
      isbn: '978-984-06-1237-2',
      edition: 'বৃহৎ সংস্করণ',
      language: 'bn',
      pages: 1450,
      bindingType: 'Hardcover',
      description: 'পবিত্র কুরআনুল কারীমের পর মুসলিম উম্মাহর সর্বাধিক বিশুদ্ধ ও বিশুদ্ধতম হাদীস গ্রন্থ।',
      synopsis: 'ইমাম বুখারীর কালজয়ী সংকলন যা প্রতিটি মুসলিম গৃহের অপরিহার্য সম্পদ।',
      price: 1850,
      discountPrice: 1390,
      stockQuantity: 15,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: false,
      isFeatured: true,
      isNewArrival: false,
      isBestSeller: true,
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500',
      authorId: authorMap['imam-al-bukhari'],
      publisherId: islamicFoundation.id,
      publishedYear: '২০২৪',
    },
  ];

  for (const b of islamicBooksData) {
    await prisma.book.upsert({
      where: { slug: b.slug },
      update: {
        ...b,
        categoryId: islamicCat.id,
      },
      create: {
        ...b,
        categoryId: islamicCat.id,
      },
    });
  }

  console.log('Successfully seeded Islamic books showcase!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

