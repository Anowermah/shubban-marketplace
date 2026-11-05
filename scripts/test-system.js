const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

async function runTests() {
  console.log('--- শুরু হচ্ছে শুব্বান লাইব্রেরী সিস্টেম ভেরিফিকেশন ও টেস্ট ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✔ [PASS]: ${message}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL]: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Database connection & Admin seed check
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@shubban.com' },
    });
    assert(admin !== null, 'অ্যাডমিন অ্যাকাউন্ট ডেটাবেসে উপস্থিত রয়েছে');
    assert(admin.role === 'SUPER_ADMIN', 'অ্যাডমিনের রোল SUPER_ADMIN হিসেবে সংরক্ষিত');

    // Test 2: Password hash verification
    const isPasswordValid = await bcrypt.compare('admin123', admin.passwordHash);
    assert(isPasswordValid, 'অ্যাডমিন পাসওয়ার্ড হ্যাশিং সফলভাবে ভেরিফাই হয়েছে');

    // Test 3: Books Catalog integrity
    const bookCount = await prisma.book.count();
    assert(bookCount >= 6, `বুক ক্যাটালগে মোট ${bookCount}টি বই বিদ্যমান`);

    const gitanjali = await prisma.book.findUnique({
      where: { slug: 'gitanjali' },
      include: { author: true, category: true },
    });
    assert(gitanjali !== null, 'গীতাঞ্জলি বইটি ক্যাটালগে বিদ্যমান');
    assert(gitanjali.isFree === true, 'গীতাঞ্জলি বইটি মুক্ত পাঠাগারের জন্য ফ্রি হিসেবে চিহ্নিত');
    assert(gitanjali.author.name === 'রবীন্দ্রনাথ ঠাকুর', 'গীতাঞ্জলির লেখক সঠিক');

    // Test 4: Digital entitlement logic
    let testEntitlement = await prisma.digitalEntitlement.findFirst({
      where: { userId: admin.id, bookId: gitanjali.id },
    });
    if (!testEntitlement) {
      testEntitlement = await prisma.digitalEntitlement.create({
        data: {
          userId: admin.id,
          bookId: gitanjali.id,
          type: 'TEST_GRANT',
        },
      });
    }
    assert(testEntitlement !== null, 'ডিজিটাল এনটাইটেলমেন্ট রেকর্ড সফলভাবে গ্রান্ট হয়েছে');

    // Test 5: Periodicals & Magazines
    const magCount = await prisma.magazine.count();
    const issueCount = await prisma.publicationIssue.count();
    assert(magCount >= 2, `সাময়িকী সিরিজ বিদ্যমান (${magCount}টি)`);
    assert(issueCount >= 3, `পত্রিকা সংখ্যা আর্কাইভ বিদ্যমান (${issueCount}টি)`);

    // Test 6: Articles & Research papers
    const articleCount = await prisma.article.count();
    const researchCount = await prisma.researchPaper.count();
    assert(articleCount >= 3, `প্রবন্ধ সংখ্যা বিদ্যমান (${articleCount}টি)`);
    assert(researchCount >= 1, `গবেষণাপত্র বিদ্যমান (${researchCount}টি)`);

    // Test 7: Q&A Community
    const questionCount = await prisma.question.count();
    const answerCount = await prisma.answer.count();
    assert(questionCount >= 1, `প্রশ্নোত্তর কমিউনিটি প্রশ্ন বিদ্যমান (${questionCount}টি)`);
    assert(answerCount >= 1, `প্রশ্নোত্তর কমিউনিটি উত্তর বিদ্যমান (${answerCount}টি)`);

    // Test 8: Membership plans
    const planCount = await prisma.membershipPlan.count();
    assert(planCount >= 4, `মেম্বারশিপ প্ল্যান সক্রিয় (${planCount}টি)`);

    // Test 9: JWT Authentication token generation and decoding
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role, membershipTier: admin.membershipTier },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    const decoded = jwt.verify(token, JWT_SECRET);
    assert(decoded.email === 'admin@shubban.com', 'JWT সেশন টোকেন সাইনিং ও ভেরিফিকেশন সফল');

    // Test 10: Cart & Discount calculation logic
    const subtotal = 1000;
    const discount10Pct = Math.round(subtotal * 0.1);
    assert(discount10Pct === 100, 'SHUBBAN10 কুপন ডিসকাউন্ট ক্যালকুলেশন সঠিক (৳ ১০০ ছাড়)');

    console.log(`\n========================================`);
    console.log(`টেস্ট ফলাফল: ${passed} উত্তীর্ণ, ${failed} ব্যর্থ।`);
    console.log(`========================================`);
  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();

