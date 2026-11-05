const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function seedMedia() {
  console.log('=== Seeding Central Media Library ===');

  // 1. Create Default Folders
  const foldersData = [
    { name: 'বই ও পণ্য কভার', slug: 'books-covers', color: '#C49A45', icon: 'book' },
    { name: 'ব্যানার ও স্লাইডার', slug: 'banners-sliders', color: '#1D4ED8', icon: 'image' },
    { name: 'ম্যাগাজিন ও সাময়িকী', slug: 'magazines-issues', color: '#0F766E', icon: 'newspaper' },
    { name: 'লেখক ও প্রকাশনী', slug: 'authors-publishers', color: '#7C3AED', icon: 'users' },
    { name: 'বিজ্ঞাপন ও ক্যাম্পেইন', slug: 'ads-campaigns', color: '#EA580C', icon: 'megaphone' },
    { name: 'পিডিএফ ও রিসোর্স', slug: 'pdf-documents', color: '#BE185D', icon: 'file' },
  ];

  const foldersMap = {};
  for (const f of foldersData) {
    const created = await prisma.mediaFolder.upsert({
      where: { slug: f.slug },
      update: {},
      create: f,
    });
    foldersMap[f.slug] = created.id;
  }
  console.log('Seeded folders:', Object.keys(foldersMap).length);

  // 2. Scan public/samples for PDFs and register them
  const samplesDir = path.join(process.cwd(), 'public', 'samples');
  if (fs.existsSync(samplesDir)) {
    const files = fs.readdirSync(samplesDir);
    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const fullPath = path.join(samplesDir, file);
        const stats = fs.statSync(fullPath);
        const checksum = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
        const publicUrl = `/samples/${file}`;

        const asset = await prisma.mediaAsset.upsert({
          where: { storageKey: `samples/${file}` },
          update: {},
          create: {
            title: file.replace('.pdf', '').replace(/[-_]/g, ' '),
            fileName: file,
            originalName: file,
            storageKey: `samples/${file}`,
            storageType: 'LOCAL',
            publicUrl,
            mimeType: 'application/pdf',
            extension: '.pdf',
            mediaType: 'PDF',
            fileSizeBytes: stats.size,
            fileSizeFormatted: `${(stats.size / (1024 * 1024)).toFixed(1)} MB`,
            checksum,
            visibility: 'PUBLIC',
            folderId: foldersMap['pdf-documents'],
            uploadedBy: 'System Seed',
          },
        });
        console.log(`Registered sample PDF: ${file}`);
      }
    }
  }

  // 3. Scan public/images for Hero Image
  const heroPath = path.join(process.cwd(), 'public', 'images', 'hero-1.jpg');
  if (fs.existsSync(heroPath)) {
    const stats = fs.statSync(heroPath);
    const checksum = crypto.createHash('sha256').update(fs.readFileSync(heroPath)).digest('hex');
    await prisma.mediaAsset.upsert({
      where: { storageKey: 'images/hero-1.jpg' },
      update: {},
      create: {
        title: 'শুব্বান লাইব্রেরি হিরো ব্যানার',
        fileName: 'hero-1.jpg',
        originalName: 'hero-1.jpg',
        storageKey: 'images/hero-1.jpg',
        storageType: 'LOCAL',
        publicUrl: '/images/hero-1.jpg',
        thumbnailUrl: '/images/hero-1.jpg',
        mimeType: 'image/jpeg',
        extension: '.jpg',
        mediaType: 'IMAGE',
        fileSizeBytes: stats.size,
        fileSizeFormatted: `${(stats.size / 1024).toFixed(0)} KB`,
        width: 1920,
        height: 800,
        checksum,
        visibility: 'PUBLIC',
        folderId: foldersMap['banners-sliders'],
        uploadedBy: 'System Seed',
      },
    });
    console.log('Registered hero image.');
  }

  // 4. Create sample books covers in media library
  const sampleBooks = [
    { title: 'সহীহ বুখারী শরীফ (পূর্ণাঙ্গ খণ্ড)', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600', size: 145000, width: 600, height: 900 },
    { title: 'কুরআনুল কারীম আরবী ও বাংলা অনুবাদ', url: 'https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=600', size: 182000, width: 600, height: 900 },
    { title: 'তাফসীরে মাআরিফুল কুরআন', url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600', size: 165000, width: 600, height: 900 },
    { title: 'রিয়াদুস সালেহীন', url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600', size: 138000, width: 600, height: 900 },
  ];

  for (let i = 0; i < sampleBooks.length; i++) {
    const b = sampleBooks[i];
    const key = `seed/book_cover_${i + 1}.jpg`;
    const asset = await prisma.mediaAsset.upsert({
      where: { storageKey: key },
      update: {},
      create: {
        title: b.title,
        altText: b.title,
        fileName: `book_cover_${i + 1}.jpg`,
        originalName: `book_cover_${i + 1}.jpg`,
        storageKey: key,
        storageType: 'LOCAL',
        publicUrl: b.url,
        thumbnailUrl: b.url,
        mediumUrl: b.url,
        mimeType: 'image/jpeg',
        extension: '.jpg',
        mediaType: 'IMAGE',
        fileSizeBytes: b.size,
        fileSizeFormatted: `${Math.round(b.size / 1024)} KB`,
        width: b.width,
        height: b.height,
        visibility: 'PUBLIC',
        folderId: foldersMap['books-covers'],
        uploadedBy: 'System Seed',
      },
    });

    // Track sample reference
    await prisma.mediaReference.upsert({
      where: {
        assetId_module_entityId_field: {
          assetId: asset.id,
          module: 'BOOK',
          entityId: `book_sample_${i + 1}`,
          field: 'coverImage',
        },
      },
      update: {},
      create: {
        assetId: asset.id,
        module: 'BOOK',
        entityId: `book_sample_${i + 1}`,
        entityTitle: b.title,
        field: 'coverImage',
      },
    });
  }

  console.log('=== Media Seeding Completed Successfully ===');
}

seedMedia()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

