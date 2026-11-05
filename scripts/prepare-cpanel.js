// scripts/prepare-cpanel.js — Automates standalone packaging for cPanel deployment
const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

console.log('🚀 Preparing Next.js standalone bundle for cPanel...');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');

if (!fs.existsSync(standaloneDir)) {
  console.error('❌ Error: .next/standalone folder not found. Please run "npm run build" first!');
  process.exit(1);
}

// 1. Copy public folder to .next/standalone/public
const publicSrc = path.join(__dirname, '..', 'public');
const publicDest = path.join(standaloneDir, 'public');
console.log('📦 Copying public/ assets to standalone...');
copyRecursiveSync(publicSrc, publicDest);

// 2. Copy .next/static to .next/standalone/.next/static
const staticSrc = path.join(__dirname, '..', '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');
console.log('📦 Copying .next/static to standalone...');
copyRecursiveSync(staticSrc, staticDest);

// 3. Copy prisma schema & sqlite db to .next/standalone/prisma
const prismaSrc = path.join(__dirname, '..', 'prisma');
const prismaDest = path.join(standaloneDir, 'prisma');
console.log('📦 Copying prisma/ schema and database to standalone...');
copyRecursiveSync(prismaSrc, prismaDest);

// 4. Copy .env if exists
const envSrc = path.join(__dirname, '..', '.env');
const envDest = path.join(standaloneDir, '.env');
if (fs.existsSync(envSrc)) {
  console.log('📦 Copying .env to standalone...');
  fs.copyFileSync(envSrc, envDest);
}

// 5. Copy multi-platform Prisma engine binaries to standalone
const prismaClientSrc = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
const prismaClientDest = path.join(standaloneDir, 'node_modules', '.prisma', 'client');
if (fs.existsSync(prismaClientSrc)) {
  console.log('📦 Copying multi-platform Prisma engines (Linux & Windows) to standalone...');
  copyRecursiveSync(prismaClientSrc, prismaClientDest);
}

console.log('\n✅ cPanel Standalone package successfully prepared in: .next/standalone/');
console.log('💡 You can now simply zip the contents of ".next/standalone" and upload to cPanel!');
