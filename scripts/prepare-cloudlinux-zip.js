// scripts/prepare-cloudlinux-zip.js — Prepares a CloudLinux-compliant ZIP without node_modules
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');

function copyRecursiveSync(src, dest, ignoreList = []) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      if (ignoreList.includes(childItemName)) return;
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName), ignoreList);
    });
  } else if (exists) {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('🚀 Creating CloudLinux-compliant package for cPanel...');

const stagingDir = path.join(rootDir, 'cpanel-staging');
if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// 1. Copy essential folders
const foldersToCopy = [
  { src: '.next', ignore: ['cache'] },
  { src: 'public', ignore: [] },
  { src: 'prisma', ignore: ['dev.db', 'dev.db-journal', 'dev.db-wal', 'dev.db-shm', 'dev.db.bak', 'dev.db.bak2', 'dev.db.category_backup'] },
];

foldersToCopy.forEach(({ src, ignore }) => {
  const srcPath = path.join(rootDir, src);
  const destPath = path.join(stagingDir, src);
  if (fs.existsSync(srcPath)) {
    console.log(`📦 Copying ${src}...`);
    copyRecursiveSync(srcPath, destPath, ignore);
  }
});

// 2. TRIPLE REDUNDANCY: Copy .next/static into public/_next/static
// This allows Apache/LiteSpeed on cPanel to serve CSS/JS directly with zero Node.js overhead!
const nextStaticSrc = path.join(rootDir, '.next', 'static');
const publicNextStaticDest = path.join(stagingDir, 'public', '_next', 'static');
if (fs.existsSync(nextStaticSrc)) {
  console.log('⚡ Copying .next/static -> public/_next/static (Apache direct static serving)...');
  copyRecursiveSync(nextStaticSrc, publicNextStaticDest);
}

// 3. Copy individual root files
const filesToCopy = ['server.js', 'package.json', 'package-lock.json', 'next.config.mjs'];
filesToCopy.forEach(f => {
  const src = path.join(rootDir, f);
  if (fs.existsSync(src)) {
    console.log(`📦 Copying ${f}...`);
    fs.copyFileSync(src, path.join(stagingDir, f));
  }
});

// 4. Create Apache .htaccess for Next.js static asset rewriting & Passenger
const htaccessContent = `# DO NOT REMOVE. CLOUDLINUX PASSENGER CONFIGURATION
PassengerAppType node
PassengerStartupFile server.js

# Next.js Static Asset Optimization for Apache/LiteSpeed
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^_next/static/(.*)$ public/_next/static/$1 [L]
</IfModule>
`;
fs.writeFileSync(path.join(stagingDir, '.htaccess'), htaccessContent, 'utf8');
console.log('📦 Created optimized .htaccess for Apache static routing...');

// 5. Use .env.cpanel as the .env for production and enforce PostgreSQL schema
const envCpanel = path.join(rootDir, '.env.cpanel');
const envDest = path.join(stagingDir, '.env');
if (fs.existsSync(envCpanel)) {
  console.log('📦 Copying .env.cpanel → .env ...');
  fs.copyFileSync(envCpanel, envDest);
} else {
  console.warn('⚠️ .env.cpanel not found! Copying .env as fallback...');
  fs.copyFileSync(path.join(rootDir, '.env'), envDest);
}

// 5b. Ensure staging prisma/schema.prisma is configured for PostgreSQL
const pgSchemaSrc = path.join(rootDir, 'prisma', 'schema.postgresql.prisma');
const stagingPrismaSchema = path.join(stagingDir, 'prisma', 'schema.prisma');
if (fs.existsSync(pgSchemaSrc)) {
  console.log('🐘 Setting production Prisma schema provider to PostgreSQL...');
  fs.copyFileSync(pgSchemaSrc, stagingPrismaSchema);
}

// 6. Create zip using PowerShell Compress-Archive
const zipPath = path.join(rootDir, 'shubban-cpanel-cloudlinux.zip');
if (fs.existsSync(zipPath)) {
  try {
    fs.unlinkSync(zipPath);
  } catch (e) {
    console.log('Unlink failed, will overwrite via Compress-Archive');
  }
}

console.log('🗜️ Compressing to shubban-cpanel-cloudlinux.zip...');
execSync(
  `powershell -Command "Get-ChildItem -Path '${stagingDir}' -Force | Compress-Archive -DestinationPath '${zipPath}' -Force"`,
  { stdio: 'inherit' }
);

// Clean up staging
fs.rmSync(stagingDir, { recursive: true, force: true });

const stat = fs.statSync(zipPath);
const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
console.log(`\n✅ Successfully generated: shubban-cpanel-cloudlinux.zip (${sizeMB} MB)`);
console.log('💡 Contains NO node_modules — fully CloudLinux-compliant!');
console.log('💡 Contains public/_next/static and .htaccess for guaranteed Apache CSS/JS serving!');
console.log('💡 Contains enhanced server.js for fail-safe streaming of static assets!');
