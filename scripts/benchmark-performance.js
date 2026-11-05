const { PrismaClient } = require('@prisma/client');
const http = require('http');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

function makeAdminCookie(adminUser) {
  if (!adminUser) return '';
  const token = jwt.sign(
    {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      membershipTier: adminUser.membershipTier || 'FREE',
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
  return `shubban_auth_token=${token}`;
}

function measureHttp(path, cookie = '') {
  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    const url = new URL(`${BASE_URL}${path}`);

    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      headers: cookie ? { Cookie: cookie } : {},
    };

    const req = http.get(options, (res) => {
      let ttfbTime = process.hrtime.bigint();
      let bodySize = 0;

      res.on('data', (chunk) => {
        bodySize += chunk.length;
      });

      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const ttfbMs = Number(ttfbTime - startTime) / 1e6;
        const totalDurationMs = Number(endTime - startTime) / 1e6;
        resolve({
          path,
          statusCode: res.statusCode,
          ttfbMs: Math.round(ttfbMs * 10) / 10,
          totalDurationMs: Math.round(totalDurationMs * 10) / 10,
          bodySizeBytes: bodySize,
          bodySizeKb: Math.round((bodySize / 1024) * 10) / 10,
          contentType: res.headers['content-type'] || '',
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        error: err.message,
        statusCode: 0,
        ttfbMs: 0,
        totalDurationMs: 0,
        bodySizeBytes: 0,
      });
    });
  });
}

async function measureDbQuery(name, queryFn) {
  // Run once to warm-up, then measure actual execution
  await queryFn();
  const start = process.hrtime.bigint();
  const result = await queryFn();
  const end = process.hrtime.bigint();
  const durationMs = Math.round((Number(end - start) / 1e6) * 10) / 10;
  return {
    name,
    durationMs,
    count: Array.isArray(result) ? result.length : (result ? 1 : 0),
  };
}

