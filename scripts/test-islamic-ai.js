require('./load-env');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runIslamicAiTests() {
  console.log('====================================================');
  console.log('SHUBBAN MARKETPLACE: ADVANCED ISLAMIC AI TEST SUITE');
  console.log('====================================================\n');

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: Quran Database & Text Integrity
    // -------------------------------------------------------------------------
    console.log('--- SECTION 1: Quran Database & Text Integrity ---');
    const ayatulKursi = await prisma.quranVerse.findUnique({
      where: { surahNumber_ayahNumber: { surahNumber: 2, ayahNumber: 255 } },
      include: { translations: true, tafsirEntries: true },
    });
    assert(ayatulKursi !== null, 'Ayatul Kursi (Surah 2:255) exists in database');
    assert(ayatulKursi.textAr.includes('اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ'), 'Ayatul Kursi Arabic text with Tashkeel verified');
    assert(ayatulKursi.translations.length >= 2, 'Ayatul Kursi has verified Bengali and English translations');
    assert(ayatulKursi.tafsirEntries.length >= 1, 'Ayatul Kursi has approved classical Tafsir commentary');

    const salahVerse = await prisma.quranVerse.findUnique({
      where: { surahNumber_ayahNumber: { surahNumber: 2, ayahNumber: 43 } },
      include: { translations: true },
    });
    assert(salahVerse !== null, 'Surah Al-Baqarah (2:43) on Salah and Zakah exists');
    assert(salahVerse.textAr.includes('وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ'), 'Salah and Zakah Arabic text verified');

    // -------------------------------------------------------------------------
    // SECTION 2: Canonical Hadith Collections & Authenticity Gradings
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: Canonical Hadith Collections & Authenticity Gradings ---');
    const bukhariCollection = await prisma.hadithCollection.findUnique({
      where: { slug: 'bukhari' },
    });
    assert(bukhariCollection !== null, 'Sahih al-Bukhari canonical collection exists');
    assert(bukhariCollection.isCanonical === true, 'Bukhari flagged as canonical');

    const hadith1 = await prisma.hadithEntry.findFirst({
      where: { hadithNumber: 1, collectionId: bukhariCollection.id },
    });
    assert(hadith1 !== null, 'Hadith on Niyyah (Bukhari #1) exists');
    assert(hadith1.authenticity === 'SAHIH', 'Bukhari #1 authenticity grading is SAHIH');
    assert(hadith1.textAr.includes('إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ'), 'Bukhari #1 Arabic matn verified');
    assert(hadith1.gradingAuthority.includes('ইমাম বুখারী'), 'Grading authority correctly recorded');

    const muslimCollection = await prisma.hadithCollection.findUnique({
      where: { slug: 'muslim' },
    });
    const hadithKnowledge = await prisma.hadithEntry.findFirst({
      where: { hadithNumber: 2699, collectionId: muslimCollection.id },
    });
    assert(hadithKnowledge !== null, 'Hadith on Seeking Knowledge (Muslim #2699) exists');
    assert(hadithKnowledge.authenticity === 'SAHIH', 'Muslim #2699 grading is SAHIH');
    assert(hadithKnowledge.textAr.includes('مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا'), 'Knowledge hadith Arabic text verified');

    // -------------------------------------------------------------------------
    // SECTION 3: RAG Query Processing & Evidence Grounding via API
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: RAG Query Processing & Evidence Grounding ---');
    const salahRes = await request('/api/islamic-ai/query', {
      method: 'POST',
      body: {
        query: 'নামাজের গুরুত্ব ও ফজিলত কী?',
        mode: 'STANDARD',
      },
    });

    assert(salahRes.status === 200, 'Salah query responded with HTTP 200 OK');
    assert(salahRes.data.evidenceStatus === 'VERIFIED', 'Salah query evidence status is VERIFIED');
    assert(salahRes.data.quranEvidence !== undefined, 'Quranic evidence returned for Salah query');
    assert(salahRes.data.quranEvidence.arabicText.includes('وَأَقِيمُوا الصَّلَاةَ'), 'Quranic proof contains correct Arabic verse');
    assert(salahRes.data.hadithEvidence !== undefined, 'Hadith evidence returned for Salah query');
    assert(salahRes.data.hadithEvidence.authenticity === 'SAHIH', 'Hadith proof for Salah is graded SAHIH');
    assert(salahRes.data.citations.length >= 2, 'At least 2 citations mapped to authentic source records');

    // -------------------------------------------------------------------------
    // SECTION 4: Madhhab Perspectives & Research Mode
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 4: Madhhab Perspectives & Research Mode ---');
    const tarawihRes = await request('/api/islamic-ai/query', {
      method: 'POST',
      body: {
        query: 'তারাবীহর নামাজ কত রাকাত? চার মাযহাবের মতামত কী?',
        mode: 'RESEARCH',
      },
    });

    assert(tarawihRes.status === 200, 'Tarawih research query responded with HTTP 200 OK');
    assert(tarawihRes.data.scholarlyContext !== undefined, 'Scholarly Madhhab context retrieved');
    assert(tarawihRes.data.scholarlyContext.hanafi !== null, 'Hanafi Madhhab view presented with dalil');
    assert(tarawihRes.data.scholarlyContext.maliki !== null, 'Maliki Madhhab view presented with dalil');
    assert(tarawihRes.data.scholarlyContext.shafii !== null, 'Shafii Madhhab view presented with dalil');
    assert(tarawihRes.data.scholarlyContext.hanbali !== null, 'Hanbali Madhhab view presented with dalil');
    assert(tarawihRes.data.scholarlyContext.classicalSources !== null, 'Classical jurisprudence sources cited');

    // -------------------------------------------------------------------------
    // SECTION 5: Marketplace Book Recommendation Connector
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 5: Marketplace Book Recommendations ---');
    assert(Array.isArray(salahRes.data.recommendedBooks), 'Recommended books array returned');
    assert(salahRes.data.recommendedBooks.length > 0, 'At least 1 relevant Islamic book recommended from Shubban store');
    assert(salahRes.data.recommendedBooks[0].slug !== undefined, 'Recommended book has valid slug for product navigation');
    assert(salahRes.data.recommendedBooks[0].price > 0, 'Recommended book has legitimate price');

    // -------------------------------------------------------------------------
    // SECTION 6: User Feedback API
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 6: User Feedback Submission ---');
    const feedbackRes = await request('/api/islamic-ai/feedback', {
      method: 'POST',
      body: {
        messageId: salahRes.data.messageId,
        isHelpful: true,
        comment: 'মাশাআল্লাহ, কুরআন ও হাদিসের চমৎকার দলিল সহ উত্তর পেয়েছি।',
      },
    });
    assert(feedbackRes.status === 200, 'Feedback submission responded HTTP 200 OK');
    assert(feedbackRes.data.success === true, 'Feedback recorded in database');

    // -------------------------------------------------------------------------
    // SECTION 7: Admin Islamic AI Analytics Endpoint
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 7: Admin Islamic AI Analytics Endpoint ---');
    // Note: Admin routes require auth cookie
    const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';
    const adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    const adminStatsRes = await request('/api/admin/islamic-ai/stats', {
      method: 'GET',
      headers: { Cookie: `shubban_auth_token=${adminToken}` },
    });
    assert(adminStatsRes.status === 200, 'Admin Islamic AI stats responded HTTP 200 OK');
    assert(adminStatsRes.data.metrics.totalVerses >= 6, 'Admin metrics reflects indexed verses');
    assert(adminStatsRes.data.metrics.totalHadiths >= 6, 'Admin metrics reflects indexed hadiths');
    assert(adminStatsRes.data.collections.length >= 4, 'Canonical collections retrieved for admin');

    // Clean up test conversation
    await prisma.islamicAiConversation.delete({ where: { id: salahRes.data.conversationId } }).catch(() => {});
    await prisma.islamicAiConversation.delete({ where: { id: tarawihRes.data.conversationId } }).catch(() => {});
  } catch (err) {
    console.error('Fatal error during Islamic AI test execution:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`ISLAMIC AI TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runIslamicAiTests();

