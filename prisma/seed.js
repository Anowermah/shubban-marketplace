const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Shubban Library database...');

  // 1. Password hash
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const userPassword = await bcrypt.hash('reader123', salt);
  const subPassword = await bcrypt.hash('sub123', salt);
  const authorPassword = await bcrypt.hash('author123', salt);

  // 2. Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shubban.com' },
    update: {},
    create: {
      email: 'admin@shubban.com',
      passwordHash: adminPassword,
      name: 'মুহাম্মদ আব্দুল্লাহ',
      phone: '01711000001',
      role: 'SUPER_ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      bio: 'প্রধান নির্বাহী ও প্রধান সম্পাদক, শুব্বান লাইব্রেরী।',
      isVerified: true,
      membershipTier: 'PREMIUM',
    },
  });

  const member = await prisma.user.upsert({
    where: { email: 'reader@shubban.com' },
    update: {},
    create: {
      email: 'reader@shubban.com',
      passwordHash: userPassword,
      name: 'তানভীর হাসান',
      phone: '01811000002',
      role: 'REGISTERED_MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      bio: 'বইপ্রেমী ও তরুণ গবেষক।',
      isVerified: true,
      membershipTier: 'FREE',
    },
  });

  const paidMember = await prisma.user.upsert({
    where: { email: 'subscriber@shubban.com' },
    update: {},
    create: {
      email: 'subscriber@shubban.com',
      passwordHash: subPassword,
      name: 'ফারহানা আহমেদ',
      phone: '01911000003',
      role: 'PAID_MEMBER',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      bio: 'সাহিত্য অনুরাগী ও ডিজিটাল লাইব্রেরীর নিয়মিত পাঠক।',
      isVerified: true,
      membershipTier: 'DIGITAL',
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const authorUser = await prisma.user.upsert({
    where: { email: 'author@shubban.com' },
    update: {},
    create: {
      email: 'author@shubban.com',
      passwordHash: authorPassword,
      name: 'ড. মুহম্মদ এহসানুল কবির',
      phone: '01611000004',
      role: 'AUTHOR',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      bio: 'সাহিত্য গবেষক, অধ্যাপক ও প্রাবন্ধিক।',
      isVerified: true,
      membershipTier: 'PREMIUM',
    },
  });

  // 3. Categories
  const categoriesData = [
    { name: 'সাহিত্য ও গল্প', nameEn: 'Literature & Fiction', slug: 'literature', description: 'চিরায়ত ও আধুনিক বাংলা সাহিত্য, গল্প এবং সৃজনশীল লেখালেখি।' },
    { name: 'উপন্যাস', nameEn: 'Novel', slug: 'novel', description: 'দেশি ও বিদেশি অনুবাদ সমৃদ্ধ উপন্যাস।' },
    { name: 'কবিতা', nameEn: 'Poetry', slug: 'poetry', description: 'অনবদ্য ছন্দ ও অনুভূতির কাব্য সংকলন।' },
    { name: 'ইতিহাস ও ঐতিহ্য', nameEn: 'History & Heritage', slug: 'history', description: 'বাংলার ইতিহাস, প্রাচীন সংস্কৃতি ও বিশ্ব ইতিহাসের কালপঞ্জি।' },
    { name: 'দর্শন ও চিন্তা', nameEn: 'Philosophy & Thought', slug: 'philosophy', description: 'প্রাচ্য ও পাশ্চাত্য দর্শন, চিন্তাভাবনা ও মননশীলতা।' },
    { name: 'বিজ্ঞান ও প্রযুক্তি', nameEn: 'Science & Technology', slug: 'science', description: 'মহাবিশ্ব, পদার্থবিজ্ঞান, জীববিদ্যা ও আধুনিক তথ্যপ্রযুক্তি।' },
    { name: 'ইসলামিক বই ও ঐতিহ্য', nameEn: 'Islamic Studies', slug: 'islamic', description: 'কুরআন, হাদিস, তাফসির, সীরাত ও ইসলামি জ্ঞানচর্চা।' },
    { name: 'জীবনী ও আত্মস্মৃতি', nameEn: 'Biography & Memoirs', slug: 'biography', description: 'বিশ্ববরেণ্য মনীষী ও বুদ্ধিজীবীদের জীবনগাথা।' },
    { name: 'শিশু-কিশোর সাহিত্য', nameEn: 'Children & Young Adult', slug: 'children', description: 'রূপকথা, রোমাঞ্চ, বিজ্ঞান কল্পকাহিনী ও শিক্ষণীয় গল্প।' },
    { name: 'গবেষণা ও শিক্ষামূলক', nameEn: 'Research & Academic', slug: 'research-academic', description: 'একাডেমিক গবেষণা, প্রবন্ধ, থিসিস ও গবেষণাপত্র।' },
    { name: 'আত্মউন্নয়ন ও মোটিভেশন', nameEn: 'Self Development', slug: 'self-help', description: 'ব্যক্তিত্ব বিকাশ, উৎপাদনশীলতা ও মানসিক শান্তি।' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    categories[cat.slug] = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  // 4. Authors
  const authorsData = [
    {
      name: 'রবীন্দ্রনাথ ঠাকুর',
      nameEn: 'Rabindranath Tagore',
      slug: 'rabindranath-tagore',
      bio: 'নোবেল বিজয়ী বিশ্বকবি, বাঙালি সাহিত্যের প্রাণপুরুষ।',
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'কাজী নজরুল ইসলাম',
      nameEn: 'Kazi Nazrul Islam',
      slug: 'kazi-nazrul-islam',
      bio: 'বাংলাদেশের জাতীয় কবি, বিদ্রোহী কবি ও মানবতার উদাত্ত কণ্ঠস্বর।',
      photoUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'ড. মুহম্মদ শহীদুল্লাহ',
      nameEn: 'Dr. Muhammad Shahidullah',
      slug: 'muhammad-shahidullah',
      bio: 'প্রখ্যাত বহুভাষাবিদ, শিক্ষাবিদ ও বাংলা সাহিত্যের অন্যতম শ্রেষ্ঠ গবেষক।',
      photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'জসীমউদ্দীন',
      nameEn: 'Jasimuddin',
      slug: 'jasimuddin',
      bio: 'পল্লীকবি হিসেবে খ্যাত, আবহমান বাংলার লোকজীবন ও প্রকৃতির রূপকার।',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'মীর মশাররফ হোসেন',
      nameEn: 'Mir Mosharraf Hossain',
      slug: 'mir-mosharraf-hossain',
      bio: 'বাংলা সাহিত্যের অগ্রণী মুসলিম ঔপন্যাসিক, প্রাবন্ধিক ও নাট্যকার।',
      photoUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400',
      isFeatured: false,
      isVerified: true,
    },
    {
      name: 'ড. আহমদ শরীফ',
      nameEn: 'Dr. Ahmed Sharif',
      slug: 'ahmed-sharif',
      bio: 'মধ্যযুগীয় বাংলা সাহিত্য ও সমাজচিন্তার দিকপাল পণ্ডিত ও প্রাবন্ধিক।',
      photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'ড. মুহম্মদ এহসানুল কবির',
      nameEn: 'Dr. Ehsanul Kabir',
      slug: 'dr-ehsanul-kabir',
      bio: 'সমকালীন সাহিত্য গবেষক, চিন্তাবিদ ও শুব্বান গবেষণা ফেলো।',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
      isFeatured: true,
      isVerified: true,
      userId: authorUser.id,
    },
  ];

  const authors = {};
  for (const a of authorsData) {
    authors[a.slug] = await prisma.author.upsert({
      where: { slug: a.slug },
      update: {},
      create: a,
    });
  }

  // 5. Publishers
  const publishersData = [
    {
      name: 'বাংলা একাডেমি',
      nameEn: 'Bangla Academy',
      slug: 'bangla-academy',
      description: 'বাংলাদেশের জাতীয় ভাষা ও সাহিত্যের শীর্ষ গবেষণা ও প্রকাশনা প্রতিষ্ঠান।',
      logoUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=150',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'ঐতিহ্য প্রকাশনী',
      nameEn: 'Oitijjho',
      slug: 'oitijjho',
      description: 'গুণগত সাহিত্য, প্রবন্ধ ও ক্লাসিক বইয়ের শীর্ষস্থানীয় বাংলাদেশি প্রকাশনা।',
      logoUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=150',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'ইসলামিক ফাউন্ডেশন বাংলাদেশ',
      nameEn: 'Islamic Foundation Bangladesh',
      slug: 'islamic-foundation',
      description: 'ইসলামি জ্ঞানবিজ্ঞান, অনুবাদ ও ধর্মীয় গবেষণা প্রকাশনা সংস্থা।',
      logoUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=150',
      isFeatured: true,
      isVerified: true,
    },
    {
      name: 'শুব্বান প্রকাশনা',
      nameEn: 'Shubban Publications',
      slug: 'shubban-publications',
      description: 'শুব্বান লাইব্রেরীর নিজস্ব মননশীল প্রকাশনা ও গবেষণা প্রতিষ্ঠান।',
      logoUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=150',
      isFeatured: true,
      isVerified: true,
    },
  ];

  const publishers = {};
  for (const p of publishersData) {
    publishers[p.slug] = await prisma.publisher.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }

  // 6. Books
  const booksData = [
    {
      title: 'গীতাঞ্জলি',
      titleEn: 'Gitanjali',
      slug: 'gitanjali',
      isbn: '978-984-07-5501-1',
      edition: 'পরিমার্জিত সংকলন',
      language: 'bn',
      pages: 184,
      bindingType: 'হার্ডকভার',
      description: 'রবীন্দ্রনাথ ঠাকুরের নোবেল বিজয়ী অমর কাব্যগ্রন্থ গীতাঞ্জলি। ভাবগাম্ভীর্য, ঈশ্বরপ্রেম ও প্রকৃতির অপার্থিব অনুভূতির সমন্বয়ে রচিত গান ও কবিতার অপূর্ব অর্ঘ্য।',
      synopsis: '১৯১০ সালে প্রকাশিত এই কাব্যগ্রন্থটি বাংলা সাহিত্যের চিরন্তন সম্পদ। এই সংস্করণে মূল পাণ্ডুলিপির প্রাসঙ্গিক ব্যাখ্যা এবং নোবেল পুরস্কারপ্রাপ্ত ইংরেজি অনুবাদের ঐতিহাসিক প্রেক্ষাপট সন্নিবেশিত রয়েছে।',
      toc: '১. আমার এ গান ছেড়েছে তার সকল অলঙ্কার\n২. যেখানে থাকে সবার অধম দীনের হতে দীন\n৩. সীমার মাঝে অসীম তুমি\n৪. ক্লান্তি আমায় ক্ষমা করো প্রভু\n৫. আনন্দেরই সাগর হতে এসেছে আজ বান',
      price: 350.0,
      discountPrice: 280.0,
      stockQuantity: 45,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: true, // Free PDF for readers
      coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600',
      samplePdfUrl: '/samples/sample-gitanjali.pdf',
      fullPdfUrl: '/samples/sample-gitanjali.pdf',
      pdfFileSize: '4.8 MB',
      authorSlug: 'rabindranath-tagore',
      publisherSlug: 'bangla-academy',
      categorySlug: 'poetry',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isEditorsPick: true,
      publishedYear: '১৯১০',
    },
    {
      title: 'অগ্নি-বীণা',
      titleEn: 'Agni-Veena',
      slug: 'agni-veena',
      isbn: '978-984-07-5502-8',
      edition: 'ঐতিহাসিক শতবর্ষ সংস্করণ',
      language: 'bn',
      pages: 120,
      bindingType: 'পেপারব্যাক',
      description: 'কাজী নজরুল ইসলামের যুগান্তকারী প্রথম কাব্যগ্রন্থ অগ্নি-বীণা। অত্যাচার ও শোষণের বিরুদ্ধে তীব্র বিদ্রোহ এবং স্বাধীনতার জয়গান।',
      synopsis: '১৯২২ সালে প্রকাশিত অগ্নি-বীণা বাংলা সাহিত্যের ইতিহাসে এক বিস্ফোরণসম ঘটনা। ‘বিদ্রোহী’, ‘প্রলয়োল্লাস’, ‘কামাল পাশা’ সহ বারোটি অমর কবিতার এই সংকলন চিরকাল তরুণদের উদ্বেলিত করে।',
      toc: '১. প্রলয়োল্লাস\n২. বিদ্রোহী\n৩. রক্তাম্বর-ধারিণী মা\n৪. আগমনী\n৫. ধূমকেতু\n৬. কামাল পাশা\n৭. আনোয়ার\n৮. রণভেরী',
      price: 260.0,
      discountPrice: 210.0,
      stockQuantity: 32,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: true,
      coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
      samplePdfUrl: '/samples/sample-agniveena.pdf',
      fullPdfUrl: '/samples/sample-agniveena.pdf',
      pdfFileSize: '3.2 MB',
      authorSlug: 'kazi-nazrul-islam',
      publisherSlug: 'oitijjho',
      categorySlug: 'poetry',
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isEditorsPick: true,
      publishedYear: '১৯২২',
    },
    {
      title: 'বাঙ্গালা ভাষার ইতিবৃত্ত',
      titleEn: 'History of Bengali Language',
      slug: 'bangala-bhashar-itivritta',
      isbn: '978-984-07-4200-4',
      edition: 'একাদশ পরিবর্ধিত সংস্করণ',
      language: 'bn',
      pages: 310,
      bindingType: 'হার্ডকভার',
      description: 'ড. মুহম্মদ শহীদুল্লাহর কালজয়ী ভাষাতাত্ত্বিক গবেষণাগ্রন্থ। বাংলা ভাষার উৎপত্তি, ধ্বনিতত্ত্ব, রূপতত্ত্ব ও প্রাচীন নিদর্শনসমূহের বৈজ্ঞানিক বিশ্লেষণ।',
      synopsis: 'বাংলা ভাষার মূল উৎস গৌড়ী প্রাকৃতের বিজ্ঞানসম্মত আলোচনা ও চর্যাপদের ভাষা বিচার নিয়ে গ্রন্থটি আধুনিক ভাষাতত্ত্বের এক অবশ্যপাঠ্য স্মারকগ্রন্থ।',
      toc: 'প্রথম অধ্যায়: ভাষার আদি উৎস ও ইন্দো-ইউরোপীয় শাখা\nদ্বিতীয় অধ্যায়: মাগধী ও গৌড়ী প্রাকৃতের বিবর্তন\nতৃতীয় অধ্যায়: প্রাচীন ও মধ্য বাংলা ভাষার ব্যাকরণিক গঠন\nচতুর্থ অধ্যায়: চর্যাপদের ভাষাতাত্ত্বিক মূল্যায়ন',
      price: 450.0,
      discountPrice: 380.0,
      stockQuantity: 18,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: false, // Premium Digital
      coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600',
      samplePdfUrl: '/samples/sample-bhasha.pdf',
      fullPdfUrl: '/samples/sample-bhasha.pdf',
      pdfFileSize: '8.4 MB',
      authorSlug: 'muhammad-shahidullah',
      publisherSlug: 'bangla-academy',
      categorySlug: 'research-academic',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isEditorsPick: true,
      publishedYear: '১৯৫৮',
    },
    {
      title: 'নকশী কাঁথার মাঠ',
      titleEn: 'Field of the Embroidered Quilt',
      slug: 'nakshi-kanthar-math',
      isbn: '978-984-07-3101-5',
      edition: 'ষোড়শ সংস্করণ',
      language: 'bn',
      pages: 144,
      bindingType: 'পেপারব্যাক',
      description: 'পল্লীকবি জসীমউদ্দীনের সুবিখ্যাত অমর আখ্যানকাব্য। রূপাই ও সাজুর নিবিড় প্রেম ও বিরহের ট্র্যাজিক গাথা।',
      synopsis: 'বাংলার লোকজীবনের রূপ, সংস্কৃতি, প্রেম ও শোকের নিপুণ আল্পনায় আঁকা এই গীতিকাব্যটি বিশ্বসাহিত্যের বহু ভাষায় অনূদিত ও সমাদৃত হয়েছে।',
      toc: 'ক্যান্টো ১: রূপাইয়ের পরিচয়\nক্যান্টো ২: সাজুর রূপলাবণ্য\nক্যান্টো ৩: বনবিলাসী মিলন\nক্যান্টো ৪: দাঙ্গার প্রলয়\nক্যান্টো ৫: বিচ্ছেদ ও নকশী কাঁথার অন্তিম সুর',
      price: 220.0,
      discountPrice: 190.0,
      stockQuantity: 50,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: true,
      coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
      samplePdfUrl: '/samples/sample-nakshi.pdf',
      fullPdfUrl: '/samples/sample-nakshi.pdf',
      pdfFileSize: '3.6 MB',
      authorSlug: 'jasimuddin',
      publisherSlug: 'oitijjho',
      categorySlug: 'literature',
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      isEditorsPick: false,
      publishedYear: '১৯২৯',
    },
    {
      title: 'বিষাদ সিন্ধু',
      titleEn: 'Bishad Shindhu',
      slug: 'bishad-shindhu',
      isbn: '978-984-07-2800-8',
      edition: 'অখন্ড পরিমার্জিত সংস্করণ',
      language: 'bn',
      pages: 520,
      bindingType: 'রয়াল হার্ডকভার',
      description: 'মীর মশাররফ হোসেনের ঐতিহাসিক মহাকাব্যিক উপন্যাস। কারবালার হৃদয়বিদারক ট্র্যাজেডি ও ইসলামের আদি ইতিহাসের ওপর ভিত্তি করে রচিত ক্লাসিক।',
      synopsis: '১৮৮৫ থেকে ১৮৯১ সালের মধ্যে তিন খণ্ডে প্রকাশিত এই উপন্যাস বাংলা গদ্যের এক ঐতিহাসিক মাইলফলক হিসেবে সমাদৃত।',
      toc: 'প্রথম পর্ব: মহরম পর্ব\nদ্বিতীয় পর্ব: উদ্ধার পর্ব\nতৃতীয় পর্ব: এজিদ বধ পর্ব',
      price: 680.0,
      discountPrice: 550.0,
      stockQuantity: 24,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: false,
      coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600',
      samplePdfUrl: '/samples/sample-bishad.pdf',
      fullPdfUrl: '/samples/sample-bishad.pdf',
      pdfFileSize: '12.5 MB',
      authorSlug: 'mir-mosharraf-hossain',
      publisherSlug: 'oitijjho',
      categorySlug: 'history',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: false,
      isEditorsPick: true,
      publishedYear: '১৮৮৫',
    },
    {
      title: 'মুসলিম বাংলার ঐতিহ্য ও জ্ঞানসাধনা',
      titleEn: 'Tradition and Intellectual Quest of Muslim Bengal',
      slug: 'tradition-and-intellectual-quest',
      isbn: '978-984-07-9911-3',
      edition: 'প্রথম সংস্করণ',
      language: 'bn',
      pages: 380,
      bindingType: 'হার্ডকভার',
      description: 'মধ্যযুগ থেকে আধুনিক কাল পর্যন্ত বাংলায় ইসলামি জ্ঞানচর্চা, মাদ্রাসা শিক্ষা ও সাহিত্যিক অবদান নিয়ে উচ্চমানের গবেষণামূলক সংকলন।',
      synopsis: 'বাংলার সুফিবাদ, অনুবাদ সাহিত্য, পুঁথিসাহিত্য এবং আধুনিক জাতীয়তাবাদী জাগরণে মুসলিম বুদ্ধিজীবীদের ভূমিকা গ্রন্থটিতে তথ্যভিত্তিক নিরপেক্ষতায় উপস্থাপিত হয়েছে।',
      toc: 'প্রথম ভাগ: বাংলার সুলতানি যুগে জ্ঞানচর্চা\nদ্বিতীয় ভাগ: ফারসি ও আরবি গ্রন্থের বাংলা অনুবাদ ঐতিহ্য\nতৃতীয় ভাগ: উনিশ ও বিশ শতকে আধুনিক প্রকাশনা ও পত্রিকা আন্দোলন',
      price: 520.0,
      discountPrice: 440.0,
      stockQuantity: 15,
      isPhysicalAvailable: true,
      isDigitalAvailable: true,
      isFree: false,
      coverImage: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=600',
      samplePdfUrl: '/samples/sample-tradition.pdf',
      fullPdfUrl: '/samples/sample-tradition.pdf',
      pdfFileSize: '9.2 MB',
      authorSlug: 'dr-ehsanul-kabir',
      publisherSlug: 'shubban-publications',
      categorySlug: 'islamic',
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      isEditorsPick: true,
      publishedYear: '২০২৪',
    },
  ];

  for (const b of booksData) {
    const author = authors[b.authorSlug];
    const publisher = publishers[b.publisherSlug];
    const category = categories[b.categorySlug];

    const book = await prisma.book.upsert({
      where: { slug: b.slug },
      update: {},
      create: {
        title: b.title,
        titleEn: b.titleEn,
        slug: b.slug,
        isbn: b.isbn,
        edition: b.edition,
        language: b.language,
        pages: b.pages,
        bindingType: b.bindingType,
        description: b.description,
        synopsis: b.synopsis,
        toc: b.toc,
        price: b.price,
        discountPrice: b.discountPrice,
        stockQuantity: b.stockQuantity,
        isPhysicalAvailable: b.isPhysicalAvailable,
        isDigitalAvailable: b.isDigitalAvailable,
        isFree: b.isFree,
        coverImage: b.coverImage,
        samplePdfUrl: b.samplePdfUrl,
        fullPdfUrl: b.fullPdfUrl,
        pdfFileSize: b.pdfFileSize,
        authorId: author.id,
        publisherId: publisher ? publisher.id : null,
        categoryId: category.id,
        isFeatured: b.isFeatured,
        isBestSeller: b.isBestSeller,
        isNewArrival: b.isNewArrival,
        isEditorsPick: b.isEditorsPick,
        publishedYear: b.publishedYear,
      },
    });

    // Seed a couple of verified reviews
    await prisma.review.create({
      data: {
        bookId: book.id,
        userId: member.id,
        rating: 5,
        comment: 'অসাধারণ প্রকাশনা ও ঝকঝকে ছাপা। শুব্বান লাইব্রেরীতে এমন দুর্লভ বইয়ের ডিজিটাল সংস্করণ পেয়ে আমি আনন্দিত!',
        isVerified: true,
      },
    });
  }

  // 7. Magazines & Periodicals ("পত্রিকা ও সাময়িকী")
  const magazine1 = await prisma.magazine.upsert({
    where: { slug: 'shubban-sahitya-darshan' },
    update: {},
    create: {
      title: 'শুব্বান সাহিত্য ও দর্শন সাময়িকী',
      titleEn: 'Shubban Journal of Literature & Philosophy',
      slug: 'shubban-sahitya-darshan',
      frequency: 'MONTHLY',
      description: 'মননশীল সাহিত্য, দর্শন, গভীর সমাজতাত্ত্বিক আলোচনা ও সমালোচনাধর্মী মাসিক প্রকাশনা।',
      coverImage: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=600',
      publisherId: publishers['shubban-publications'].id,
      categoryId: categories['philosophy'].id,
      isFeatured: true,
    },
  });

  const magazine2 = await prisma.magazine.upsert({
    where: { slug: 'naba-chetana' },
    update: {},
    create: {
      title: 'নবচেতনা',
      titleEn: 'Naba Chetana Weekly',
      slug: 'naba-chetana',
      frequency: 'WEEKLY',
      description: 'সমকালীন সমাজ, রাষ্ট্রবিজ্ঞান, বিশ্বচিন্তা ও সাহিত্য পর্যালোচনার সাপ্তাহিক সাময়িকী।',
      coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600',
      publisherId: publishers['shubban-publications'].id,
      categoryId: categories['literature'].id,
      isFeatured: true,
    },
  });

  // Magazine Issues
  await prisma.publicationIssue.createMany({
    data: [
      {
        magazineId: magazine1.id,
        issueTitle: 'বর্ষ ১, সংখ্যা ৫ — আধুনিকতা ও ঐতিহ্য বিতর্ক',
        volume: '১ম বর্ষ',
        issueNumber: '৫ম সংখ্যা',
        publicationDate: new Date('2026-09-01'),
        coverImage: 'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=600',
        pdfUrl: '/samples/magazine-shubban-vol1-issue5.pdf',
        fileSize: '6.4 MB',
        summary: 'আধুনিকতার অভিঘাত ও পূর্বদেশীয় আত্মপরিচয়ের অন্বেষণ নিয়ে বিশদ সম্পাদকীয় ও প্রবন্ধ সংকলন।',
        toc: '১. সম্পাদকীয়: আমাদের মননের ভবিষ্যৎ\n২. প্রাচ্য দর্শন বনাম আধুনিক যন্ত্রসভ্যতা — ড. আহমদ শরীফ\n৩. কবিতার আধুনিকায়ন ও বাংলা ছন্দধারা — আলোচনা\n৪. বুক রিভিউ: নতুন দিনের গবেষণা',
        isFree: true,
        price: 0,
      },
      {
        magazineId: magazine1.id,
        issueTitle: 'বর্ষ ১, সংখ্যা ৪ — ক্লাসিক সাহিত্যের পুনর্বিচার',
        volume: '১ম বর্ষ',
        issueNumber: '৪র্থ সংখ্যা',
        publicationDate: new Date('2026-08-01'),
        coverImage: 'https://images.unsplash.com/photo-1507842229451-797199719627?w=600',
        pdfUrl: '/samples/magazine-shubban-vol1-issue4.pdf',
        fileSize: '5.9 MB',
        summary: 'বাংলা উপন্যাস ও উনিশ শতকের রেনেসাঁর নবমূল্যায়ন বিষয়ক বিশেষ সংখ্যা।',
        toc: '১. রেনেসাঁ ও বাংলা গদ্যের উন্মেষ\n২. বঙ্কিম-রবীন্দ্র উত্তরাধিকার\n৩. কথাসাহিত্যে লোকায়ত জীবন',
        isFree: false,
        price: 50.0,
      },
      {
        magazineId: magazine2.id,
        issueTitle: 'সাপ্তাহিক নবচেতনা — সংখ্যা ১০২ (অক্টোবর ২০২৬)',
        volume: '২য় বর্ষ',
        issueNumber: '১০২',
        publicationDate: new Date('2026-10-15'),
        coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600',
        pdfUrl: '/samples/weekly-nabachetana-102.pdf',
        fileSize: '4.1 MB',
        summary: 'ডিজিটাল গ্রন্থাগার বিপ্লব, মুক্ত তথ্যের অধিকার ও সমকালীন প্রকাশনা শিল্পের সংকট।',
        toc: '১. প্রধান ফিচার: ডিজিটাল যুগে পড়ার অভ্যাস\n২. অর্থনীতি ও মুদ্রাস্ফীতির অভিঘাত\n৩. পরিবেশ সংকট ও জলবায়ু আদালত',
        isFree: true,
        price: 0,
      },
    ],
  });

  // 8. Articles & Essays ("প্রবন্ধ ও নিবন্ধ")
  const articlesData = [
    {
      title: 'আধুনিক বাংলা সাহিত্যে মননশীলতার ধারা ও বর্তমান সংকট',
      slug: 'intellectual-tradition-in-modern-bengali-literature',
      content: `বাংলা সাহিত্যের হাজার বছরের যাত্রায় মননশীল প্রবন্ধ ও সাহিত্যতাত্ত্বিক আলোচনা এক অনন্য স্তম্ভ। চর্যাকারদের সান্ধ্যভাষার রূপকাশ্রয়ী গভীরতা থেকে শুরু করে রামমোহন, বিদ্যাসাগর, অক্ষয়কুমার দত্ত এবং বঙ্কিমচন্দ্রের যুক্তিবাদী গদ্য আমাদের জাতিকে চিন্তা করতে শিখিয়েছে।

রবীন্দ্রনাথ ঠাকুর তাঁর প্রবন্ধাবলিতে বিশ্বমানবের সঙ্গে বাঙালি হৃদয়ের সংযোগ ঘটিয়েছিলেন। অন্যদিকে প্রমথ চৌধুরী গদ্যে শাণিত করেছিলেন তীক্ষ্ণ বিদ্রূপ ও স্বকীয় মেধা। কিন্তু আজ একবিংশ শতাব্দীর তথ্যবিস্ফোরণ ও অগভীর সামাজিক মাধ্যমের যুগে আমাদের মননশীল চিন্তাচর্চায় কি ভাটা পড়ছে?

একটি গভীর গ্রন্থ পাঠের জন্য যে অখণ্ড মনোযোগ, ধৈর্য ও নিবিড় ভাবনার প্রয়োজন, তা আজ খণ্ডিত মনোযোগের সংস্কৃতিতে হারিয়ে যেতে বসেছে। এই সংকট কেবল সাহিত্যের নয়, একটি জাতির আত্মবিকাশের মৌলিক সংকট। শুব্বান লাইব্রেরীর মতো জ্ঞানচর্চার উদ্যোগ সেই হারিয়ে যাওয়া গভীরতাকে ফিরিয়ে আনার শপথ গ্রহণ করে।`,
      excerpt: 'তথ্যবিস্ফোরণ ও অগভীর সামাজিক মাধ্যমের যুগে মননশীল চিন্তাচর্চায় ভাটা পড়া এবং বাংলা প্রবন্ধ সাহিত্যের সংকট নিয়ে একটি গভীর বিশ্লেষণ।',
      type: 'ESSAY',
      status: 'PUBLISHED',
      authorSlug: 'dr-ehsanul-kabir',
      categorySlug: 'literature',
      readingTime: 6,
      views: 342,
      isFeatured: true,
      coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800',
    },
    {
      title: 'ইসলামি স্বর্ণযুগের গ্রন্থাগারসমূহ: জ্ঞানচর্চার বিশ্বজনীন আলোকবর্তিকা',
      slug: 'libraries-of-islamic-golden-age',
      content: `অষ্টম থেকে চতুর্দশ শতাব্দী পর্যন্ত বিশ্ব ইতিহাসের যে কালখণ্ডটি ইসলামি স্বর্ণযুগ হিসেবে চিহ্নিত, তার কেন্দ্রীয় স্তম্ভ ছিল গ্রন্থাগার ব্যবস্থা। বাগদাদের 'বায়তুল হিকমাহ' (House of Wisdom), কর্ডোভার রাজকীয় গ্রন্থাগার এবং কায়রোর দারুল ইলম ছিল একাধারে অনুবাদ কেন্দ্র, মানমন্দির ও পৃথিবীর শ্রেষ্ঠ পণ্ডিতদের মিলনমেলা।

বায়তুল হিকমাহে গ্রিক, সংস্কৃত, সুরিয়ানি ও ফারসি ভাষার বৈজ্ঞানিক ও দার্শনিক গ্রন্থসমূহ আরবিতে অনূদিত হয়। জ্ঞানকে এখানে কোনো ভৌগোলিক বা জাতিগত সীমানায় আবদ্ধ রাখা হয়নি। পণ্ডিতরা রাজকীয় পৃষ্ঠপোষকতা পেতেন, এবং প্রতিটি মূল্যবান অনুবাদের বিনিময়ে স্বর্ণমুদ্রায় পারিশ্রমিক দেয়া হতো।

আজকের উন্মুক্ত ডিজিটাল লাইব্রেরীর যে স্বপ্ন আমরা দেখি, তার আদি বীজ রোপিত হয়েছিল এই মহৎ গ্রন্থাগারগুলোতেই। জ্ঞান যখন সবার জন্য অবারিত হয়, তখনই মানবসভ্যতা তার সর্বোচ্চ শিখরে পৌঁছাতে পারে।`,
      excerpt: 'বাগদাদের বায়তুল হিকমাহ থেকে কর্ডোভার রাজকীয় গ্রন্থাগার—মধ্যযুগে মানবসভ্যতার জ্ঞানবিপ্লবের ঐতিহাসিক ইতিবৃত্ত।',
      type: 'EDITORIAL',
      status: 'PUBLISHED',
      authorSlug: 'ahmed-sharif',
      categorySlug: 'history',
      readingTime: 8,
      views: 520,
      isFeatured: true,
      coverImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800',
    },
    {
      title: 'ডিজিটাল যুগে পুস্তকপঠনের রূপান্তর ও মনস্তত্ত্ব',
      slug: 'psychology-of-reading-in-digital-era',
      content: `মুদ্রিত বইয়ের স্পর্শ, কাগজের গন্ধ এবং পাতার শব্দ আমাদের মস্তিষ্কে যে সংবেদী স্মৃতি (Sensory Memory) তৈরি করে, ডিজিটাল স্ক্রিনে তা কতটুকু প্রতিস্থাপিত হয়? 

গবেষণায় দেখা গেছে, হাইপারটেক্সট ও নীল আলোর কারণে স্ক্রিনে পাঠের সময় মানুষ প্রায়শই স্কিমিং (দ্রুত চোখ বুলানো) পদ্ধতিতে পড়ে। কিন্তু হাইপার-ফোকাসড ইন্টারফেসে যদি বিজ্ঞাপনহীন, পরিষ্কার বাংলা ফন্ট ও সহজ পৃষ্ঠাশৈলী প্রদান করা যায়, তবে ডিজিটাল পাঠও মুদ্রিত বইয়ের মতোই গভীর অনুধাবন উপহার দিতে সক্ষম।`,
      excerpt: 'স্ক্রিনের আলো বনাম কাগজের স্পর্শ: আধুনিক মানুষের পড়ার অভ্যাস ও স্মৃতিশক্তির ওপর ডিজিটাল ডিভাইসের প্রভাব।',
      type: 'REVIEW',
      status: 'PUBLISHED',
      authorSlug: 'dr-ehsanul-kabir',
      categorySlug: 'philosophy',
      readingTime: 5,
      views: 290,
      isFeatured: false,
      coverImage: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
    },
  ];

  for (const art of articlesData) {
    const author = authors[art.authorSlug];
    const category = categories[art.categorySlug];

    await prisma.article.upsert({
      where: { slug: art.slug },
      update: {},
      create: {
        title: art.title,
        slug: art.slug,
        content: art.content,
        excerpt: art.excerpt,
        type: art.type,
        status: art.status,
        authorId: author.id,
        categoryId: category.id,
        readingTime: art.readingTime,
        views: art.views,
        isFeatured: art.isFeatured,
        coverImage: art.coverImage,
      },
    });
  }

  // 9. Research Papers & Presentations
  await prisma.researchPaper.upsert({
    where: { slug: 'charyapada-phonological-evolution' },
    update: {},
    create: {
      title: 'চর্যাপদের ধ্বনিতাত্ত্বিক বিবর্তন ও আধুনিক বাংলা ভাষার সংযোগসূত্র',
      slug: 'charyapada-phonological-evolution',
      abstract: 'এই গবেষণাপত্রটি হরপ্রসাদ শাস্ত্রী কর্তৃক নেপাল থেকে আবিষ্কৃত প্রাচীন বাংলা চর্যাপদের ছন্দ, ধ্বনিতাত্ত্বিক বৈশিষ্ট্য এবং আধুনিক বাংলা উপভাষার সাথে এর ধ্বনিগত রূপান্তর বৈজ্ঞানিক পদ্ধতিতে বিশ্লেষণ করেছে। গবেষণায় দেখানো হয়েছে কীভাবে মাগধী অপভ্রংশ থেকে আদি বাংলার স্বর ও ব্যঞ্জনধ্বনি আধুনিক রূপ লাভ করেছে।',
      content: 'গবেষণার সম্পূর্ণ খসড়া ও ডেটাসেট সহ মূল প্রবন্ধ।',
      pdfUrl: '/samples/research-charyapada.pdf',
      doi: '10.5281/zenodo.shubban.2026.01',
      institution: 'ঢাকা বিশ্ববিদ্যালয় ও শুব্বান গবেষণা পরিষদ',
      field: 'বাংলা ভাষাতত্ত্ব ও প্রাচীন পাণ্ডুলিপি বিদ্যা',
      authorId: authors['muhammad-shahidullah'].id,
      citationText: 'Shahidullah, M. (2026). Phonological Evolution of Charyapada. Shubban Research Journal, 4(2), 45-78.',
      downloads: 148,
      isFeatured: true,
    },
  });

  await prisma.presentation.upsert({
    where: { slug: 'bangla-digital-preservation-slides' },
    update: {},
    create: {
      title: 'ডিজিটাল যুগে দুর্লভ বাংলা পাণ্ডুলিপি ও বই ডিজিটাইজেশন কৌশল',
      slug: 'bangla-digital-preservation-slides',
      description: 'আন্তর্জাতিক কনফারেন্সে উপস্থাপিত স্লাইড ডেক। প্রাচীন পাণ্ডুলিপির হাই-রেজোলিউশন স্ক্যানিং, অপটিক্যাল ক্যারেক্টার রিকগনিশন (OCR) এবং মেটাডাটা প্রমিতকরণ সম্পর্কিত প্রামাণ্য প্রেজেন্টেশন।',
      presenter: 'ড. মুহম্মদ এহসানুল কবির',
      institution: 'শুব্বান তথ্য ও ডিজিটাল লাইব্রেরী সেল',
      fileUrl: '/samples/slides-manuscript-digitization.pdf',
      fileType: 'PDF',
      slidesCount: 36,
      isFeatured: true,
    },
  });

  // 10. Q&A Community
  const question1 = await prisma.question.upsert({
    where: { slug: 'charyapada-discovery-and-significance' },
    update: {},
    create: {
      title: 'চর্যাপদ আবিষ্কারের ইতিহাস এবং বাংলা ভাষার আদি নিদর্শন হিসেবে এর ঐতিহাসিক গুরুত্ব কী?',
      slug: 'charyapada-discovery-and-significance',
      content: 'পণ্ডিত মহামহোপাধ্যায় হরপ্রসাদ শাস্ত্রী ১৯০৭ সালে নেপালের রাজদরবারের রয়েল লাইব্রেরি থেকে চর্যাচর্যবিনিশ্চয় আবিষ্কার করেছিলেন। বাংলা ভাষাভাষী পণ্ডিতদের মাঝে এর ভাষা নিয়ে কী ধরনের বিতর্ক ছিল এবং ড. সুনীতিকুমার চট্টোপাধ্যায় ও ড. মুহম্মদ শহীদুল্লাহ কীভাবে এর প্রাচীন বাংলা পরিচয় প্রমাণ করেন?',
      userId: member.id,
      categoryId: categories['history'].id,
      views: 180,
    },
  });

  await prisma.answer.create({
    data: {
      questionId: question1.id,
      userId: authorUser.id,
      content: `একটি অত্যন্ত গুরুত্বপূর্ণ প্রশ্ন। সংক্ষেপে প্রধান বিষয়গুলো তুলে ধরছি:

১. ১৯০৭ সালে মহামহোপাধ্যায় হরপ্রসাদ শাস্ত্রী নেপালের রয়্যাল লাইব্রেরি থেকে 'চর্যাচর্যবিনিশ্চয়' পুঁথিটি আবিষ্কার করেন এবং ১৯১৬ সালে বঙ্গীয় সাহিত্য পরিষদ থেকে ‘হাজার বছরের পুরাণ বাঙ্গালা ভাষায় রচিত বৌদ্ধ গান ও দোহা’ নামে প্রকাশ করেন।
২. এর ভাষা নিয়ে হিন্দি, অসমিয়া ও ওড়িয়া গবেষকদের মাঝে দাবি-পাল্টা দাবি ছিল।
৩. ১৯২৬ সালে ড. সুনীতিকুমার চট্টোপাধ্যায় তাঁর বিশ্ববিখ্যাত 'The Origin and Development of the Bengali Language' (ODBL) গ্রন্থে চর্যাপদের ব্যাকরণিক রূপ বিচার করে সন্দেহাতীতভাবে প্রমাণ করেন যে এটি প্রাচীন বাংলারই রূপ।
৪. পরবর্তীকালে ড. মুহম্মদ শহীদুল্লাহ তাঁর 'Buddhist Mystic Songs' গ্রন্থে এর রচনাকালকে সপ্তম থেকে দ্বাদশ শতাব্দীর মধ্যে নির্ধারণ করে এর আধ্যাত্মিক ও তাত্ত্বিক দিক আরও উন্মোচন করেন।`,
      isAccepted: true,
    },
  });

  // 11. Membership Plans
  const plansData = [
    {
      code: 'FREE',
      name: 'বিনামূল্যে সদস্যপদ',
      nameEn: 'Free Member',
      description: 'অ্যাকাউন্ট তৈরি করে মুক্ত বইয়ের পড়া ও সাধারণ কমিউনিটিতে অংশগ্রহণের জন্য উপযুক্ত।',
      priceMonthly: 0,
      priceYearly: 0,
      features: JSON.stringify([
        'সকল মুক্ত বইয়ের ইন-ব্রাউজার পড়া',
        'উন্মুক্ত পিডিএফ ডাউনলোড',
        'প্রশ্নোত্তর কমিউনিটিতে প্রশ্ন ও মতামত প্রদান',
        'পছন্দের বইয়ের উইশলিস্ট সংরক্ষণ',
        'নিউজলেটার ও সাহিত্য বিজ্ঞপ্তি',
      ]),
      isPopular: false,
    },
    {
      code: 'DIGITAL',
      name: 'ডিজিটাল পাঠক',
      nameEn: 'Digital Member',
      description: 'পুরো ডিজিটাল লাইব্রেরী ও সাময়িকীর অবারিত পাঠকক্ষে নিয়মিত জ্ঞানপ্রেমীদের জন্য।',
      priceMonthly: 199,
      priceYearly: 1990,
      features: JSON.stringify([
        'লাইব্রেরীর সমস্ত প্রিমিয়াম ডিজিটাল বই পড়ার অধিকার',
        'সাপ্তাহিক ও মাসিক পত্রিকার নতুন সংখ্যার তাত্ক্ষণিক অ্যাক্সেস',
        'অফলাইন পড়ার জন্য অনুমোদিত ডিজিটাল বই ডাউনলোড',
        'হাইলাইটস, ব্যক্তিগত নোটস এবং রিডিং প্রগ্রেস সিঙ্ক',
        'বিজ্ঞাপনমুক্ত শান্ত পাঠ অভিজ্ঞতা',
      ]),
      isPopular: true,
    },
    {
      code: 'PREMIUM',
      name: 'প্রিমিয়াম স্কলার',
      nameEn: 'Premium Scholar',
      description: 'গবেষক, লেখক ও একাডেমিশিয়ানদের জন্য সম্পূর্ণ ডিজিটাল আর্কাইভ ও বই ক্রয়ে বিশেষ ছাড়।',
      priceMonthly: 499,
      priceYearly: 4990,
      features: JSON.stringify([
        'ডিজিটাল লাইব্রেরীর সমস্ত সুযোগ-সুবিধা অন্তর্ভুক্ত',
        'সকল একাডেমিক গবেষণাপত্র ও কনফারেন্স স্লাইড ডাউনলোড',
        'শারীরিক বই ক্রয়ের ওপর নিয়মিত অতিরিক্ত ১০% ছাড়',
        'লেখক পোর্টালের মাধ্যমে নিজস্ব লেখা ও গবেষণা জমা দেওয়ার অগ্রাধিকার',
        'শুব্বান আন্তর্জাতিক সাহিত্য সেমিনার ও অনলাইন ওয়েবিনারে ফ্রি প্রবেশাধিকার',
      ]),
      isPopular: false,
    },
    {
      code: 'INSTITUTIONAL',
      name: 'প্রাতিষ্ঠানিক সদস্যপদ',
      nameEn: 'Institutional Member',
      description: 'বিশ্ববিদ্যালয়, কলেজ, গবেষণা প্রতিষ্ঠান ও কর্পোরেট পাঠাগারের জন্য উন্মুক্ত সুবিধা।',
      priceMonthly: 2999,
      priceYearly: 29990,
      features: JSON.stringify([
        'একত্রে ৫০ জন শিক্ষার্থী ও গবেষকের জন্য মাল্টি-ইউজার ড্যাশবোর্ড',
        'আইপি-ভিত্তিক বা প্রাতিষ্ঠানিক ডোমেন সরাসরি লগইন',
        'ডিজিটাল ক্যাটালগ ও গবেষণাপত্রের প্রাতিষ্ঠানিক ডেটাবেস রপ্তানি',
        'বিশেষ লাইব্রেরিয়ান কনসোল ও পঠন পরিসংখ্যান রিপোর্ট',
        '২৪/৭ বিশেষায়িত সাপোর্ট ও ডেডিকেটেড অ্যাকাউন্ট ম্যানেজার',
      ]),
      isPopular: false,
    },
  ];

  for (const pl of plansData) {
    await prisma.membershipPlan.upsert({
      where: { code: pl.code },
      update: {},
      create: pl,
    });
  }

  // 12. Coupons
  await prisma.coupon.upsert({
    where: { code: 'SHUBBAN10' },
    update: {},
    create: {
      code: 'SHUBBAN10',
      discountPct: 10,
      minAmount: 300,
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'BOIMELA2026' },
    update: {},
    create: {
      code: 'BOIMELA2026',
      discountAmt: 100,
      minAmount: 500,
      isActive: true,
    },
  });

  // 13. Site Settings
  const settings = [
    { key: 'site_title', value: 'শুব্বান লাইব্রেরী — বই, জ্ঞান ও মননশীলতার এক সমৃদ্ধ ঠিকানা' },
    { key: 'site_tagline', value: 'জ্ঞানচর্চার নতুন ঠিকানা — শুব্বান লাইব্রেরী' },
    { key: 'contact_email', value: 'info@shubbanlibrary.com' },
    { key: 'contact_phone', value: '+880 1711-000000' },
    { key: 'contact_address', value: 'বাংলাবাজার ও কাঁটাবন জ্ঞান চত্বর, ঢাকা, বাংলাদেশ' },
    { key: 'delivery_fee_inside_dhaka', value: '60' },
    { key: 'delivery_fee_outside_dhaka', value: '110' },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
