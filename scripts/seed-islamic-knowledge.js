const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to normalize Arabic by stripping Tashkeel & Harakat
function normalizeArabic(text) {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

async function seedIslamicKnowledge() {
  console.log('====================================================');
  console.log('SEEDING VERIFIED ISLAMIC KNOWLEDGE BASE (QURAN & HADITH)');
  console.log('====================================================\n');

  // 1. Seed Quran Verses with Translations & Tafsir
  console.log('--- Step 1: Seeding Quran Verses & Approved Tafsir ---');
  const versesData = [
    {
      surahNumber: 1,
      surahNameAr: 'الفاتحة',
      surahNameEn: 'Al-Fatihah',
      surahNameBn: 'সূরা আল-ফাতিহা',
      ayahNumber: 1,
      textAr: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      juzNumber: 1,
      revelationType: 'MECCAN',
      bnTranslation: 'পরম করুণাময় অসীম দয়ালু আল্লাহর নামে (শুরু করছি)।',
      enTranslation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      tafsir: 'ইমাম ইবনে কাসীর (রহ.) বলেন, সকল কল্যাণকর কাজের সূচনায় বিসমিল্লাহ পাঠ করা সুন্নাত ও বরকতময়।',
    },
    {
      surahNumber: 1,
      surahNameAr: 'الفاتحة',
      surahNameEn: 'Al-Fatihah',
      surahNameBn: 'সূরা আল-ফাতিহা',
      ayahNumber: 2,
      textAr: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      juzNumber: 1,
      revelationType: 'MECCAN',
      bnTranslation: 'যাবতীয় প্রশংসা জগৎসমূহের প্রতিপালক আল্লাহরই জন্য।',
      enTranslation: '[All] praise is [due] to Allah, Lord of the worlds.',
      tafsir: 'আল-হামদু দ্বারা আল্লাহর প্রতি পূর্ণ ভালোবাসা ও মর্যাদার সাথে সর্বাত্মক কৃতজ্ঞতা প্রকাশ বোঝায়।',
    },
    {
      surahNumber: 2,
      surahNameAr: 'البقرة',
      surahNameEn: 'Al-Baqarah',
      surahNameBn: 'সূরা আল-বাক্বারাহ',
      ayahNumber: 43,
      textAr: 'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ',
      juzNumber: 1,
      revelationType: 'MEDINAN',
      bnTranslation: 'আর তোমরা নামাজ কায়েম করো, যাকাত প্রদান করো এবং রুকুকারীদের সাথে রুকু করো।',
      enTranslation: 'And establish prayer and give zakah and bow with those who bow [in worship and obedience].',
      tafsir: 'মুফতী শফী (রহ.) মাআরিফুল কুরআনে লিখেছেন, এই আয়াতে জামাআতে সালাত আদায়ের গুরুত্ব এবং ইসলামের অন্যতম স্তম্ভ যাকাত প্রদানের সুস্পষ্ট নির্দেশ রয়েছে।',
    },
    {
      surahNumber: 2,
      surahNameAr: 'البقرة',
      surahNameEn: 'Al-Baqarah',
      surahNameBn: 'সূরা আল-বাক্বারাহ',
      ayahNumber: 183,
      textAr: 'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ كَمَا كُتِبَ عَلَى الَّذِينَ مِن قَبْلِكُمْ لَعَلَّكُمْ تَتَّقُونَ',
      juzNumber: 2,
      revelationType: 'MEDINAN',
      bnTranslation: 'হে মুমিনগণ! তোমাদের ওপর রোজা ফরজ করা হয়েছে, যেরূপ ফরজ করা হয়েছিল তোমাদের পূর্ববর্তীদের ওপর; যেন তোমরা তাকওয়া (আল্লাহভীতি) অর্জন করতে পারো।',
      enTranslation: 'O you who have believed, decreed upon you is fasting as it was decreed upon those before you that you may become righteous.',
      tafsir: 'তাফসীরে ইবনে কাসীর: রোজার মূল উদ্দেশ্য কেবল পানাহার বর্জন নয়, বরং তাকওয়া তথা আত্মশুদ্ধি ও আত্মসংযম অর্জন।',
    },
    {
      surahNumber: 2,
      surahNameAr: 'البقرة',
      surahNameEn: 'Al-Baqarah',
      surahNameBn: 'সূরা আল-বাক্বারাহ',
      ayahNumber: 255, // Ayatul Kursi
      textAr: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
      juzNumber: 3,
      revelationType: 'MEDINAN',
      bnTranslation: 'আল্লাহ, তিনি ছাড়া কোনো সত্য ইলাহ নেই; তিনি চিরঞ্জীব, সবকিছুর ধারক। তন্দ্রা বা নিদ্রা তাঁকে স্পর্শ করে না। আসমান ও যমীনে যা কিছু রয়েছে সবই তাঁর। কে আছে যে তাঁর অনুমতি ছাড়া তাঁর নিকট সুপারিশ করবে? তাদের সামনে ও পেছনে যা কিছু আছে তা তিনি জানেন। আর তাঁর জ্ঞানের কোনো কিছুকেই তারা আয়ত্ত করতে পারে না, তিনি যতটুকু ইচ্ছে করেন তা ছাড়া। তাঁর কুরসী আসমান ও যমীনকে পরিবেষ্টন করে আছে, আর এ দুটির রক্ষণাবেক্ষণ তাঁর জন্য কোনো বোঝা নয়; তিনিই সুউচ্চ, মহামহিম।',
      enTranslation: 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of [all] existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth...',
      tafsir: 'এটি কুরআনের সর্বশ্রেষ্ঠ আয়াত (আয়াতুল কুরসী)। উবাই ইবনে কাআব (রা.) বর্ণিত সহিহ হাদিসে নবীজী (সা.) একে কুরআনের সবচেয়ে মর্যাদাপূর্ণ আয়াত হিসেবে নিশ্চিত করেছেন।',
    },
    {
      surahNumber: 112,
      surahNameAr: 'الإخلاص',
      surahNameEn: 'Al-Ikhlas',
      surahNameBn: 'সূরা আল-ইখলাস',
      ayahNumber: 1,
      textAr: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
      juzNumber: 30,
      revelationType: 'MECCAN',
      bnTranslation: 'বলুন, তিনিই আল্লাহ, একক ও অদ্বিতীয়।',
      enTranslation: 'Say, "He is Allah, [who is] One."',
      tafsir: 'তাওহীদের মূল ভিত্তি এই সূরায় সংক্ষেপে অথচ নিখুঁতভাবে বিধৃত হয়েছে। বুখারীর বর্ণনায় এই সূরা কুরআনের এক-তৃতীয়াংশের সমতুল্য।',
    },
  ];

  for (const v of versesData) {
    const existing = await prisma.quranVerse.findUnique({
      where: {
        surahNumber_ayahNumber: {
          surahNumber: v.surahNumber,
          ayahNumber: v.ayahNumber,
        },
      },
    });

    let verse = existing;
    if (!verse) {
      verse = await prisma.quranVerse.create({
        data: {
          surahNumber: v.surahNumber,
          surahNameAr: v.surahNameAr,
          surahNameEn: v.surahNameEn,
          surahNameBn: v.surahNameBn,
          ayahNumber: v.ayahNumber,
          textAr: v.textAr,
          textNormalized: normalizeArabic(v.textAr),
          juzNumber: v.juzNumber,
          revelationType: v.revelationType,
        },
      });
      console.log(`✓ Added Quran Verse: ${v.surahNameBn} (${v.surahNumber}:${v.ayahNumber})`);
    }

    // Add Bengali & English translations
    const existingBn = await prisma.quranTranslation.findFirst({
      where: { verseId: verse.id, language: 'bn' },
    });
    if (!existingBn) {
      await prisma.quranTranslation.create({
        data: {
          verseId: verse.id,
          language: 'bn',
          translator: 'মুহিউদ্দীন খান',
          translation: v.bnTranslation,
          sourceName: 'মদীনা মুনাওয়ারা বাদশাহ ফাহদ কুরআন কমপ্লেক্স',
        },
      });
    }

    const existingEn = await prisma.quranTranslation.findFirst({
      where: { verseId: verse.id, language: 'en' },
    });
    if (!existingEn) {
      await prisma.quranTranslation.create({
        data: {
          verseId: verse.id,
          language: 'en',
          translator: 'Sahih International',
          translation: v.enTranslation,
          sourceName: 'Al-Muntada Al-Islami',
        },
      });
    }

    // Add Tafsir
    const existingTafsir = await prisma.tafsirEntry.findFirst({
      where: { verseId: verse.id, sourceName: 'তাফসীরে ইবনে কাসীর' },
    });
    if (!existingTafsir && v.tafsir) {
      await prisma.tafsirEntry.create({
        data: {
          verseId: verse.id,
          sourceName: 'তাফসীরে ইবনে কাসীর',
          author: 'আল্লামা ইমাদুদ্দীন ইবনে কাসীর (রহ.)',
          content: v.tafsir,
          language: 'bn',
        },
      });
    }
  }

  // 2. Seed Hadith Collections
  console.log('\n--- Step 2: Seeding Hadith Collections ---');
  const collections = [
    {
      slug: 'bukhari',
      nameAr: 'صحيح البخاري',
      nameEn: 'Sahih al-Bukhari',
      nameBn: 'সহীহুল বুখারী',
      compiler: 'ইমাম মুহাম্মদ বিন ইসমাঈল আল-বুখারী (রহ.) [১৯৪-২৫৬ হি.]',
      totalHadith: 7563,
      isCanonical: true,
    },
    {
      slug: 'muslim',
      nameAr: 'صحيح مسلم',
      nameEn: 'Sahih Muslim',
      nameBn: 'সহীহ মুসলিম',
      compiler: 'ইমাম মুসলিম বিন আল-হাজ্জাজ (রহ.) [২০৬-২৬১ হি.]',
      totalHadith: 7500,
      isCanonical: true,
    },
    {
      slug: 'abu-dawud',
      nameAr: 'سنن أبي داود',
      nameEn: 'Sunan Abu Dawud',
      nameBn: 'সুনানে আবু দাউদ',
      compiler: 'ইমাম আবু দাউদ সুলাইমান বিন আশআস (রহ.) [২০২-২৭৫ হি.]',
      totalHadith: 5274,
      isCanonical: true,
    },
    {
      slug: 'tirmidhi',
      nameAr: 'جامع الترمذي',
      nameEn: "Jami' at-Tirmidhi",
      nameBn: 'জামে আত-তিরমিযী',
      compiler: 'ইমাম আবু ঈসা মুহাম্মদ বিন ঈসা আত-তিরমিযী (রহ.) [২০৯-২৭৯ হি.]',
      totalHadith: 3956,
      isCanonical: true,
    },
  ];

  const colMap = {};
  for (const c of collections) {
    const existing = await prisma.hadithCollection.findUnique({
      where: { slug: c.slug },
    });
    if (!existing) {
      const created = await prisma.hadithCollection.create({ data: c });
      colMap[c.slug] = created.id;
      console.log(`✓ Added Hadith Collection: ${c.nameBn}`);
    } else {
      colMap[c.slug] = existing.id;
    }
  }

  // 3. Seed Authentic Hadiths
  console.log('\n--- Step 3: Seeding Canonical Authentic Hadiths ---');
  const hadiths = [
    {
      collectionSlug: 'bukhari',
      hadithNumber: 1,
      chapterNameBn: 'ওহীর সূচনা অধ্যায়',
      chapterNameAr: 'كتاب بدء الوحي',
      narrator: 'আমীরুল মুমিনীন হযরত উমর ইবনুল খাত্তাব (রা.)',
      textAr: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى دُنْيَا يُصِيبُهَا أَوْ إِلَى امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ',
      textBn: 'নিশ্চয়ই যাবতীয় কাজের ফলাফল নিয়তের ওপর নির্ভরশীল। প্রত্যেক মানুষ তাই পাবে যার সে নিয়ত করে। অতএব যার হিজরত পার্থিব স্বার্থ অর্জনের উদ্দেশ্যে কিংবা কোনো নারীকে বিয়ে করার উদ্দেশ্যে হবে, তার হিজরত সেই উদ্দেশ্যেই গণ্য হবে।',
      textEn: 'The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended...',
      authenticity: 'SAHIH',
      gradingAuthority: 'ইমাম বুখারী ও ইমাম মুসলিম (মুত্তাফাকুন আলাইহি)',
      topicTag: 'NIYYAH',
      sourceUrl: 'https://sunnah.com/bukhari:1',
    },
    {
      collectionSlug: 'bukhari',
      hadithNumber: 8,
      chapterNameBn: 'ঈমান অধ্যায়',
      chapterNameAr: 'كتاب الإيمان',
      narrator: 'হযরত আবদুল্লাহ ইবনে উমর (রা.)',
      textAr: 'بُنِيَ الإِسْلاَمُ عَلَى خَمْسٍ: شَهَادَةِ أَنْ لاَ إِلَهَ إِلاَّ اللَّهُ وَأَنَّ مُحَمَّدًا رَسُولُ اللَّهِ، وَإِقَامِ الصَّلاَةِ، وَإِيتَاءِ الزَّكَاةِ، وَالْحَجِّ، وَصَوْمِ رَمَضَانَ',
      textBn: 'ইসলাম পাঁচটি স্তম্ভের ওপর প্রতিষ্ঠিত: ১. এই সাক্ষ্য দেওয়া যে আল্লাহ ছাড়া কোনো সত্য ইলাহ নেই এবং মুহাম্মদ (সা.) আল্লাহর রাসূল, ২. নামাজ কায়েম করা, ৩. যাকাত আদায় করা, ৪. হজ পালন করা এবং ৫. রমজানের রোজা রাখা।',
      textEn: 'Islam is based on (the following) five (principles): 1. To testify that none has the right to be worshipped but Allah and Muhammad is Allah\'s Messenger. 2. To offer the (compulsory congregational) prayers dutifully and perfectly. 3. To pay Zakat. 4. To perform Hajj. 5. To observe fast during the month of Ramadan.',
      authenticity: 'SAHIH',
      gradingAuthority: 'ইমাম বুখারী',
      topicTag: 'SALAH',
      sourceUrl: 'https://sunnah.com/bukhari:8',
    },
    {
      collectionSlug: 'bukhari',
      hadithNumber: 13,
      chapterNameBn: 'ঈমান অধ্যায়',
      chapterNameAr: 'كتاب الإيمان',
      narrator: 'হযরত আনাস (রা.)',
      textAr: 'لاَ يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ',
      textBn: 'তোমাদের কেউ প্রকৃত মুমিন হতে পারবে না, যতক্ষণ না সে তার ভাইয়ের জন্য তাই পছন্দ করবে যা সে নিজের জন্য পছন্দ করে।',
      textEn: 'None of you will have faith till he wishes for his (Muslim) brother what he likes for himself.',
      authenticity: 'SAHIH',
      gradingAuthority: 'ইমাম বুখারী ও ইমাম মুসলিম',
      topicTag: 'CHARACTER',
      sourceUrl: 'https://sunnah.com/bukhari:13',
    },
    {
      collectionSlug: 'muslim',
      hadithNumber: 2699,
      chapterNameBn: 'যিকির, দোয়া ও ইলম অধ্যায়',
      chapterNameAr: 'كتاب الذكر والدعاء والتوبة والاستغفار',
      narrator: 'হযরত আবু হুরায়রা (রা.)',
      textAr: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
      textBn: 'যে ব্যক্তি জ্ঞান অন্বেষণের উদ্দেশ্যে কোনো পথে চলে, আল্লাহ তাআলা তার জন্য জান্নাতের পথ সুগম ও সহজ করে দেন।',
      textEn: 'He who treads the path in search of knowledge, Allah will make the path to Jannah easy for him.',
      authenticity: 'SAHIH',
      gradingAuthority: 'ইমাম মুসলিম',
      topicTag: 'KNOWLEDGE',
      sourceUrl: 'https://sunnah.com/muslim:2699',
    },
    {
      collectionSlug: 'bukhari',
      hadithNumber: 1894,
      chapterNameBn: 'সাওম বা রোজা অধ্যায়',
      chapterNameAr: 'كتاب الصوم',
      narrator: 'হযরত আবু হুরায়রা (রা.)',
      textAr: 'مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا غُفِرَ لَهُ مَا تَقَدَّمَ مِنْ ذَنْبِهِ',
      textBn: 'যে ব্যক্তি ঈমানের সাথে ও সওয়াবের প্রত্যাশায় রমজানের রোজা রাখবে, তার পূর্ববর্তী সমস্ত গুনাহ ক্ষমা করে দেওয়া হবে।',
      textEn: 'Whoever observes fasts during the month of Ramadan out of sincere faith, and hoping to attain Allah\'s rewards, then all his past sins will be forgiven.',
      authenticity: 'SAHIH',
      gradingAuthority: 'ইমাম বুখারী ও ইমাম মুসলিম',
      topicTag: 'SAWM',
      sourceUrl: 'https://sunnah.com/bukhari:1894',
    },
    {
      collectionSlug: 'tirmidhi',
      hadithNumber: 2516,
      chapterNameBn: 'কেয়ামতের বর্ণনা ও যুহদ অধ্যায়',
      chapterNameAr: 'كتاب صفة القيامة والرقائق والورع',
      narrator: 'হযরত আবদুল্লাহ ইবনে আব্বাস (রা.)',
      textAr: 'احْفَظِ اللَّهَ يَحْفَظْكَ، احْفَظِ اللَّهَ تَجِدْهُ تُجَاهَكَ، إِذَا سَأَلْتَ فَاسْأَلِ اللَّهَ، وَإِذَا اسْتَعَنْتَ فَاسْتَعِنْ بِاللَّهِ',
      textBn: 'আল্লাহর বিধানসমূহ হেফাজত করো, আল্লাহ তোমাকে রক্ষা করবেন। আল্লাহর সন্তুষ্টি রক্ষা করো, তুমি তাঁকে তোমার সামনে পাবে। যখন কোনো কিছু প্রার্থনা করবে তখন একমাত্র আল্লাহর কাছেই প্রার্থনা করো; আর যখন সাহায্য চাইবে তখন একমাত্র আল্লাহর কাছেই সাহায্য চাও।',
      textEn: 'Be mindful of Allah and He will protect you. Be mindful of Allah and you will find Him before you. If you ask, ask of Allah; if that you seek help, seek help of Allah.',
      authenticity: 'HASAN_SAHIH',
      gradingAuthority: 'ইমাম আত-তিরমিযী ও শায়খ আলবানী',
      topicTag: 'TAWHID',
      sourceUrl: 'https://sunnah.com/tirmidhi:2516',
    },
  ];

  for (const h of hadiths) {
    const colId = colMap[h.collectionSlug];
    if (!colId) continue;

    const existing = await prisma.hadithEntry.findFirst({
      where: {
        collectionId: colId,
        hadithNumber: h.hadithNumber,
      },
    });

    if (!existing) {
      await prisma.hadithEntry.create({
        data: {
          collectionId: colId,
          hadithNumber: h.hadithNumber,
          chapterNameBn: h.chapterNameBn,
          chapterNameAr: h.chapterNameAr,
          narrator: h.narrator,
          textAr: h.textAr,
          textBn: h.textBn,
          textEn: h.textEn,
          authenticity: h.authenticity,
          gradingAuthority: h.gradingAuthority,
          topicTag: h.topicTag,
          sourceUrl: h.sourceUrl,
        },
      });
      console.log(`✓ Added Hadith: ${h.collectionSlug} #${h.hadithNumber} (${h.authenticity})`);
    }
  }

  // 4. Seed Scholarly References (Madhhab Differences)
  console.log('\n--- Step 4: Seeding Scholarly & Madhhab References ---');
  const scholarlyData = [
    {
      topic: 'তারাবীহর সালাতের রাকাত সংখ্যা ও মাযহাবীয় পর্যালোচনা',
      topicEn: 'Number of Rakats in Tarawih Prayer across Madhhabs',
      madhhabViewHanafi: 'হানাফি মাযহাব মতে, জামাআতের সাথে ২০ রাকাত তারাবীহ আদায় করা সুন্নাতে মুয়াক্কাদা। খলিফাতুল মুসলিমীন হযরত উমর (রা.)-এর যুগে সাহাবায়ে কেরামের সর্বসম্মত আমল ছিল ২০ রাকাত।',
      madhhabViewMaliki: 'মালিকি মাযহাবের প্রাচীন ও প্রসিদ্ধ মতানুসারে মদিনাবাসীদের আমলের ওপর ভিত্তি করে ৩৬ রাকাত তারাবীহ পড়ার নিয়ম প্রচলিত ছিল। তবে ২০ রাকাতও সম্পূর্ণরূপে স্বীকৃত ও সমাদৃত।',
      madhhabViewShafii: 'ইমাম শাফিঈ (রহ.)-এর মতে ২০ রাকাত তারাবীহ সর্বোত্তম এবং মক্কার বায়তুল্লাহর মুসুল্লীগণের সর্বসম্মত আমল ২০ রাকাতই ছিল।',
      madhhabViewHanbali: 'ইমাম আহমদ বিন হাম্বল (রহ.)-এর চূড়ান্ত মত অনুযায়ী তারাবীহ ২০ রাকাত। তবে ক্বিয়ামুল লাইল নফল ইবাদত হওয়ায় রাকাত সংখ্যা নিয়ে কঠোরতা না করারও অভিমত রয়েছে।',
      consensusNotes: 'চার মাযহাবের জমহুর ফকীহগণের ঐকমত্য হলো ২০ রাকাত তারাবীহ সালাত সুন্নাতে মুয়াক্কাদা এবং সাহাবায়ে কেরামের যুগ থেকে এ আমল অবিচ্ছিন্নভাবে চলে আসছে। তবে কেউ ৮ রাকাত বা তার বেশি পড়লেও তা নফল হিসেবে সওয়াবের অন্তর্ভুক্ত। এটি নিয়ে মুসলিম উম্মাহর মধ্যে কাদা ছোঁড়াছুঁড়ি করা অনুচিত।',
      classicalSources: 'বাদায়েউস সানায়ে (কাসানী), আল-মুগনী (ইবনে কুদামা), আল-মাজমু শারহুল মুহাযযাব (ইমাম নববী)',
    },
    {
      topic: 'যাকাতুল ফিতর বা ফিতরা নগদ টাকায় দেওয়ার বিধান',
      topicEn: 'Paying Zakat al-Fitr in Cash value vs. Food',
      madhhabViewHanafi: 'ইমাম আবু হানিফা (রহ.) ও হাসান বসরী (রহ.)-এর মতে ফিতরা খাদ্যদ্রব্যের পরিবর্তে তার সমমূল্যের নগদ টাকায় আদায় করা সম্পূর্ণরূপে জায়েজ ও বর্তমান যুগে গরিবদের প্রয়োজনের দৃষ্টিতে অধিক উত্তম।',
      madhhabViewMaliki: 'মালিকি মাযহাব মতে মূল নিয়ম হলো হাদিসে বর্ণিত খাদ্যদ্রব্য (গম, যব, খেজুর, কিসমিস) দিয়েই ফিতরা আদায় করা।',
      madhhabViewShafii: 'ইমাম শাফিঈ (রহ.)-এর মতে দেশের প্রধান খাদ্যদ্রব্য দিয়েই ফিতরা দিতে হবে, নগদ টাকায় দিলে তা জমহুরের মতে যথেষ্ট নয়।',
      madhhabViewHanbali: 'ইমাম আহমদ (রহ.)-এর সাধারণ অভিমত শাফিঈ মাযহাবের মতো খাদ্যদ্রব্য দেওয়া। তবে ইবনে তাইমিয়া (রহ.) বিশেষ প্রয়োজন বা মাসলাহাতের ক্ষেত্রে নগদ টাকায় আদায়ের অবকাশ দিয়েছেন।',
      consensusNotes: 'উভয় মতেরই শক্তিশালী প্রামাণ্য ভিত্তি রয়েছে। বর্তমান আধুনিক অর্থব্যবস্থায় অভাবীদের পোশাক বা প্রয়োজনীয় সামগ্রী ক্রয়ের সুবিধার্তে হানাফি মাযহাবের মত বিশ্বজুড়ে বহু সমকালীন ফতোয়া বোর্ড কর্তৃকও গৃহীত।',
      classicalSources: 'ফাতহুল কাদীর (ইবনুল হুমাম), আল-উম্ম (ইমাম শাফিঈ), ফতোয়ায়ে উসমানী',
    },
  ];

  for (const s of scholarlyData) {
    const existing = await prisma.scholarlyReference.findFirst({
      where: { topic: s.topic },
    });
    if (!existing) {
      await prisma.scholarlyReference.create({ data: s });
      console.log(`✓ Added Scholarly Reference: ${s.topic}`);
    }
  }

  console.log('\n====================================================');
  console.log('ISLAMIC KNOWLEDGE BASE SEEDING COMPLETE!');
  console.log('====================================================');
}

seedIslamicKnowledge()
  .catch((e) => {
    console.error('Error seeding Islamic knowledge:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

