const http = require('http');

const BASE_URL = 'http://localhost:3000';

function fetchUrl(urlPath) {
  return new Promise((resolve) => {
    http.get(BASE_URL + urlPath, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, data });
      });
    }).on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('SHUBBAN LIBERY — DIGITAL PUBLICATION SYSTEM FULL QA');
  console.log('====================================================\n');

  const adminSubmenus = [
    { name: '1. প্রকাশনা ড্যাশবোর্ড', path: '/admin/publications' },
    { name: '2. মাসিক পত্রিকা', path: '/admin/magazines' },
    { name: '3. নতুন পত্রিকা তৈরি', path: '/admin/magazines/create' },
    { name: '4. প্রবন্ধ ও আর্টিকেল', path: '/admin/articles' },
    { name: '5. নতুন প্রবন্ধ লিখুন', path: '/admin/articles/create' },
    { name: '6. রচনা ও গবেষণাপত্র', path: '/admin/essays' },
    { name: '7. PDF লাইব্রেরি', path: '/admin/publications/files' },
    { name: '8. লেখক ও সম্পাদক', path: '/admin/publications/authors' },
    { name: '9. ক্যাটাগরি', path: '/admin/publications/categories' },
    { name: '10. ট্যাগ ব্যবস্থাপনা', path: '/admin/publications/tags' },
    { name: '11. পাঠক ও রিডিং রিপোর্ট', path: '/admin/publications/analytics' },
    { name: '12. ডাউনলোড রিপোর্ট', path: '/admin/publications/downloads' },
    { name: '13. শেয়ার রিপোর্ট', path: '/admin/publications/shares' },
    { name: '14. কমেন্ট ও রিভিউ', path: '/admin/publications/feedback' },
    { name: '15. প্রকাশনা সেটিংস', path: '/admin/publications/settings' },
  ];

  const apis = [
    { name: 'Magazines API', path: '/api/publications/magazines' },
    { name: 'Issues API', path: '/api/publications/issues' },
    { name: 'Articles API', path: '/api/publications/articles' },
    { name: 'PDF Files API', path: '/api/publications/files' },
    { name: 'Authors API', path: '/api/publications/authors' },
    { name: 'Categories API', path: '/api/publications/categories' },
    { name: 'Tags API', path: '/api/publications/tags' },
    { name: 'Downloads API', path: '/api/publications/downloads' },
    { name: 'Shares API', path: '/api/publications/shares' },
    { name: 'Feedback API', path: '/api/publications/feedback' },
    { name: 'Settings API', path: '/api/publications/settings' },
    { name: 'Analytics API', path: '/api/admin/publications/analytics' },
  ];

  const publicRoutes = [
    { name: 'Public Magazine Archive', path: '/magazine' },
    { name: 'Public Articles Archive', path: '/articles' },
    { name: 'Public Essays Archive', path: '/essays' },
    { name: 'Public Islamic Journals', path: '/islamic-journals' },
  ];

  let passed = 0;
  let failed = 0;

  console.log('--- TESTING ALL 15 ADMIN SUBMENUS ---');
  for (const item of adminSubmenus) {
    const res = await fetchUrl(item.path);
    if (res.status === 200 || res.status === 307 || res.status === 308) {
      console.log(`[PASS] ${item.name} (${item.path}) => HTTP ${res.status}`);
      passed++;
    } else {
      console.error(`[FAIL] ${item.name} (${item.path}) => HTTP ${res.status}`);
      failed++;
    }
  }

  console.log('\n--- TESTING BACKEND APIS ---');
  for (const api of apis) {
    const res = await fetchUrl(api.path);
    if (res.status === 200 || (api.path.startsWith('/api/admin') && res.status === 403)) {
      const authNotice = res.status === 403 ? ' (Auth Protected - Expected for Admin)' : '';
      console.log(`[PASS] ${api.name} (${api.path}) => HTTP ${res.status}${authNotice}`);
      passed++;
    } else {
      console.error(`[FAIL] ${api.name} (${api.path}) => HTTP ${res.status}`);
      failed++;
    }
  }

  console.log('\n--- TESTING PUBLIC ROUTES ---');
  for (const p of publicRoutes) {
    const res = await fetchUrl(p.path);
    if (res.status === 200 || res.status === 307 || res.status === 308) {
      console.log(`[PASS] ${p.name} (${p.path}) => HTTP ${res.status}`);
      passed++;
    } else {
      console.error(`[FAIL] ${p.name} (${p.path}) => HTTP ${res.status}`);
      failed++;
    }
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('====================================================');
}

runTests();
