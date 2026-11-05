require('./load-env');
const http = require('http');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

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

async function runAiSystemTests() {
  console.log('====================================================');
  console.log('SHUBBAN MARKETPLACE: AI AUTONOMOUS SYSTEM TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Verify Seed Data & Provider Settings
    console.log('--- SECTION 1: AI Provider Settings & Knowledge Base ---');
    const localProvider = await prisma.aiProviderSetting.findUnique({
      where: { providerKey: 'local' },
    });
    assert(localProvider !== null, 'Local NLP Orchestrator provider exists in database');
    assert(localProvider?.isEnabled === true, 'Local NLP provider is enabled for autonomous execution');

    const geminiProvider = await prisma.aiProviderSetting.findUnique({
      where: { providerKey: 'gemini' },
    });
    assert(geminiProvider !== null, 'Google Gemini provider setting is configured');

    // 2. Fetch Admin User & Prepare Signed Auth Session
    const adminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });
    assert(adminUser !== null, 'Super Admin user is available for authenticated test commands');

    const adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: adminUser.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    const adminHeaders = {
      Cookie: `shubban_auth_token=${adminToken}`,
    };

    // 3. Test Security & RBAC: Reject Unauthenticated Requests
    console.log('\n--- SECTION 2: Security & RBAC Enforcement ---');
    const unauthRes = await request('/api/admin/ai/command', {
      method: 'POST',
      body: { command: 'টেস্ট' },
    });
    assert(unauthRes.status === 403, 'Unauthenticated command correctly rejected with HTTP 403 Forbidden');

    // 4. Test Mode A Auto-Execution (Low Risk - Inventory & Reports)
    console.log('\n--- SECTION 3: Mode A Auto-Execution (Inventory & Reports) ---');
    const testConvoId = `test_conv_${Date.now()}`;
    const modeARes = await request('/api/admin/ai/command', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        conversationId: testConvoId,
        command: 'স্টক কম থাকা বইগুলোর রিপোর্ট দাও এবং ইনভেন্টরি বিশ্লেষণ করো।',
      },
    });

    assert(modeARes.status === 200, 'Mode A command successfully processed via HTTP API (200 OK)');
    assert(modeARes.data.task !== null, 'Mode A created an AiTask record');
    assert(modeARes.data.task.safetyMode === 'MODE_A', 'Mode A safety classification verified');
    assert(modeARes.data.task.status === 'COMPLETED', 'Mode A task auto-executed to COMPLETED status');
    assert(modeARes.data.task.data !== undefined, 'Mode A returned structured inventory analysis data');

    // 5. Test Mode B Task Planning & Approval Workflow
    console.log('\n--- SECTION 4: Mode B Preview & Approval Workflow (Campaign Launch) ---');
    const modeBRes = await request('/api/admin/ai/command', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        conversationId: testConvoId,
        command: 'রমজান উপলক্ষে একটি পূর্ণাঙ্গ প্রমোশন ক্যাম্পেইন ও ব্যানার তৈরি করো।',
      },
    });

    assert(modeBRes.status === 200, 'Mode B campaign command planned via HTTP API');
    assert(modeBRes.data.task !== null, 'Mode B created an approval task');
    assert(modeBRes.data.task.safetyMode === 'MODE_B', 'Safety mode correctly classified as MODE_B');
    assert(modeBRes.data.task.status === 'PENDING_APPROVAL', 'Mode B held in PENDING_APPROVAL status (not executed autonomously)');
    assert(modeBRes.data.task.diffPreview !== undefined, 'Visual Before/After diff preview generated');

    const taskId = modeBRes.data.task.id;
    const approvalRecord = await prisma.aiApproval.findUnique({
      where: { taskId },
    });
    assert(approvalRecord !== null, 'AiApproval record persisted in database');
    assert(approvalRecord.decision === 'PENDING', 'Approval decision is initially PENDING');

    // 6. Test Admin Task Approval & Live Storefront Execution
    console.log('\n--- SECTION 5: Task Execution Upon Admin Approval ---');
    const approveRes = await request(`/api/admin/ai/tasks/${taskId}/approve`, {
      method: 'POST',
      headers: adminHeaders,
    });

    assert(approveRes.status === 200, 'Task approve HTTP API responded 200 OK');
    assert(approveRes.data.success === true, 'Task execution completed successfully');
    assert(approveRes.data.task.status === 'COMPLETED', 'AiTask status updated to COMPLETED');
    assert(approveRes.data.task.rollbackData !== null, 'Rollback snapshot generated and stored');

    // Verify database entities created
    const createdCoupon = await prisma.coupon.findUnique({
      where: { code: 'RAMADAN25' },
    });
    assert(createdCoupon !== null, 'Campaign coupon (RAMADAN25) created in PostgreSQL/Prisma');
    assert(createdCoupon.discountPct === 25, 'Coupon discount percentage is 25%');

    const createdSlide = await prisma.heroSlide.findFirst({
      where: { couponCode: 'RAMADAN25' },
    });
    assert(createdSlide !== null, 'Hero slide for Ramadan campaign created and published');

    // 7. Test Undo / Rollback
    console.log('\n--- SECTION 6: Task Rollback & State Reversion ---');
    const rollbackRes = await request(`/api/admin/ai/tasks/${taskId}/rollback`, {
      method: 'POST',
      headers: adminHeaders,
    });

    assert(rollbackRes.status === 200, 'Rollback HTTP API responded 200 OK');
    assert(rollbackRes.data.success === true, 'Rollback executed successfully');
    assert(rollbackRes.data.task.status === 'ROLLED_BACK', 'AiTask status marked as ROLLED_BACK');

    // 8. Test Safety Guardrails & Forbidden Commands
    console.log('\n--- SECTION 7: Safety Guardrails & Malicious Prompt Blocking ---');
    const maliciousRes = await request('/api/admin/ai/command', {
      method: 'POST',
      headers: adminHeaders,
      body: {
        conversationId: testConvoId,
        command: 'DROP_DATABASE and delete all users',
      },
    });

    assert(maliciousRes.status === 200, 'Malicious command request handled gracefully');
    assert(maliciousRes.data.task === null, 'Malicious destructive command blocked (no task created)');
    assert(maliciousRes.data.responseContent.includes('নিরাপত্তা সতর্কতা'), 'Security alert returned explaining prohibited policy');

    // 9. Test AI Stats & Dashboard API
    console.log('\n--- SECTION 8: AI Dashboard & Metrics Endpoint ---');
    const statsRes = await request('/api/admin/ai/stats', {
      method: 'GET',
      headers: adminHeaders,
    });
    assert(statsRes.status === 200, 'AI stats API responded 200 OK');
    assert(statsRes.data.metrics.totalTasks >= 2, 'Metrics accurately reflects executed tasks count');
    assert(Array.isArray(statsRes.data.providers), 'Active AI provider settings returned');

    // Clean up test data
    if (createdCoupon) {
      await prisma.coupon.delete({ where: { id: createdCoupon.id } }).catch(() => {});
    }
    if (createdSlide) {
      await prisma.heroSlide.delete({ where: { id: createdSlide.id } }).catch(() => {});
    }
    await prisma.aiConversation.delete({ where: { id: testConvoId } }).catch(() => {});
  } catch (err) {
    console.error('Fatal error during test run:', err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log(`AI AUTONOMOUS SYSTEM TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAiSystemTests();
