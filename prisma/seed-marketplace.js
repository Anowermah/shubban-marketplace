const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- সেলিং ও মার্কেটপ্লেস ডাটা সিডিং শুরু হচ্ছে ---');

  // 1. Create Sellers / Vendors
  const vendor1 = await prisma.vendor.upsert({
    where: { slug: 'shubban-official' },
    update: {},
    create: {
      name: 'শুব্বান সেন্ট্রাল বুকস্টোর ও প্রকাশনা',
      slug: 'shubban-official',
      legalName: 'Shubban Publications & Media Ltd.',
      email: 'store@shubban.com',
      phone: '01711000001',
      address: '৩৮/২ক বাংলাবাজার, ঢাকা-১১০০',
      city: 'ঢাকা',
      description: 'শুব্বান লাইব্রেরীর অফিশিয়াল ফ্ল্যাগশিপ প্রকাশনা ও বুকস্টোর। ১০০% আসল ও প্রামাণ্য গ্রন্থসম্ভার।',
      logoUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200',
      rating: 4.9,
      ratingCount: 148,
      status: 'APPROVED',
      isVerified: true,
      isFeatured: true,
      commissionRate: 8.0,
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { slug: 'maktabatul-azhar' },
    update: {},
    create: {
      name: 'মাকতাবাতুল আযহার',
      slug: 'maktabatul-azhar',
      legalName: 'Maktabatul Azhar Book House',
      email: 'azharbooks@shubban.com',
      phone: '01812000002',
      address: '১২ ইসলামিয়া মার্কেট, চকবাজার, ঢাকা',
      city: 'ঢাকা',
      description: 'ইসলামিক ক্লাসিকস, তাফসির, হাদিস ও প্রামাণ্য ফিকহি সাহিত্যের সমৃদ্ধ কেন্দ্র।',
      logoUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200',
      rating: 4.8,
      ratingCount: 86,
      status: 'APPROVED',
      isVerified: true,
      isFeatured: true,
      commissionRate: 10.0,
    },
  });

  const vendor3 = await prisma.vendor.upsert({
    where: { slug: 'darul-huda-lifestyle' },
    update: {},
    create: {
      name: 'দারুল হুদা ইসলামিক লাইফস্টাইল',
      slug: 'darul-huda-lifestyle',
      legalName: 'Darul Huda Halal Lifestyle Mart',
      email: 'darulhuda@shubban.com',
      phone: '01913000003',
      address: 'হাউজ ২৪, রোড ৭, ধানমন্ডি, ঢাকা',
      city: 'ঢাকা',
      description: 'প্রিমিয়াম হালাল সুবাস, প্রাকৃতিক মিসওয়াক, জায়নামাজ, প্রিমিয়াম তসবিহ ও লাইফস্টাইল কালেকশন।',
      logoUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200',
      bannerUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200',
      rating: 5.0,
      ratingCount: 94,
      status: 'APPROVED',
      isVerified: true,
      isFeatured: true,
      commissionRate: 12.0,
    },
  });

  console.log('✔ ৩টি ভেন্ডর স্টোর তৈরি হয়েছে।');

  // 2. Link existing books to vendors
  const allBooks = await prisma.book.findMany();
  for (let i = 0; i < allBooks.length; i++) {
    const assignedVendor = i % 2 === 0 ? vendor1.id : vendor2.id;
    await prisma.book.update({
      where: { id: allBooks[i].id },
      data: { vendorId: assignedVendor },
    });
  }
  console.log(`✔ ${allBooks.length}টি বই ভেন্ডরের সাথে সংযুক্ত হয়েছে।`);

  // 3. Create Wafilife-inspired Lifestyle Category & Products
  const lifestyleCat = await prisma.category.upsert({
    where: { slug: 'islamic-lifestyle' },
    update: {},
    create: {
      name: 'ইসলামিক লাইফস্টাইল ও আতর',
      nameEn: 'Islamic Lifestyle & Fragrances',
      slug: 'islamic-lifestyle',
      description: 'প্রিমিয়াম অ্যালকোহল-মুক্ত আতর, কাঠের তসবিহ, তুর্কি জায়নামাজ ও প্রাকৃতিক মিসওয়াক।',
      type: 'LIFESTYLE',
      icon: 'Sparkles',
    },
  });

  // Get default author / publisher for lifestyle items
  const defaultAuthor = await prisma.author.findFirst();

  const lifestyleProduct1 = await prisma.book.upsert({
    where: { slug: 'madina-oud-royal-attar' },
    update: {},
    create: {
      title: 'মদিনা রয়েল উদ — খাঁটি অ্যালকোহলমুক্ত আতর',
      titleEn: 'Madina Royal Oud Attar',
      slug: 'madina-oud-royal-attar',
      price: 650,
      discountPrice: 520,
      stockQuantity: 25,
      isPhysicalAvailable: true,
      isDigitalAvailable: false,
      isFree: false,
      coverImage: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=500',
      description: 'প্রাকৃতিক উদ ও কস্তুরীর সুবাসে প্রস্তুত অত্যন্ত দীর্ঘস্থায়ী ও স্নিগ্ধ প্রিমিয়াম হালাল সুবাস। নামাজ ও পবিত্র মাহফিলের উপযোগী।',
      synopsis: 'মদিনার সুবাসিত ঐতিহ্যের ছোঁয়ায় তৈরি রাজকীয় আতর। পোশাকে কোনো দাগ ফেলে না এবং ঘণ্টার পর ঘণ্টা সৌরভ বজায় রাখে।',
      categoryId: lifestyleCat.id,
      authorId: defaultAuthor.id,
      vendorId: vendor3.id,
      isFeatured: true,
      isBestSeller: true,
    },
  });

  // Add variants to lifestyle product
  await prisma.productVariant.upsert({
    where: { id: 'var-oud-6ml' },
    update: {},
    create: {
      id: 'var-oud-6ml',
      bookId: lifestyleProduct1.id,
      name: '৬ মিলি ক্রিস্টাল রোল-অন বোতল',
      sku: 'OUD-6ML',
      price: 520,
      stockQuantity: 15,
      attributes: JSON.stringify({ volume: '6ml', bottle: 'Crystal Roll-on' }),
    },
  });

  await prisma.productVariant.upsert({
    where: { id: 'var-oud-12ml' },
    update: {},
    create: {
      id: 'var-oud-12ml',
      bookId: lifestyleProduct1.id,
      name: '১২ মিলি লাক্সারি কাঠের বক্স প্যাক',
      sku: 'OUD-12ML',
      price: 950,
      stockQuantity: 10,
      attributes: JSON.stringify({ volume: '12ml', packaging: 'Wooden Gift Box' }),
    },
  });

  const lifestyleProduct2 = await prisma.book.upsert({
    where: { slug: 'turkish-embossed-jaynamaz' },
    update: {},
    create: {
      title: 'তুর্কি ভেলভেট এমবসড প্রিমিয়াম জায়নামাজ',
      titleEn: 'Turkish Velvet Embossed Prayer Rug',
      slug: 'turkish-embossed-jaynamaz',
      price: 850,
      discountPrice: 720,
      stockQuantity: 20,
      isPhysicalAvailable: true,
      isDigitalAvailable: false,
      isFree: false,
      coverImage: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?w=500',
      description: 'অত্যন্ত নরম, মসৃণ ও টেকসই ফোমযুক্ত তুর্কি ভেলভেট জায়নামাজ। দীর্ঘ সেজদা ও নামাজের জন্য আরামদায়ক।',
      categoryId: lifestyleCat.id,
      authorId: defaultAuthor.id,
      vendorId: vendor3.id,
      isFeatured: true,
    },
  });

  console.log('✔ ইসলামিক লাইফস্টাইল পণ্য ও ভ্যারিয়েন্ট তৈরি হয়েছে।');

  // 4. Create As-Sunnah Foundation Inspired Donation Campaigns
  const campaign1 = await prisma.donationCampaign.upsert({
    where: { slug: 'flood-relief-and-rehabilitation' },
    update: {},
    create: {
      title: 'বন্যাদুর্গতদের জরুরি খাদ্য সহায়তা ও স্থায়ী পুনর্বাসন তহবিল',
      titleEn: 'Emergency Flood Relief and Rehabilitation Fund',
      slug: 'flood-relief-and-rehabilitation',
      category: 'RELIEF',
      description: 'বন্যা উপদ্রুত অঞ্চলের ক্ষতিগ্রস্ত পরিবারগুলোর জন্য শুকনো খাবার, বিশুদ্ধ পানি, চিকিৎসা সহায়তা এবং ক্ষতিগ্রস্ত ঘরবাড়ি পুনর্নির্মাণ প্রকল্প।',
      story: 'বন্যার পানিতে ভেসে গেছে হাজারো মানুষের সাজানো সংসার। শিশু ও বৃদ্ধরা অনাহারে দিনাতিপাত করছে। শুব্বান চ্যারিটি উইং সরাসরি দুর্গম এলাকায় নৌকা ও ট্রলারযোগে ত্রাণ সামগ্রী পৌঁছে দিচ্ছে। আপনার ১০০ টাকার সদকাহ হতে পারে একজন অনাহারী শিশুর দিনের খাবার।',
      coverImage: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800',
      goalAmount: 5000000,
      raisedAmount: 2850000,
      donorCount: 1420,
      status: 'ACTIVE',
      isFeatured: true,
    },
  });

  const campaign2 = await prisma.donationCampaign.upsert({
    where: { slug: 'free-quran-distribution-project' },
    update: {},
    create: {
      title: 'চর ও পাহাড়ি অঞ্চলের শিক্ষার্থীদের মাঝে বিনামূল্যে কুরআন বিতরণ',
      titleEn: 'Free Quran Distribution for Rural Students',
      slug: 'free-quran-distribution-project',
      category: 'QURAN_DISTRIBUTION',
      description: 'অর্থের অভাবে যে সকল এতিম ও দরিদ্র শিক্ষার্থী কুরআন শরীফ সংগ্রহ করতে পারে না, তাদের হাতে প্রামাণ্য বাংলা অর্থসহ কুরআন পৌঁছে দেওয়া।',
      story: 'জ্ঞান ও হিদায়াতের আলো ছড়িয়ে দিতে শুব্বান লাইব্রেরী প্রতি বছর প্রত্যন্ত অঞ্চলের মাদ্রাসা ও স্কুলে বিনামূল্যে বিশুদ্ধ ছাপা ও অনুবাদের পবিত্র কুরআন উপহার দিয়ে থাকে। প্রতি কপি কুরআনের সার্বিক ব্যয় মাত্র ৩০০ টাকা।',
      coverImage: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800',
      goalAmount: 1000000,
      raisedAmount: 720000,
      donorCount: 850,
      status: 'ACTIVE',
      isFeatured: true,
    },
  });

  const campaign3 = await prisma.donationCampaign.upsert({
    where: { slug: 'safe-drinking-water-plant' },
    update: {},
    create: {
      title: 'উপকূলীয় অঞ্চলে সুপেয় পানির গভীর নলকূপ ও ওয়াটার প্ল্যান্ট স্থাপন',
      titleEn: 'Deep Tube-well & Clean Drinking Water Project',
      slug: 'safe-drinking-water-plant',
      category: 'WATER_WELL',
      description: 'লবণাক্ত ও আর্সেনিকযুক্ত এলাকায় অসহায় মানুষের জন্য দীর্ঘমেয়াদী সদকায়ে জারিয়া হিসেবে সুপেয় খাবার পানির ব্যবস্থা।',
      story: 'সাদাকাহর মধ্যে শ্রেষ্ঠ হলো পানির ব্যবস্থা করা (হাদিস)। উপকূলীয় খুলনা, সাতক্ষীরা ও বাগেরহাটের প্রত্যন্ত গ্রামে প্রতিদিন মাইলের পর মাইল হেঁটে খাবার পানি আনতে হয় মা-বোনদের। একটি গভীর নলকূপ শত শত মানুষের তৃষ্ণা নিবারণ করতে পারে।',
      coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800',
      goalAmount: 2500000,
      raisedAmount: 1800000,
      donorCount: 630,
      status: 'ACTIVE',
      isFeatured: true,
    },
  });

  console.log('✔ ৩টি চ্যারিটি ও সদকাহ ক্যাম্পেইন তৈরি হয়েছে।');

  // 5. Add Sample Donations & Receipts
  const donation1 = await prisma.donation.upsert({
    where: { donationNumber: 'DON-2026-001' },
    update: {},
    create: {
      donationNumber: 'DON-2026-001',
      campaignId: campaign1.id,
      donorName: 'মো. রফিকুল ইসলাম',
      donorEmail: 'rafiqul@example.com',
      donorPhone: '01711223344',
      isAnonymous: false,
      amount: 5000,
      paymentMethod: 'bkash',
      transactionId: 'TXN-BK-99882211',
      paymentStatus: 'PAID',
      receiptNumber: 'RCPT-2026-8810',
      notes: 'বন্যার্ত ভাই-বোনদের জন্য সামান্য সদকাহ। আল্লাহ কবুল করুন।',
    },
  });

  await prisma.donationReceipt.upsert({
    where: { receiptNumber: 'RCPT-2026-8810' },
    update: {},
    create: {
      receiptNumber: 'RCPT-2026-8810',
      donationId: donation1.id,
      donorName: 'মো. রফিকুল ইসলাম',
      campaignTitle: campaign1.title,
      amount: 5000,
      paymentMethod: 'bKash Mobile Banking',
      transactionId: 'TXN-BK-99882211',
      taxExemptInfo: 'শুব্বান ওয়েলফেয়ার ট্রাস্ট ও আস-সুন্নাহ সদকাহ ফান্ড স্বীকৃত দাতব্য অনুদান',
    },
  });

  // 6. Platform Commission Rules
  await prisma.commissionRule.upsert({
    where: { id: 'comm-default' },
    update: {},
    create: {
      id: 'comm-default',
      name: 'সাধারণ মার্কেটপ্লেস কমিশন',
      percentage: 10.0,
      description: 'বই ও সাধারণ প্রকাশনার উপর প্ল্যাটফর্ম স্ট্যান্ডার্ড কমিশন (১০%)',
      isActive: true,
    },
  });

  await prisma.commissionRule.upsert({
    where: { id: 'comm-lifestyle' },
    update: {},
    create: {
      id: 'comm-lifestyle',
      name: 'লাইফস্টাইল ও আতর পণ্য কমিশন',
      categorySlug: 'islamic-lifestyle',
      percentage: 12.0,
      description: 'আতর ও লাইফস্টাইল ক্যাটাগরির জন্য ১২% কমিশন',
      isActive: true,
    },
  });

  console.log('✔ প্ল্যাটফর্ম কমিশন রুলস ও অনুদান রসিদ তৈরি হয়েছে।');
  console.log('--- সিডিং সফলভাবে সম্পন্ন হয়েছে! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

