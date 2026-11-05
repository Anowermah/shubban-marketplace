const http = require('http');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = data;
          }
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

function createSessionCookie(user) {
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      membershipTier: user.membershipTier || 'FREE',
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return `shubban_auth_token=${token}`;
}

async function runTestSuite() {
  console.log('====================================================');
  console.log('SHUBBAN MARKETPLACE — API & RBAC AUTHORIZATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // Find Admin User
  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
  });
  assert(adminUser !== null, `Admin user exists: ${adminUser?.email} (${adminUser?.role})`);

  // Find Registered Member User
  const memberUser = await prisma.user.findFirst({
    where: { role: 'REGISTERED_MEMBER' },
  });
  assert(memberUser !== null, `Member user exists: ${memberUser?.email} (${memberUser?.role})`);

  const adminCookie = adminUser ? createSessionCookie(adminUser) : '';
  const memberCookie = memberUser ? createSessionCookie(memberUser) : '';

  // 1. PUBLIC API CHECKS
  console.log('\n--- 1. Public API Endpoint Functionality ---');
  try {
    const booksRes = await request('/api/books');
    assert(booksRes.status === 200, `GET /api/books returns 200 OK (Count: ${booksRes.data?.books?.length})`);

    const donationsRes = await request('/api/donations');
    assert(donationsRes.status === 200, `GET /api/donations returns 200 OK`);

    const searchRes = await request('/api/search?q=bangla');
    assert(searchRes.status === 200, `GET /api/search?q=bangla returns 200 OK`);
  } catch (err) {
    assert(false, `Public API Error: ${err.message}`);
  }

  // 2. RBAC UNAUTHENTICATED PROTECTION
  console.log('\n--- 2. RBAC Unauthenticated Protection (Guest Block) ---');
  const protectedEndpoints = [
    { method: 'GET', path: '/api/admin/products' },
    { method: 'POST', path: '/api/admin/products', body: { title: 'Unauthorized' } },
    { method: 'PATCH', path: '/api/admin/orders/fakeid123', body: { orderStatus: 'DELIVERED' } },
    { method: 'GET', path: '/api/admin/support' },
    { method: 'POST', path: '/api/admin/support', body: { subject: 'Unauthorized', message: 'Test' } },
    { method: 'POST', path: '/api/admin/settings', body: { siteName: 'Hacked' } },
  ];

  for (const ep of protectedEndpoints) {
    try {
      const res = await request(ep.path, { method: ep.method, body: ep.body });
      assert(
        res.status === 403 || res.status === 401,
        `Guest ${ep.method} ${ep.path} blocked with status ${res.status}`
      );
    } catch (e) {
      assert(false, `Failed checking ${ep.path}: ${e.message}`);
    }
  }

  // 3. RBAC REGULAR MEMBER PROTECTION (Non-Admin User Block)
  console.log('\n--- 3. RBAC Member Protection (Non-Admin User Block) ---');
  for (const ep of protectedEndpoints) {
    try {
      const res = await request(ep.path, {
        method: ep.method,
        headers: { Cookie: memberCookie },
        body: ep.body,
      });
      assert(
        res.status === 403 || res.status === 401,
        `Regular Member ${ep.method} ${ep.path} denied with status ${res.status}`
      );
    } catch (e) {
      assert(false, `Failed member authorization check on ${ep.path}: ${e.message}`);
    }
  }

  // 4. AUTHENTICATED ADMIN ACCESS & OPERATIONS
  console.log('\n--- 4. Authenticated Admin Actions & Audit Trail ---');
  try {
    // Admin GET Products
    const adminProducts = await request('/api/admin/products', {
      headers: { Cookie: adminCookie },
    });
    assert(adminProducts.status === 200, `Admin GET /api/admin/products returns 200 OK`);
    assert(Array.isArray(adminProducts.data?.products), `Admin received products array (${adminProducts.data?.products?.length} items)`);

    // Admin GET Support Tickets
    const adminSupport = await request('/api/admin/support', {
      headers: { Cookie: adminCookie },
    });
    assert(adminSupport.status === 200, `Admin GET /api/admin/support returns 200 OK`);
    assert(Array.isArray(adminSupport.data?.tickets), `Admin received tickets array (${adminSupport.data?.tickets?.length} items)`);

    // Admin POST Create Support Ticket
    const newTicketRes = await request('/api/admin/support', {
      method: 'POST',
      headers: { Cookie: adminCookie },
      body: {
        subject: 'স্বয়ংক্রিয় সিস্টেম টেস্ট সাপোর্ট অনুসন্ধান',
        category: 'ORDER',
        priority: 'MEDIUM',
        message: 'এটি একটি স্বয়ংক্রিয় এপিআই টেস্ট টিকিট।',
      },
    });
    assert(newTicketRes.status === 200, `Admin POST /api/admin/support created ticket (Status: ${newTicketRes.status})`);
    const createdTicketId = newTicketRes.data?.ticket?.id;
    assert(Boolean(createdTicketId), `Created ticket ID: ${createdTicketId}`);

    if (createdTicketId) {
      // Admin PATCH Reply and Resolve Ticket
      const replyRes = await request(`/api/admin/support/${createdTicketId}`, {
        method: 'PATCH',
        headers: { Cookie: adminCookie },
        body: {
          replyMessage: 'টেস্ট সমাধান বার্তা সফলভাবে নথিভুক্ত হয়েছে।',
          status: 'RESOLVED',
        },
      });
      assert(replyRes.status === 200, `Admin PATCH reply & update status returns 200 OK`);
      assert(replyRes.data?.ticket?.status === 'RESOLVED', `Ticket status updated to RESOLVED`);

      // Admin DELETE Ticket
      const deleteRes = await request(`/api/admin/support/${createdTicketId}`, {
        method: 'DELETE',
        headers: { Cookie: adminCookie },
      });
      assert(deleteRes.status === 200, `Admin DELETE ticket returns 200 OK`);
    }

    // Check Audit Log was recorded
    const recentAudit = await prisma.auditLog.findFirst({
      where: { userId: adminUser.id },
      orderBy: { createdAt: 'desc' },
    });
    assert(recentAudit !== null, `Security audit log recorded: action "${recentAudit?.action}" on ${recentAudit?.entity}`);
  } catch (e) {
    assert(false, `Admin operation failed: ${e.message}`);
  }

  console.log('\n====================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTestSuite().catch((e) => {
  console.error('Fatal error running API & RBAC test suite:', e);
  process.exit(1);
});
