/**
 * Shubban Library - Master Test Suite Runner
 * Executes all automated test suites sequentially and aggregates the results.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const suites = [
  { name: 'Order, Inventory & Payment Operations', script: 'test-order-inventory-payment.js' },
  { name: 'Multi-Vendor Seller Data Isolation', script: 'test-seller-isolation.js' },
  { name: 'Financial Ledger & Logistics Operations', script: 'test-financial-and-logistics.js' },
  { name: 'CMS, Publishing & Donation System', script: 'test-cms-and-donations.js' },
  { name: 'DevSecOps, Security, Rate Limiting & Concurrency', script: 'test-security-and-concurrency.js' },
  { name: 'AI Autonomous Management System', script: 'test-ai-autonomous-system.js' },
  { name: 'Advanced Islamic AI Knowledge Assistant', script: 'test-islamic-ai.js' },
  { name: 'Public Islamic AI Assistant & Search APIs', script: 'test-public-islamic-ai.js' },
  { name: 'Courier & Delivery Management System', script: 'test-courier-and-delivery.js' },
  { name: 'Admin-Controlled Manual Courier Booking', script: 'test-admin-manual-courier-booking.js' },
];

console.log('='.repeat(70));
console.log('   SHUBBAN LIBRARY — PRODUCTION VERIFICATION TEST RUNNER');
console.log('='.repeat(70));
console.log(`Starting execution of ${suites.length} automated test suites...\n`);

let totalPassed = 0;
let totalFailed = 0;
const results = [];

for (const suite of suites) {
  console.log(`\n>>> Running: ${suite.name} (${suite.script})`);
  const scriptPath = path.join(__dirname, suite.script);
  
  const startTime = Date.now();
  const res = spawnSync(process.execPath, [scriptPath], {
    stdio: 'inherit',
    env: process.env,
  });
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  if (res.status === 0) {
    results.push({ name: suite.name, status: 'PASSED', duration: `${duration}s` });
  } else {
    results.push({ name: suite.name, status: 'FAILED', duration: `${duration}s`, code: res.status });
    totalFailed++;
  }
}

console.log('\n' + '='.repeat(70));
console.log('   AUTOMATED TEST RUN SUMMARY');
console.log('='.repeat(70));
results.forEach(r => {
  const badge = r.status === 'PASSED' ? '[OK] PASS' : '[X] FAIL';
  console.log(`${badge.padEnd(12)} | ${r.duration.padStart(6)} | ${r.name}`);
});
console.log('-'.repeat(70));

if (totalFailed === 0) {
  console.log('ALL TEST SUITES PASSED! System verified against production test matrix.\n');
  process.exit(0);
} else {
  console.error(`FAILURE: ${totalFailed} test suite(s) failed.\n`);
  process.exit(1);
}