async function runBenchmark() {
  console.log('======================================================================');
  console.log('   PERFORMANCE BENCHMARK RUNNER — SHUBBAN LIBERY MARKETPLACE');
  console.log('======================================================================');
  console.log(`Server URL: ${BASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);

  const mem = process.memoryUsage();
  console.log('\n--- Node.js Process Memory ---');
  console.log(`RSS: ${Math.round(mem.rss / 1024 / 1024)} MB`);
  console.log(`Heap Total: ${Math.round(mem.heapTotal / 1024 / 1024)} MB`);
  console.log(`Heap Used: ${Math.round(mem.heapUsed / 1024 / 1024)} MB`);

  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
  });
  const adminCookie = makeAdminCookie(adminUser);

  // 1. Database Queries Benchmark
  console.log('\n--- 1. Database Query Latency Benchmark ---');

  const bookCardSelect = {
    id: true,
    title: true,
    slug: true,
    price: true,
    discountPrice: true,
    coverImage: true,
    author: { select: { name: true, slug: true } },
    category: { select: { name: true, slug: true } },
  };

  const dbQueries = [
    {
      name: 'Featured Books (Optimized select, take: 6)',
      fn: () => prisma.book.findMany({ where: { isFeatured: true }, take: 6, select: bookCardSelect }),
    },
    {
      name: 'New Arrivals (Indexed, take: 6)',
      fn: () => prisma.book.findMany({ where: { isNewArrival: true }, take: 6, select: bookCardSelect }),
    },
    {
      name: 'Best Sellers (Indexed, take: 6)',
      fn: () => prisma.book.findMany({ where: { isBestSeller: true }, take: 6, select: bookCardSelect }),
    },
    {
      name: 'All Categories with Book Counts',
      fn: () => prisma.category.findMany({ include: { _count: { select: { books: true } } } }),
    },
    {
      name: 'Featured Authors (_count projection, take: 4)',
      fn: () => prisma.author.findMany({ where: { isFeatured: true }, select: { id: true, name: true, slug: true, _count: { select: { books: true } } }, take: 4 }),
    },
    {
      name: 'Featured Publishers (_count projection, take: 4)',
      fn: () => prisma.publisher.findMany({ where: { isFeatured: true }, select: { id: true, name: true, slug: true, _count: { select: { books: true } } }, take: 4 }),
    },
    {
      name: 'Site Settings (All)',
      fn: () => prisma.siteSetting.findMany(),
    },
    {
      name: 'Homepage Sections (Ordered)',
      fn: () => prisma.homepageSection.findMany({ orderBy: { displayOrder: 'asc' } }),
    },
  ];

  const dbResults = [];
  for (const q of dbQueries) {
    const res = await measureDbQuery(q.name, q.fn);
    dbResults.push(res);
    console.log(`  ⚡ [DB] ${res.name.padEnd(48)}: ${res.durationMs.toFixed(1)} ms (${res.count} records)`);
  }

  // 2. HTTP Route Latency & Payload Benchmark
  console.log('\n--- 2. HTTP Route Latency & TTFB Benchmark ---');
  const sampleBook = await prisma.book.findFirst({ select: { slug: true } });
  const sampleBookSlug = sampleBook ? sampleBook.slug : '';

  const sampleAuthor = await prisma.author.findFirst({ select: { slug: true } });
  const sampleAuthorSlug = sampleAuthor ? sampleAuthor.slug : '';

  const sampleCategory = await prisma.category.findFirst({ select: { slug: true } });
  const sampleCatSlug = sampleCategory ? sampleCategory.slug : '';

  const routesToTest = [
    { path: '/', auth: false },
    { path: '/books', auth: false },
    { path: sampleBookSlug ? `/books/${sampleBookSlug}` : '/books', auth: false },
    { path: sampleCatSlug ? `/books?category=${sampleCatSlug}` : '/books', auth: false },
    { path: '/articles', auth: false },
    { path: sampleAuthorSlug ? `/authors/${sampleAuthorSlug}` : '/authors', auth: false },
    { path: '/cart', auth: false },
    { path: '/checkout', auth: false },
    { path: '/admin', auth: true },
    { path: '/admin/orders', auth: true },
    { path: '/admin/couriers', auth: true },
    { path: '/admin/categories', auth: true },
    { path: '/admin/authors', auth: true },
    { path: '/admin/publishers', auth: true },
    { path: '/api/books', auth: false },
    { path: '/api/categories', auth: false },
    { path: '/api/admin/publishers?page=1&limit=10', auth: true },
    { path: '/api/admin/authors?page=1&limit=10', auth: true },
    { path: '/api/admin/categories?page=1&limit=10', auth: true },
    { path: '/api/islamic-ai/quran?query=%E0%A6%86%E0%A6%B2%E0%A7%8D%E0%A6%B2%E0%A6%BE%E0%A6%B9', auth: false },
  ];

  const httpResults = [];
  for (const route of routesToTest) {
    const cookie = route.auth ? adminCookie : '';
    // Run warmup, then benchmark
    await measureHttp(route.path, cookie);
    const res = await measureHttp(route.path, cookie);
    httpResults.push(res);
    const statusMark = res.statusCode >= 200 && res.statusCode < 400 ? '✅' : '⚠️';
    console.log(
      `  ${statusMark} [HTTP ${res.statusCode}] ${res.path.padEnd(45)} | TTFB: ${String(res.ttfbMs).padStart(6)} ms | Total: ${String(res.totalDurationMs).padStart(6)} ms | Size: ${String(res.bodySizeKb).padStart(5)} KB`
    );
  }

  // Summary against Core Web Vitals Targets
  console.log('\n======================================================================');
  console.log('   PERFORMANCE TARGET EVALUATION');
  console.log('======================================================================');

  const home = httpResults.find((r) => r.path === '/');
  if (home) {
    const isUnder3s = home.totalDurationMs <= 3000;
    const isUnder2_5s = home.totalDurationMs <= 2500;
    console.log(`  Homepage Total Load Time: ${home.totalDurationMs} ms (Target ≤ 3000 ms): ${isUnder3s ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Homepage Estimated LCP Window: ${home.ttfbMs} ms TTFB (Target ≤ 2500 ms): ${isUnder2_5s ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Homepage HTML Payload: ${home.bodySizeKb} KB`);
  }

  const apiEndpoints = httpResults.filter((r) => r.path.startsWith('/api/'));
  const avgApiTime = apiEndpoints.reduce((acc, curr) => acc + curr.totalDurationMs, 0) / apiEndpoints.length;

  console.log(`  Average API Response Time: ${Math.round(avgApiTime)} ms (Target ≤ 500 ms): ${avgApiTime <= 500 ? '✅ PASS' : '❌ FAIL'}`);

  await prisma.$disconnect();
}

runBenchmark().catch(console.error);
