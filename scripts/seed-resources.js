const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedResources() {
  console.log('Seeding Islamic educational resources...');

  const sampleResources = [
    {
      title: 'আল-আকীদা আত-ত্বহাবীয়া (মূল মতন ও সহজ ব্যাখ্যা)',
      titleEn: 'Al-Aqeedah Al-Tahawiyyah with Simplified Commentary',
      slug: 'al-aqeedah-al-tahawiyyah-simplified',
      topic: 'AQEEDAH',
      category: 'EBOOK',
      description: 'আহলে সুন্নাত ওয়াল জামাআতের প্রামাণিক আকিদা গ্রন্থ। ঈমান, তাওহীদ এবং আসমা ওয়াস-সিফাতের বিশুদ্ধ আলোচনা।',
      fileUrl: '/documents/aqeedah-tahawiyyah.pdf',
      fileType: 'PDF',
      fileSize: '4.8 MB',
      authorName: 'ইমাম আবু জাফর আত-ত্বহাবী (রহি.)',
      publisher: 'শুব্বান ইসলামিক রিসার্চ সেল',
      language: 'bn',
      isFeatured: true,
      isFree: true,
      downloads: 142,
    },
    {
      title: 'দৈনন্দিন সালাত ও তাহারাত গাইড (ইনফোগ্রাফিক চার্ট)',
      titleEn: 'Daily Salah & Taharah Practical Infographic Chart',
      slug: 'daily-salah-taharah-infographic',
      topic: 'FIQH',
      category: 'INFOGRAPHIC',
      description: 'রাসূলুল্লাহ (সা.)-এর সুন্নাহ মোতাবেক অযু, গোসল, তায়াম্মুম এবং সালাত আদায়ের চিত্রসহ নিয়ম ও সাধারণ ভুলত্রুটি নিরসন।',
      fileUrl: '/documents/salah-guide-infographic.pdf',
      fileType: 'PDF',
      fileSize: '8.2 MB',
      authorName: 'মুফতি আব্দুল্লাহ আল-মামুন',
      publisher: 'আস-সুন্নাহ ফাউন্ডেশন পাবলিকেশন্স',
      language: 'bn',
      isFeatured: true,
      isFree: true,
      downloads: 380,
    },
    {
      title: 'চল্লিশ হাদিস সংকলন (আরবি পাঠ ও বঙ্গানুবাদ)',
      titleEn: 'An-Nawawi Forty Hadith Collection',
      slug: 'arbaeen-nawawi-forty-hadith',
      topic: 'HADITH',
      category: 'EBOOK',
      description: 'দ্বীনের মৌলিক ভিত্তিসমূহ ধারণকারী ইমাম নববী (রহি.)-এর সংকলিত প্রামাণিক চল্লিশ হাদিসের প্রামাণ্য অনুবাদ ও সংক্ষিপ্ত নোট।',
      fileUrl: '/documents/arbaeen-nawawi.pdf',
      fileType: 'PDF',
      fileSize: '3.1 MB',
      authorName: 'ইমাম মুহিউদ্দীন আন-নববী (রহি.)',
      publisher: 'মাকতাবাতুল আশরাফ',
      language: 'bn',
      isFeatured: true,
      isFree: true,
      downloads: 512,
    },
    {
      title: 'সীরাতুন্নবী (সা.) সংক্ষিপ্ত টাইমলাইন ও মানচিত্র',
      titleEn: 'Prophetic Seerah Timeline & Historical Atlas',
      slug: 'prophetic-seerah-timeline-atlas',
      topic: 'SEERAH',
      category: 'INFOGRAPHIC',
      description: 'মাক্কী ও মাদানী জীবনের প্রধান ঘটনাসমূহ, হিজরত, বদর, উহুদ, খন্দক ও মক্কা বিজয়ের মানচিত্রভিত্তিক কালানুক্রমিক চিত্ররূপ।',
      fileUrl: '/documents/seerah-timeline.pdf',
      fileType: 'PDF',
      fileSize: '12.5 MB',
      authorName: 'মাওলানা মুহাম্মদ যুবায়ের',
      publisher: 'শুব্বান হিস্টোরিক্যাল রিসার্চ',
      language: 'bn',
      isFeatured: true,
      isFree: true,
      downloads: 290,
    },
    {
      title: 'কুরআনিক আরবি ব্যাকরণ ও শব্দার্থ সহায়িকা',
      titleEn: 'Quranic Arabic Grammar & Vocabulary Syllabus',
      slug: 'quranic-arabic-grammar-curriculum',
      topic: 'ARABIC_LANGUAGE',
      category: 'CURRICULUM',
      description: 'কুরআন বোঝার জন্য অপরিহার্য মৌলিক সারফ ও নাহুর সহজবোধ্য নিয়মাবলী এবং বহুল ব্যবহৃত কুরআনিক শব্দের অর্থ তালিকা।',
      fileUrl: '/documents/quranic-arabic-basics.pdf',
      fileType: 'PDF',
      fileSize: '6.4 MB',
      authorName: 'ড. আবুল ফাতাহ মুহাম্মদ',
      publisher: 'মাদরাসা দারুল কুরআন একাডেমি',
      language: 'bn',
      isFeatured: false,
      isFree: true,
      downloads: 185,
    },
    {
      title: 'সূরা আল-ফাতিহা ও শেষ দশ সূরার তাফসীর নোটস',
      titleEn: 'Tafseer Notes of Surah Al-Fatihah & Juz Amma End Surahs',
      slug: 'tafseer-fatihah-juz-amma',
      topic: 'TAFSEER',
      category: 'RESEARCH_PAPER',
      description: 'সালাতে পঠিত সূরার অর্থ, শানে নুযূল এবং বাস্তবিক জীবনে প্রয়োগযোগ্য শিক্ষা সংবলিত তাত্ত্বিক গবেষণা প্রবন্ধ।',
      fileUrl: '/documents/tafseer-short-surahs.pdf',
      fileType: 'PDF',
      fileSize: '5.0 MB',
      authorName: 'শায়েখ আহমাদুল্লাহ',
      publisher: 'আস-সুন্নাহ রিসার্চ ডিপার্টমেন্ট',
      language: 'bn',
      isFeatured: true,
      isFree: true,
      downloads: 620,
    },
  ];

  for (const r of sampleResources) {
    await prisma.islamicResource.upsert({
      where: { slug: r.slug },
      update: r,
      create: r,
    });
  }

  console.log(`Successfully seeded ${sampleResources.length} Islamic resources.`);
}

seedResources()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

