/**
 * Shubban Unified Authentication & Multi-Role Login System
 * Comprehensive Automated Functional and Security Test Suite
 */

const BASE_URL = 'http://localhost:3000';

const testResults = [];

function recordTest(testId, name, category, status, expected, actual, details = '') {
  testResults.push({
    testId,
    name,
    category,
    status,
    expected,
    actual,
    details,
  });
  console.log(`[${status}] ${testId}: ${name}`);
  if (status !== 'PASS') {
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
    if (details) console.error(`   Details:  ${details}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log(' SHUBBAN UNIFIED AUTHENTICATION & MULTI-ROLE TEST SUITE');
  console.log('================================================================\n');

  let adminAuthCookie = '';
  let customerAuthCookie = '';
  const now = Date.now();

  // -------------------------------------------------------------
  // TEST 1: Super Admin Login via Admin Portal
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.1.1',
      },
      body: JSON.stringify({
        email: 'admin@shubban.com',
        password: 'admin123',
        portal: 'admin',
      }),
    });

    const data = await res.json();
    const cookie = res.headers.get('set-cookie');
    if (cookie && cookie.includes('shubban_auth_token=')) {
      adminAuthCookie = cookie.split(';')[0];
    }

    if (
      res.status === 200 &&
      data.redirectTo === '/admin' &&
      data.user?.role === 'SUPER_ADMIN' &&
      adminAuthCookie
    ) {
      recordTest(
        'AUTH-01',
        'Super Admin Login via Admin Portal',
        'Authentication & Routing',
        'PASS',
        'Status 200, redirectTo: /admin, auth cookie issued',
        `Status ${res.status}, redirectTo: ${data.redirectTo}`
      );
    } else {
      recordTest(
        'AUTH-01',
        'Super Admin Login via Admin Portal',
        'Authentication & Routing',
        'FAIL',
        'Status 200, redirectTo: /admin, auth cookie issued',
        `Status ${res.status}, redirectTo: ${data.redirectTo}`
      );
    }
  } catch (err) {
    recordTest('AUTH-01', 'Super Admin Login via Admin Portal', 'Authentication & Routing', 'FAIL', 'Status 200', err.message);
  }

  // -------------------------------------------------------------
  // TEST 2: Multi-Role Workspace Resolution for Super Admin
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.1.2',
      },
      body: JSON.stringify({
        email: 'admin@shubban.com',
        password: 'admin123',
      }),
    });

    const data = await res.json();
    const workspaceKeys = (data.workspaces || []).map((w) => w.key);
    const hasAdmin = workspaceKeys.includes('admin');
    const hasPublisher = workspaceKeys.includes('publisher');
    const hasAdvertiser = workspaceKeys.includes('advertiser');
    const hasSeller = workspaceKeys.includes('seller');
    const hasCustomer = workspaceKeys.includes('customer');

    if (hasAdmin && hasPublisher && hasAdvertiser && hasSeller && hasCustomer) {
      recordTest(
        'AUTH-02',
        'Multi-Role Workspace Resolution (Super Admin)',
        'Multi-Role & Identity',
        'PASS',
        'Contains admin, publisher, advertiser, seller, customer',
        `Resolved: ${workspaceKeys.join(', ')}`
      );
    } else {
      recordTest(
        'AUTH-02',
        'Multi-Role Workspace Resolution (Super Admin)',
        'Multi-Role & Identity',
        'FAIL',
        'Contains admin, publisher, advertiser, seller, customer',
        `Resolved: ${workspaceKeys.join(', ')}`
      );
    }
  } catch (err) {
    recordTest('AUTH-02', 'Multi-Role Workspace Resolution (Super Admin)', 'Multi-Role & Identity', 'FAIL', 'Resolved 5 workspaces', err.message);
  }

  // -------------------------------------------------------------
  // TEST 3: Advertiser Portal Login for Multi-Role Admin
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.1.3',
      },
      body: JSON.stringify({
        email: 'admin@shubban.com',
        password: 'admin123',
        portal: 'advertiser',
      }),
    });

    const data = await res.json();
    if (res.status === 200 && data.redirectTo === '/advertiser') {
      recordTest(
        'AUTH-03',
        'Advertiser Portal Routing for Multi-Role User',
        'Role-Aware Redirection',
        'PASS',
        'Status 200, redirectTo: /advertiser',
        `Status ${res.status}, redirectTo: ${data.redirectTo}`
      );
    } else {
      recordTest(
        'AUTH-03',
        'Advertiser Portal Routing for Multi-Role User',
        'Role-Aware Redirection',
        'FAIL',
        'Status 200, redirectTo: /advertiser',
        `Status ${res.status}, redirectTo: ${data.redirectTo}`
      );
    }
  } catch (err) {
    recordTest('AUTH-03', 'Advertiser Portal Routing for Multi-Role User', 'Role-Aware Redirection', 'FAIL', 'Status 200', err.message);
  }

  // -------------------------------------------------------------
  // TEST 4: Customer Registration via Central Endpoint
  // -------------------------------------------------------------
  const newEmail = `qa_reg_${now}@shubban.com`;
  try {
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.2.1',
      },
      body: JSON.stringify({
        name: 'নতুন নিবন্ধিত পাঠক',
        email: newEmail,
        password: 'SecurePassword123!',
        phone: '01719876543',
      }),
    });

    const regData = await regRes.json();
    if (regRes.status === 200 && regData.user?.role === 'REGISTERED_MEMBER') {
      recordTest(
        'AUTH-04',
        'Customer Registration Flow',
        'User Registration',
        'PASS',
        'Status 200, role: REGISTERED_MEMBER',
        `Status ${regRes.status}, role: ${regData.user?.role}`
      );
    } else {
      recordTest(
        'AUTH-04',
        'Customer Registration Flow',
        'User Registration',
        'FAIL',
        'Status 200, role: REGISTERED_MEMBER',
        `Status ${regRes.status}, error: ${regData.error}`
      );
    }
  } catch (err) {
    recordTest('AUTH-04', 'Customer Registration Flow', 'User Registration', 'FAIL', 'Status 200', err.message);
  }

  // -------------------------------------------------------------
  // TEST 5: Customer Login via Customer Portal
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.2.2',
      },
      body: JSON.stringify({
        email: 'qa_reader@shubban.com',
        password: 'Password123!',
        portal: 'customer',
      }),
    });

    const data = await res.json();
    const cookie = res.headers.get('set-cookie');
    if (cookie && cookie.includes('shubban_auth_token=')) {
      customerAuthCookie = cookie.split(';')[0];
    }

    if (res.status === 200 && data.redirectTo === '/account' && customerAuthCookie) {
      recordTest(
        'AUTH-05',
        'Customer Login via Customer Portal',
        'Authentication & Routing',
        'PASS',
        'Status 200, redirectTo: /account, cookie issued',
        `Status ${res.status}, redirectTo: ${data.redirectTo}`
      );
    } else {
      recordTest(
        'AUTH-05',
        'Customer Login via Customer Portal',
        'Authentication & Routing',
        'FAIL',
        'Status 200, redirectTo: /account',
        `Status ${res.status}, redirectTo: ${data.redirectTo}`
      );
    }
  } catch (err) {
    recordTest('AUTH-05', 'Customer Login via Customer Portal', 'Authentication & Routing', 'FAIL', 'Status 200', err.message);
  }

  // -------------------------------------------------------------
  // TEST 6: Cross-Portal Access Denial (Customer -> Admin Portal)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.2.3',
      },
      body: JSON.stringify({
        email: 'qa_reader@shubban.com',
        password: 'Password123!',
        portal: 'admin',
      }),
    });

    const data = await res.json();
    if (res.status === 403 && data.error && data.error.includes('অননুমোদিত প্রবেশ')) {
      recordTest(
        'AUTH-06',
        'Cross-Portal Boundary: Customer blocked from Admin Portal',
        'Security & Boundary Protection',
        'PASS',
        'Status 403 Forbidden with unauthorized message',
        `Status ${res.status}: ${data.error}`
      );
    } else {
      recordTest(
        'AUTH-06',
        'Cross-Portal Boundary: Customer blocked from Admin Portal',
        'Security & Boundary Protection',
        'FAIL',
        'Status 403 Forbidden with unauthorized message',
        `Status ${res.status}, error: ${data.error}`
      );
    }
  } catch (err) {
    recordTest('AUTH-06', 'Cross-Portal Boundary: Customer blocked from Admin Portal', 'Security & Boundary Protection', 'FAIL', 'Status 403', err.message);
  }

  // -------------------------------------------------------------
  // TEST 7: Cross-Portal Access Denial (Customer -> Publisher Portal)
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.2.4',
      },
      body: JSON.stringify({
        email: 'qa_reader@shubban.com',
        password: 'Password123!',
        portal: 'publisher',
      }),
    });

    const data = await res.json();
    if (res.status === 403 && data.error && data.error.includes('অননুমোদিত প্রবেশ')) {
      recordTest(
        'AUTH-07',
        'Cross-Portal Boundary: Customer blocked from Publisher Portal',
        'Security & Boundary Protection',
        'PASS',
        'Status 403 Forbidden with unauthorized message',
        `Status ${res.status}: ${data.error}`
      );
    } else {
      recordTest(
        'AUTH-07',
        'Cross-Portal Boundary: Customer blocked from Publisher Portal',
        'Security & Boundary Protection',
        'FAIL',
        'Status 403 Forbidden with unauthorized message',
        `Status ${res.status}: ${data.error}`
      );
    }
  } catch (err) {
    recordTest('AUTH-07', 'Cross-Portal Boundary: Customer blocked from Publisher Portal', 'Security & Boundary Protection', 'FAIL', 'Status 403', err.message);
  }

  // -------------------------------------------------------------
  // TEST 8: Suspended Account Login Attempt
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.3.1',
      },
      body: JSON.stringify({
        email: 'reader@shubban.com',
        password: 'any_password_here',
      }),
    });

    const data = await res.json();
    if (res.status === 403 && data.error && data.error.includes('সাময়িকভাবে স্থগিত')) {
      recordTest(
        'AUTH-08',
        'Suspended Account Login Block',
        'Account Security & Status',
        'PASS',
        'Status 403 Forbidden with suspended message',
        `Status ${res.status}: ${data.error}`
      );
    } else {
      recordTest(
        'AUTH-08',
        'Suspended Account Login Block',
        'Account Security & Status',
        'FAIL',
        'Status 403 Forbidden with suspended message',
        `Status ${res.status}, error: ${data.error}`
      );
    }
  } catch (err) {
    recordTest('AUTH-08', 'Suspended Account Login Block', 'Account Security & Status', 'FAIL', 'Status 403', err.message);
  }

  // -------------------------------------------------------------
  // TEST 9: Invalid Password Handling
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.3.2',
      },
      body: JSON.stringify({
        email: 'qa_publisher@shubban.com',
        password: 'IncorrectPassword999!',
      }),
    });

    const data = await res.json();
    if (res.status === 401 && data.error && data.error.includes('ভুল ইমেইল বা পাসওয়ার্ড')) {
      recordTest(
        'AUTH-09',
        'Invalid Credentials Authentication Rejection',
        'Credential Verification',
        'PASS',
        'Status 401 Unauthorized',
        `Status ${res.status}: ${data.error}`
      );
    } else {
      recordTest(
        'AUTH-09',
        'Invalid Credentials Authentication Rejection',
        'Credential Verification',
        'FAIL',
        'Status 401 Unauthorized',
        `Status ${res.status}, error: ${data.error}`
      );
    }
  } catch (err) {
    recordTest('AUTH-09', 'Invalid Credentials Authentication Rejection', 'Credential Verification', 'FAIL', 'Status 401', err.message);
  }

  // -------------------------------------------------------------
  // TEST 10: Open Redirect Attack Prevention
  // -------------------------------------------------------------
  try {
    const maliciousUrls = [
      'https://evil-attacker.com/steal-session',
      '//malicious-phishing.org',
      'javascript:alert(1)',
    ];

    let allSanitized = true;
    let idx = 0;
    for (const evilUrl of maliciousUrls) {
      idx++;
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': `10.0.4.${idx}`,
        },
        body: JSON.stringify({
          email: 'qa_publisher@shubban.com',
          password: 'Password123!',
          portal: 'publisher',
          redirect: evilUrl,
        }),
      });

      const data = await res.json();
      if (!data.redirectTo || data.redirectTo.includes('evil') || data.redirectTo.includes('javascript') || data.redirectTo.startsWith('//')) {
        allSanitized = false;
        break;
      }
    }

    if (allSanitized) {
      recordTest(
        'AUTH-10',
        'Open Redirect Sanitization and Vulnerability Prevention',
        'Security & Hardening',
        'PASS',
        'All external and protocol-relative redirect URLs sanitized to internal path',
        'All malicious redirect vectors safely sanitized'
      );
    } else {
      recordTest(
        'AUTH-10',
        'Open Redirect Sanitization and Vulnerability Prevention',
        'Security & Hardening',
        'FAIL',
        'All external redirect URLs sanitized',
        'Malicious redirect was accepted'
      );
    }
  } catch (err) {
    recordTest('AUTH-10', 'Open Redirect Sanitization', 'Security & Hardening', 'FAIL', 'Sanitized redirect', err.message);
  }

  // -------------------------------------------------------------
  // TEST 11: Forgot Password OTP Generation Flow
  // -------------------------------------------------------------
  let generatedOtp = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.5.1',
      },
      body: JSON.stringify({ email: 'qa_reset@shubban.com' }),
    });

    const data = await res.json();
    if (res.status === 200 && data.success && data.demoToken) {
      generatedOtp = data.demoToken;
      recordTest(
        'AUTH-11',
        'Forgot Password OTP Generation Flow',
        'Password Recovery',
        'PASS',
        'Status 200, OTP token generated',
        `Status ${res.status}, OTP: ${generatedOtp}`
      );
    } else {
      recordTest(
        'AUTH-11',
        'Forgot Password OTP Generation Flow',
        'Password Recovery',
        'FAIL',
        'Status 200 with demoToken',
        `Status ${res.status}, error: ${data.error}`
      );
    }
  } catch (err) {
    recordTest('AUTH-11', 'Forgot Password OTP Generation Flow', 'Password Recovery', 'FAIL', 'Status 200', err.message);
  }

  // -------------------------------------------------------------
  // TEST 12: Password Reset Execution Flow
  // -------------------------------------------------------------
  const updatedPassword = 'BrandNewPassword456!';
  try {
    if (!generatedOtp) {
      throw new Error('OTP was not generated in previous step');
    }

    const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.5.2',
      },
      body: JSON.stringify({
        email: 'qa_reset@shubban.com',
        token: generatedOtp,
        newPassword: updatedPassword,
      }),
    });

    const data = await res.json();

    // Verify login with new password succeeds
    const verifyRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '10.0.5.3',
      },
      body: JSON.stringify({
        email: 'qa_reset@shubban.com',
        password: updatedPassword,
      }),
    });

    if (res.status === 200 && data.success && verifyRes.status === 200) {
      recordTest(
        'AUTH-12',
        'Password Reset Execution and Re-Authentication',
        'Password Recovery',
        'PASS',
        'Status 200, password updated and login succeeds with new password',
        `Reset Status ${res.status}, Re-Login Status ${verifyRes.status}`
      );
    } else {
      recordTest(
        'AUTH-12',
        'Password Reset Execution and Re-Authentication',
        'Password Recovery',
        'FAIL',
        'Status 200, login succeeds with new password',
        `Reset Status ${res.status}, Re-Login Status ${verifyRes.status}`
      );
    }
  } catch (err) {
    recordTest('AUTH-12', 'Password Reset Execution and Re-Authentication', 'Password Recovery', 'FAIL', 'Status 200', err.message);
  }

  // -------------------------------------------------------------
  // TEST 13: Session User Inspection via /api/auth/me
  // -------------------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: adminAuthCookie,
        'x-forwarded-for': '10.0.6.1',
      },
    });

    const data = await res.json();
    if (
      res.status === 200 &&
      data.user &&
      data.user.email === 'admin@shubban.com' &&
      data.user.workspaces?.length > 0 &&
      data.user.isStaff === true
    ) {
      recordTest(
        'AUTH-13',
        'Current Session Identity & Entitlements (/api/auth/me)',
        'Session Synchronization',
        'PASS',
        'Status 200, user profile with workspaces & isStaff',
        `Status ${res.status}, user: ${data.user.email}, workspaces: ${data.user.workspaces.length}`
      );
    } else {
      recordTest(
        'AUTH-13',
        'Current Session Identity & Entitlements (/api/auth/me)',
        'Session Synchronization',
        'FAIL',
        'Status 200 with user profile and workspaces',
        `Status ${res.status}`
      );
    }
  } catch (err) {
    recordTest('AUTH-13', 'Current Session Identity & Entitlements', 'Session Synchronization', 'FAIL', 'Status 200', err.message);
  }

  // -------------------------------------------------------------
  // TEST 14: All Branded Login Routes Accessibility Check
  // -------------------------------------------------------------
  try {
    const routes = [
      { path: '/admin/login', expectedName: 'Admin Login' },
      { path: '/login', expectedName: 'Customer Login' },
      { path: '/publisher/login', expectedName: 'Publisher Login' },
      { path: '/advertiser/login', expectedName: 'Advertiser Login' },
    ];

    let allAccessible = true;
    for (const r of routes) {
      const res = await fetch(`${BASE_URL}${r.path}`);
      if (res.status !== 200) {
        allAccessible = false;
        break;
      }
    }

    if (allAccessible) {
      recordTest(
        'AUTH-14',
        'All Dedicated Role-Branded Login Pages Available',
        'Frontend Architecture',
        'PASS',
        'All 4 login routes return HTTP 200',
        '/admin/login, /login, /publisher/login, /advertiser/login all 200 OK'
      );
    } else {
      recordTest(
        'AUTH-14',
        'All Dedicated Role-Branded Login Pages Available',
        'Frontend Architecture',
        'FAIL',
        'All 4 login routes return HTTP 200',
        'One or more routes failed'
      );
    }
  } catch (err) {
    recordTest('AUTH-14', 'All Dedicated Role-Branded Login Pages Available', 'Frontend Architecture', 'FAIL', 'All 200 OK', err.message);
  }

  // -------------------------------------------------------------
  // Summary Scorecard
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(' FINAL TEST EXECUTION SUMMARY');
  console.log('================================================================');
  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = total - passed;
  const scorePercent = ((passed / total) * 100).toFixed(1);

  console.log(`Total Tests Run:  ${total}`);
  console.log(`Passed:           ${passed}`);
  console.log(`Failed:           ${failed}`);
  console.log(`Score:            ${scorePercent}%`);
  console.log('================================================================\n');

  return { total, passed, failed, scorePercent, testResults };
}

runTests().catch(console.error);
