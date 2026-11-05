const http = require('http');

async function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('==============================================');
  console.log('শুব্বান লাইব্রেরী ক্যাটালগ ও সার্চ টেস্টিং');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`✔ [পাস]: ${name}`);
      passed++;
    } catch (err) {
      console.error(`✘ [ফেল]: ${name} ->`, err.message);
      failed++;
    }
  }

  // 1. All Products Pages
  await test('সকল পণ্য পেজ (/books) সফলভাবে লোড হয়', async () => {
    const res = await get('http://localhost:3000/books');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('সকল বই ও পণ্য ক্যাটালগ')) throw new Error('শিরোনাম পাওয়া যায়নি');
  });

  await test('সকল পণ্য এলিয়াস পেজ (/products) সফলভাবে লোড হয়', async () => {
    const res = await get('http://localhost:3000/products');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('সকল বই ও পণ্য ক্যাটালগ')) throw new Error('পণ্য ক্যাটালগ পাওয়া যায়নি');
  });

  // 2. Category Filtering (Parent & Child)
  await test('প্যারেন্ট ক্যাটাগরি ফিল্টারিং (/books?category=islamic)', async () => {
    const res = await get('http://localhost:3000/books?category=islamic');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('নেস্টেড সাব-ক্যাটাগরি ফিল্টারিং (/books?category=quran-tafsir)', async () => {
    const res = await get('http://localhost:3000/books?category=quran-tafsir');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 3. Author, Publisher, Seller Filtering
  await test('লেখক ফিল্টারিং (/books?author=safiur-rahman-mubarakpuri)', async () => {
    const res = await get('http://localhost:3000/books?author=safiur-rahman-mubarakpuri');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('আর-রাহীকুল মাখতূম')) throw new Error('বইয়ের শিরোনাম অনুপস্থিত');
  });

  await test('প্রকাশনী ফিল্টারিং (/books?publisher=islamic-foundation)', async () => {
    const res = await get('http://localhost:3000/books?publisher=islamic-foundation');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('সেলার ফিল্টারিং (/books?vendor=shubban-official)', async () => {
    const res = await get('http://localhost:3000/books?vendor=shubban-official');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 4. Price range & Availability & Sorting & Pagination
  await test('মূল্য সীমা ফিল্টারিং (/books?min_price=300&max_price=800)', async () => {
    const res = await get('http://localhost:3000/books?min_price=300&max_price=800');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('উপলব্ধতা ফিল্টারিং (/books?in_stock=true&format=physical)', async () => {
    const res = await get('http://localhost:3000/books?in_stock=true&format=physical');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('ডিসকাউন্ট ও অফার ফিল্টারিং (/books?discount=true)', async () => {
    const res = await get('http://localhost:3000/books?discount=true');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  await test('সর্টিং (/books?sort=price_asc ও bestseller)', async () => {
    const resAsc = await get('http://localhost:3000/books?sort=price_asc');
    const resBest = await get('http://localhost:3000/books?sort=bestseller');
    if (resAsc.status !== 200 || resBest.status !== 200) throw new Error('সর্টিং এরর');
  });

  await test('পেজিনেশন (/books?page=1)', async () => {
    const res = await get('http://localhost:3000/books?page=1');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
  });

  // 5. Search API Suggestions (Bengali and English)
  await test('সার্চ এপিআই সাজেশন (/api/search?q=বুখারী)', async () => {
    const res = await get('http://localhost:3000/api/search?q=%E0%A6%AC%E0%A7%81%E0%A6%96%E0%A6%BE%E0%A6%B0%E0%A7%80');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = JSON.parse(res.body);
    if (!json.books || json.books.length === 0) throw new Error('বই সাজেশন পাওয়া যায়নি');
  });

  await test('ইংরেজি সার্চ এপিআই সাজেশন (/api/search?q=Bukhari)', async () => {
    const res = await get('http://localhost:3000/api/search?q=Bukhari');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const json = JSON.parse(res.body);
    if (!json.books || json.books.length === 0) throw new Error('ইংরেজি সাজেশন পাওয়া যায়নি');
  });

  // 6. Search Results Page & Tabs
  await test('সার্চ পেজ রেসপন্স ও ফিল্টার ট্যাব (/search?q=তাফসীর&tab=books)', async () => {
    const res = await get('http://localhost:3000/search?q=%E0%A6%A4%E0%A6%BE%E0%A6%AB%E0%A6%B8%E0%A7%80%E0%A6%B0&tab=books');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('অনুসন্ধানের ফলাফল')) throw new Error('সার্চ হেডার অনুপস্থিত');
  });

  // 7. Product Details, Gallery, Variants & Schema.org SEO
  await test('প্রোডাক্ট ডিটেইল পেজ ও এসইও মেটাডাটা (/books/ar-raheeq-al-makhtum)', async () => {
    const res = await get('http://localhost:3000/books/ar-raheeq-al-makhtum');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('https://schema.org')) throw new Error('Schema.org JSON-LD পাওয়া যায়নি');
    if (!res.body.includes('বইয়ের স্পেসিফিকেশন')) throw new Error('স্পেসিফিকেশন টেবিল অনুপস্থিত');
    if (!res.body.includes('সারাদেশে ২-৩ দিনে দ্রুত হোম ডেলিভারি')) throw new Error('ডেলিভারি তথ্য অনুপস্থিত');
  });

  await test('ভ্যারিয়েন্টযুক্ত প্রোডাক্ট ডিটেইল পেজ (/books/madina-oud-royal-attar)', async () => {
    const res = await get('http://localhost:3000/books/madina-oud-royal-attar');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('মদিনা রয়েল উদ')) throw new Error('টাইটেল অনুপস্থিত');
    if (!res.body.includes('৬ মিলি')) throw new Error('ভ্যারিয়েন্ট অনুপস্থিত');
  });

  await test('প্রোডাক্ট ডিটেইল এলিয়াস পেজ (/products/madina-oud-royal-attar)', async () => {
    const res = await get('http://localhost:3000/products/madina-oud-royal-attar');
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    if (!res.body.includes('মদিনা রয়েল উদ')) throw new Error('পণ্য তথ্য অনুপস্থিত');
  });

  console.log('\n==============================================');
  console.log(`টেস্ট ফলাফল: মোট ${passed + failed}টি | পাসড: ${passed} | ফেইল্ড: ${failed}`);
  console.log('==============================================');

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error(e);
  process.exit(1);
});

