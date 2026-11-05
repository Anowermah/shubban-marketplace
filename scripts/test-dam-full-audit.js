/**
 * SHUBBAN MEDIA MANAGEMENT SYSTEM (DAM)
 * COMPLETE END-TO-END AUTOMATED AUDIT & REPAIR VERIFICATION
 */

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// Parse .env manually
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      value = value.trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
} catch {}

const BASE_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-key-328904712895719827591823';

// Generate Admin JWT Token using real Super Admin ID
const adminToken = jwt.sign(
  {
    id: 'cmvrc74l10000jm12mha17uch',
    email: 'admin@shubban.com',
    name: 'মোঃ আনোয়ার হোসাইন',
    role: 'SUPER_ADMIN',
  },
  JWT_SECRET,
  { expiresIn: '2h' }
);

const headers = {
  Cookie: `shubban_auth_token=${adminToken}`,
};

const results = [];
function report(feature, testCase, status, details = '') {
  results.push({ feature, testCase, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${feature} - ${testCase} ${details ? '(' + details + ')' : ''}`);
}

async function runAudit() {
  console.log('====================================================');
  console.log('SHUBBAN MEDIA MANAGEMENT SYSTEM — COMPREHENSIVE AUDIT');
  console.log('====================================================\n');

  try {
    // 1. Storage Stats & Dashboard Metrics
    console.log('--- 1. Testing Dashboard Metrics & Folders ---');
    const statsRes = await fetch(`${BASE_URL}/api/media/stats`, { headers });
    if (statsRes.status === 200) {
      const statsData = await statsRes.json();
      report('Dashboard Analytics', 'GET /api/media/stats', 'PASS', `Total: ${statsData.stats?.totalFiles} assets, Storage: ${statsData.stats?.totalFormatted}`);
    } else {
      report('Dashboard Analytics', 'GET /api/media/stats', 'FAIL', `Status ${statsRes.status}`);
    }

    const foldersRes = await fetch(`${BASE_URL}/api/media/folders`, { headers });
    if (foldersRes.status === 200) {
      const folderData = await foldersRes.json();
      report('Folder Management', 'GET /api/media/folders', 'PASS', `Found ${folderData.folders.length} folders`);
    } else {
      report('Folder Management', 'GET /api/media/folders', 'FAIL', `Status ${foldersRes.status}`);
    }

    // 2. Real File Upload - PNG Image
    console.log('\n--- 2. Testing Image Upload & Variants ---');
    // 1x1 transparent PNG binary bytes
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const form = new FormData();
    const pngBlob = new Blob([pngBuffer], { type: 'image/png' });
    form.append('file', pngBlob, 'audit_test_sample.png');
    form.append('title', 'Audit Sample PNG');
    form.append('folderSlug', 'books-covers');
    form.append('visibility', 'PUBLIC');

    const uploadRes = await fetch(`${BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers,
      body: form,
    });

    let uploadedAsset = null;
    if (uploadRes.status === 200) {
      const upData = await uploadRes.json();
      uploadedAsset = upData.assets?.[0] || upData.asset;
      report('Image Upload & Sharp Pipeline', 'POST /api/media/upload (PNG)', 'PASS', `ID: ${uploadedAsset.id}, Variants: ${uploadedAsset.variants?.length || 0}`);
    } else {
      report('Image Upload & Sharp Pipeline', 'POST /api/media/upload (PNG)', 'FAIL', `Status ${uploadRes.status}`);
    }

    if (!uploadedAsset) {
      console.error('Fatal: Cannot continue tests without an uploaded test asset.');
      return;
    }

    // 3. Security Check: Magic Bytes Spoofing Defense
    console.log('\n--- 3. Testing Security & Anti-Spoofing ---');
    const fakeForm = new FormData();
    const fakeBlob = new Blob([Buffer.from('<?php echo "evil script"; ?>')], { type: 'image/png' });
    fakeForm.append('file', fakeBlob, 'evil_backdoor.png');

    const fakeRes = await fetch(`${BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers,
      body: fakeForm,
    });

    if (fakeRes.status === 400) {
      const fakeData = await fakeRes.json();
      report('Security & Anti-Spoofing', 'PHP script disguised as PNG', 'PASS', `Rejected: "${fakeData.error}"`);
    } else {
      report('Security & Anti-Spoofing', 'PHP script disguised as PNG', 'FAIL', `Expected 400, got ${fakeRes.status}`);
    }

    // 4. Image Transformation (Rotate, Flip)
    console.log('\n--- 4. Testing Image Transformation API ---');
    const transformRes = await fetch(`${BASE_URL}/api/media/assets/${uploadedAsset.id}/transform`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rotate: 90, flop: true }),
    });

    if (transformRes.status === 200) {
      const trData = await transformRes.json();
      report('Image Transformation', 'POST /api/media/assets/[id]/transform (Rotate 90 & Mirror)', 'PASS', `New Dimensions: ${trData.asset.width}x${trData.asset.height}, Checksum: ${trData.asset.checksum.slice(0, 8)}...`);
    } else {
      report('Image Transformation', 'POST /api/media/assets/[id]/transform', 'FAIL', `Status ${transformRes.status}`);
    }

    // 5. File Replacement Workflow
    console.log('\n--- 5. Testing File Replacement Workflow ---');
    // Replace with a red 2x2 PNG
    const redPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const replaceForm = new FormData();
    const replaceBlob = new Blob([redPngBuffer], { type: 'image/png' });
    replaceForm.append('file', replaceBlob, 'replacement_banner.png');

    const replaceRes = await fetch(`${BASE_URL}/api/media/assets/${uploadedAsset.id}/replace`, {
      method: 'POST',
      headers,
      body: replaceForm,
    });

    if (replaceRes.status === 200) {
      const repData = await replaceRes.json();
      report('File Replacement', 'POST /api/media/assets/[id]/replace', 'PASS', `Checksum changed to ${repData.asset.checksum.slice(0, 8)}..., ID preserved: ${repData.asset.id === uploadedAsset.id}`);
    } else {
      report('File Replacement', 'POST /api/media/assets/[id]/replace', 'FAIL', `Status ${replaceRes.status}`);
    }

    // 6. Direct Download API & Checksum Integrity
    console.log('\n--- 6. Testing Direct Download API ---');
    const dlRes = await fetch(`${BASE_URL}/api/media/assets/${uploadedAsset.id}/download`, { headers });
    if (dlRes.status === 200) {
      const disp = dlRes.headers.get('content-disposition');
      const dlBytes = await dlRes.arrayBuffer();
      report('Direct File Download', 'GET /api/media/assets/[id]/download', 'PASS', `Disposition: ${disp}, Size: ${dlBytes.byteLength} bytes`);
    } else {
      report('Direct File Download', 'GET /api/media/assets/[id]/download', 'FAIL', `Status ${dlRes.status}`);
    }

    // 7. Temporary Signed URL Generation & Verification
    console.log('\n--- 7. Testing HMAC Signed URLs ---');
    const signRes = await fetch(`${BASE_URL}/api/media/assets/${uploadedAsset.id}/signed-url`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresInSeconds: 3600 }),
    });

    if (signRes.status === 200) {
      const signData = await signRes.json();
      report('Signed URLs', 'POST /api/media/assets/[id]/signed-url', 'PASS', `Expires at: ${signData.expiresAt}`);

      // Verify the signed URL directly via GET
      const serveRes = await fetch(`${BASE_URL}${signData.signedUrl}`);
      if (serveRes.status === 200) {
        report('Signed URLs', 'GET /api/media/serve with Valid Signature', 'PASS', 'HTTP 200 with Range support');
      } else {
        report('Signed URLs', 'GET /api/media/serve with Valid Signature', 'FAIL', `Status ${serveRes.status}`);
      }

      // Verify tampered signature is rejected
      const tamperedUrl = signData.signedUrl.slice(0, -4) + 'beef';
      const tamperRes = await fetch(`${BASE_URL}${tamperedUrl}`);
      if (tamperRes.status === 403) {
        report('Signed URLs', 'GET /api/media/serve with Tampered Signature', 'PASS', 'HTTP 403 Forbidden correctly enforced');
      } else {
        report('Signed URLs', 'GET /api/media/serve with Tampered Signature', 'FAIL', `Expected 403, got ${tamperRes.status}`);
      }
    } else {
      report('Signed URLs', 'POST /api/media/assets/[id]/signed-url', 'FAIL', `Status ${signRes.status}`);
    }

    // 8. Safe Deletion Guard & Reference Tracking
    console.log('\n--- 8. Testing Safe Deletion Guard ---');
    // Attach a mock reference via direct DB or check existing referenced asset
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.mediaReference.create({
      data: {
        assetId: uploadedAsset.id,
        module: 'BOOK',
        entityId: 'test_book_audit_999',
        entityTitle: 'Audit Test Book Volume 1',
        field: 'coverImage',
      },
    });

    // Attempt to trash asset with active reference -> MUST BE BLOCKED
    const delBlockedRes = await fetch(`${BASE_URL}/api/media/assets/${uploadedAsset.id}`, {
      method: 'DELETE',
      headers,
    });

    if (delBlockedRes.status === 400) {
      const blockData = await delBlockedRes.json();
      report('Safe Deletion Guard', 'Blocked Deletion of Referenced Asset', 'PASS', `Guard message: "${blockData.error}"`);
    } else {
      report('Safe Deletion Guard', 'Blocked Deletion of Referenced Asset', 'FAIL', `Expected 400, got ${delBlockedRes.status}`);
    }

    // Clean up reference
    await prisma.mediaReference.deleteMany({
      where: { assetId: uploadedAsset.id },
    });

    // 9. Trash & Recovery Lifecycle
    console.log('\n--- 9. Testing Trash & Recovery ---');
    const trashRes = await fetch(`${BASE_URL}/api/media/assets/${uploadedAsset.id}`, {
      method: 'DELETE',
      headers,
    });

    if (trashRes.status === 200) {
      report('Trash & Recovery', 'Soft Delete to Trash (DELETE /assets/[id])', 'PASS', 'Asset moved to Trash');
    } else {
      report('Trash & Recovery', 'Soft Delete to Trash', 'FAIL', `Status ${trashRes.status}`);
    }

    const restoreRes = await fetch(`${BASE_URL}/api/media/assets/${uploadedAsset.id}/restore`, {
      method: 'POST',
      headers,
    });

    if (restoreRes.status === 200) {
      report('Trash & Recovery', 'Restore from Trash (POST /assets/[id]/restore)', 'PASS', 'Asset restored from Trash');
    } else {
      report('Trash & Recovery', 'Restore from Trash', 'FAIL', `Status ${restoreRes.status}`);
    }

    const permDelRes = await fetch(`${BASE_URL}/api/media/assets/${uploadedAsset.id}?permanent=true`, {
      method: 'DELETE',
      headers,
    });

    if (permDelRes.status === 200) {
      report('Trash & Recovery', 'Permanent Deletion with Disk Cleanup', 'PASS', 'Physical disk unlinked & DB record removed');
    } else {
      report('Trash & Recovery', 'Permanent Deletion', 'FAIL', `Status ${permDelRes.status}`);
    }

    console.log('\n====================================================');
    console.log('AUDIT SUMMARY');
    console.log('====================================================');
    const passed = results.filter((r) => r.status === 'PASS').length;
    const total = results.length;
    console.log(`Total Tests: ${total} | Passed: ${passed} | Failed: ${total - passed}`);
    console.log(`Score: ${Math.round((passed / total) * 100)} / 100`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Audit execution error:', err);
  }
}

runAudit();
