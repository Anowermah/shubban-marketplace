const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Setting up nested categories and rich catalog data...');

  // 1. Get primary parent categories
  const litCat = await prisma.category.findUnique({ where: { slug: 'literature' } });
  const islamicCat = await prisma.category.findUnique({ where: { slug: 'islamic' } });
  const lifestyleCat = await prisma.category.findUnique({ where: { slug: 'islamic-lifestyle' } });

  // 2. Set literature subcategories
  if (litCat) {
    await prisma.category.updateMany({
      where: { slug: { in: ['novel', 'poetry', 'children'] } },
      data: { parentId: litCat.id },
    });
  }

  // 3. Create or update Islamic subcategories
  const islamicSubs = [
    {
      name: 'কুরআন ও তাফসীর',
      nameEn: 'Quran & Tafsir',
      slug: 'quran-tafsir',
      description: 'প্রামাণ্য তাফসীর ও উলূমুল কুরআন সংকলন।',
      parentId: islamicCat.id,
    },
    {
      name: 'হাদিস ও সুন্নাহ',
      nameEn: 'Hadith & Sunnah',
      slug: 'hadith-sunnah',
      description: 'সিহাহ সিত্তাহ ও সহীহ হাদিস গ্রন্থসমূহ।',
      parentId: islamicCat.id,
    },
    {
      name: 'সীরাত ও ইতিহাস',
      nameEn: 'Seerah & Islamic History',
      slug: 'seerah-history',
      description: 'নবীজীবন ও সোনালী মুসলিম ইতিহাস।',
      parentId: islamicCat.id,
    },
    {
      name: 'ফিকহ ও ফতোয়া',
      nameEn: 'Fiqh & Fatawa',
      slug: 'fiqh-rulings',
      description: 'দৈনন্দিন জীবনের শরিয়াহ বিধান ও মাসআলা।',
      parentId: islamicCat.id,
    },
  ];

  const subCatMap = {};
  for (const sub of islamicSubs) {
    const created = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, nameEn: sub.nameEn, parentId: sub.parentId },
      create: sub,
    });
    subCatMap[sub.slug] = created.id;
  }

  // 4. Create or update Lifestyle subcategories
  const lifestyleSubs = [
    {
      name: 'প্রিমিয়াম আতর ও সুগন্ধি',
      nameEn: 'Premium Attar & Fragrance',
      slug: 'attar-fragrance',
      description: 'অ্যালকোহলমুক্ত প্রাকৃতিক সুগন্ধি ও আতর।',
      type: 'LIFESTYLE',
      parentId: lifestyleCat.id,
    },
    {
      name: 'জায়নামাজ ও তসবিহ',
      nameEn: 'Prayer Rugs & Tasbeeh',
      slug: 'jaynamaz-tasbeeh',
      description: 'তুর্কি ভেলভেট জায়নামাজ ও প্রিমিয়াম তসবিহ।',
      type: 'LIFESTYLE',
      parentId: lifestyleCat.id,
    },
  ];

  for (const sub of lifestyleSubs) {
    const created = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: { name: sub.name, nameEn: sub.nameEn, parentId: sub.parentId, type: 'LIFESTYLE' },
      create: sub,
    });
    subCatMap[sub.slug] = created.id;
  }

  // 5. Get vendors
  const shubbanVendor = await prisma.vendor.findUnique({ where: { slug: 'shubban-official' } });
  const maktabatVendor = await prisma.vendor.findUnique({ where: { slug: 'maktabatul-azhar' } });
  const darulHudaVendor = await prisma.vendor.findUnique({ where: { slug: 'darul-huda-lifestyle' } });

  // 6. Assign books to specific subcategories and vendors
  // Tafsir -> quran-tafsir
  await prisma.book.updateMany({
    where: { slug: 'tafsir-ibn-kathir-complete' },
    data: {
      categoryId: subCatMap['quran-tafsir'],
      vendorId: shubbanVendor ? shubbanVendor.id : undefined,
    },
  });

  // Hadith -> hadith-sunnah
  await prisma.book.updateMany({
    where: { slug: { in: ['sahih-al-bukhari-bangla', 'riyad-us-saliheen-bangla'] } },
    data: {
      categoryId: subCatMap['hadith-sunnah'],
      vendorId: maktabatVendor ? maktabatVendor.id : undefined,
    },
  });

  // Seerah -> seerah-history
  await prisma.book.updateMany({
    where: { slug: 'ar-raheeq-al-makhtum' },
    data: {
      categoryId: subCatMap['seerah-history'],
      vendorId: shubbanVendor ? shubbanVendor.id : undefined,
    },
  });

  // Attar -> attar-fragrance
  await prisma.book.updateMany({
    where: { slug: 'madina-oud-royal-attar' },
    data: {
      categoryId: subCatMap['attar-fragrance'],
      vendorId: darulHudaVendor ? darulHudaVendor.id : undefined,
    },
  });

  // Jaynamaz -> jaynamaz-tasbeeh
  await prisma.book.updateMany({
    where: { slug: 'turkish-embossed-jaynamaz' },
    data: {
      categoryId: subCatMap['jaynamaz-tasbeeh'],
      vendorId: darulHudaVendor ? darulHudaVendor.id : undefined,
    },
  });

  console.log('Successfully set up nested categories and mapped products!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

