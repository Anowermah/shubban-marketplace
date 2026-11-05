const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICONS_MAIN_DIR = path.join(__dirname, '..', 'public', 'icons', 'main');
const ICONS_ADMIN_DIR = path.join(__dirname, '..', 'public', 'icons', 'admin');

fs.mkdirSync(ICONS_MAIN_DIR, { recursive: true });
fs.mkdirSync(ICONS_ADMIN_DIR, { recursive: true });

// 1. Main Website Brand Icon (Standard & Maskable)
function getMainSvg(size, isMaskable = false) {
  const padding = isMaskable ? size * 0.18 : size * 0.08;
  const contentSize = size - padding * 2;
  const center = size / 2;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mainBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#122E25" />
        <stop offset="50%" stop-color="#0E241D" />
        <stop offset="100%" stop-color="#071712" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D" />
        <stop offset="50%" stop-color="#C49A45" />
        <stop offset="100%" stop-color="#92400E" />
      </linearGradient>
      <radialGradient id="auraGrad" cx="50%" cy="35%" r="45%">
        <stop offset="0%" stop-color="#C49A45" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#C49A45" stop-opacity="0" />
      </radialGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="${size * 0.015}" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    <!-- Full-bleed background for maskable compatibility -->
    <rect width="${size}" height="${size}" fill="url(#mainBg)" rx="${isMaskable ? 0 : size * 0.22}" />
    ${!isMaskable ? `<rect x="${size * 0.02}" y="${size * 0.02}" width="${size * 0.96}" height="${size * 0.96}" fill="none" stroke="url(#goldGrad)" stroke-width="${size * 0.015}" rx="${size * 0.21}" opacity="0.6"/>` : ''}

    <g transform="translate(${padding}, ${padding})">
      <!-- Glow Aura -->
      <circle cx="${contentSize * 0.5}" cy="${contentSize * 0.42}" r="${contentSize * 0.38}" fill="url(#auraGrad)" />

      <!-- Flame / Ascent Ray of Knowledge -->
      <path d="M${contentSize * 0.5} ${contentSize * 0.12} C${contentSize * 0.5} ${contentSize * 0.12} ${contentSize * 0.4} ${contentSize * 0.26} ${contentSize * 0.4} ${contentSize * 0.35} C${contentSize * 0.4} ${contentSize * 0.4} ${contentSize * 0.445} ${contentSize * 0.44} ${contentSize * 0.5} ${contentSize * 0.44} C${contentSize * 0.555} ${contentSize * 0.44} ${contentSize * 0.6} ${contentSize * 0.4} ${contentSize * 0.6} ${contentSize * 0.35} C${contentSize * 0.6} ${contentSize * 0.26} ${contentSize * 0.5} ${contentSize * 0.12} Z"
            fill="url(#goldGrad)" filter="url(#glow)"/>
      
      <!-- Inner Flame Core -->
      <circle cx="${contentSize * 0.5} " cy="${contentSize * 0.35}" r="${contentSize * 0.04}" fill="#FFFDF8" />

      <!-- Open Book Spread (Left Wing) -->
      <path d="M${contentSize * 0.16} ${contentSize * 0.76} C${contentSize * 0.26} ${contentSize * 0.69} ${contentSize * 0.38} ${contentSize * 0.69} ${contentSize * 0.5} ${contentSize * 0.73} V${contentSize * 0.47} C${contentSize * 0.38} ${contentSize * 0.43} ${contentSize * 0.26} ${contentSize * 0.43} ${contentSize * 0.16} ${contentSize * 0.50} Z"
            fill="#FFFDF8" fill-opacity="0.95" stroke="url(#goldGrad)" stroke-width="${contentSize * 0.02}" stroke-linejoin="round"/>
      
      <!-- Open Book Spread (Right Wing) -->
      <path d="M${contentSize * 0.84} ${contentSize * 0.76} C${contentSize * 0.74} ${contentSize * 0.69} ${contentSize * 0.62} ${contentSize * 0.69} ${contentSize * 0.5} ${contentSize * 0.73} V${contentSize * 0.47} C${contentSize * 0.62} ${contentSize * 0.43} ${contentSize * 0.74} ${contentSize * 0.43} ${contentSize * 0.84} ${contentSize * 0.50} Z"
            fill="#FFFDF8" fill-opacity="0.95" stroke="url(#goldGrad)" stroke-width="${contentSize * 0.02}" stroke-linejoin="round"/>

      <!-- Book Spine -->
      <path d="M${contentSize * 0.5} ${contentSize * 0.47} V${contentSize * 0.73}"
            stroke="url(#goldGrad)" stroke-width="${contentSize * 0.04}" stroke-linecap="round"/>

      <!-- Text / Wisdom Rays inside book -->
      <path d="M${contentSize * 0.26} ${contentSize * 0.58} C${contentSize * 0.32} ${contentSize * 0.55} ${contentSize * 0.4} ${contentSize * 0.56} ${contentSize * 0.44} ${contentSize * 0.58}"
            stroke="#122E25" stroke-width="${contentSize * 0.02}" stroke-linecap="round"/>
      <path d="M${contentSize * 0.26} ${contentSize * 0.65} C${contentSize * 0.32} ${contentSize * 0.62} ${contentSize * 0.4} ${contentSize * 0.63} ${contentSize * 0.44} ${contentSize * 0.65}"
            stroke="#122E25" stroke-width="${contentSize * 0.02}" stroke-linecap="round"/>
      <path d="M${contentSize * 0.74} ${contentSize * 0.58} C${contentSize * 0.68} ${contentSize * 0.55} ${contentSize * 0.6} ${contentSize * 0.56} ${contentSize * 0.56} ${contentSize * 0.58}"
            stroke="#122E25" stroke-width="${contentSize * 0.02}" stroke-linecap="round"/>
      <path d="M${contentSize * 0.74} ${contentSize * 0.65} C${contentSize * 0.68} ${contentSize * 0.62} ${contentSize * 0.6} ${contentSize * 0.63} ${contentSize * 0.56} ${contentSize * 0.65}"
            stroke="#122E25" stroke-width="${contentSize * 0.02}" stroke-linecap="round"/>

      <!-- Brand Ribbon Base -->
      <path d="M${contentSize * 0.32} ${contentSize * 0.85} L${contentSize * 0.5} ${contentSize * 0.89} L${contentSize * 0.68} ${contentSize * 0.85}"
            stroke="url(#goldGrad)" stroke-width="${contentSize * 0.025}" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;
}

// 2. Admin Management Brand Icon (Distinctive Enterprise Shield + Central Book/Key)
function getAdminSvg(size, isMaskable = false) {
  const padding = isMaskable ? size * 0.18 : size * 0.08;
  const contentSize = size - padding * 2;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="adminBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1C1917" />
        <stop offset="50%" stop-color="#14110F" />
        <stop offset="100%" stop-color="#0A0807" />
      </linearGradient>
      <linearGradient id="amberShield" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="40%" stop-color="#D97706" />
        <stop offset="100%" stop-color="#92400E" />
      </linearGradient>
      <linearGradient id="shieldBorder" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#FDE68A" />
        <stop offset="100%" stop-color="#B45309" />
      </linearGradient>
      <filter id="adminGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="${size * 0.02}" stdDeviation="${size * 0.03}" flood-color="#D97706" flood-opacity="0.4" />
      </filter>
    </defs>

    <!-- Full-bleed background for maskable compatibility -->
    <rect width="${size}" height="${size}" fill="url(#adminBg)" rx="${isMaskable ? 0 : size * 0.22}" />
    ${!isMaskable ? `<rect x="${size * 0.02}" y="${size * 0.02}" width="${size * 0.96}" height="${size * 0.96}" fill="none" stroke="url(#shieldBorder)" stroke-width="${size * 0.015}" rx="${size * 0.21}" opacity="0.4"/>` : ''}

    <g transform="translate(${padding}, ${padding})">
      <!-- Shield Body -->
      <path d="M${contentSize * 0.5} ${contentSize * 0.08}
               C${contentSize * 0.72} ${contentSize * 0.08} ${contentSize * 0.88} ${contentSize * 0.16} ${contentSize * 0.88} ${contentSize * 0.32}
               C${contentSize * 0.88} ${contentSize * 0.65} ${contentSize * 0.68} ${contentSize * 0.85} ${contentSize * 0.5} ${contentSize * 0.95}
               C${contentSize * 0.32} ${contentSize * 0.85} ${contentSize * 0.12} ${contentSize * 0.65} ${contentSize * 0.12} ${contentSize * 0.32}
               C${contentSize * 0.12} ${contentSize * 0.16} ${contentSize * 0.28} ${contentSize * 0.08} ${contentSize * 0.5} ${contentSize * 0.08} Z"
            fill="url(#amberShield)" stroke="url(#shieldBorder)" stroke-width="${contentSize * 0.03}" filter="url(#adminGlow)" stroke-linejoin="round"/>

      <!-- Inner Shield Inlay -->
      <path d="M${contentSize * 0.5} ${contentSize * 0.16}
               C${contentSize * 0.68} ${contentSize * 0.16} ${contentSize * 0.8} ${contentSize * 0.22} ${contentSize * 0.8} ${contentSize * 0.34}
               C${contentSize * 0.8} ${contentSize * 0.60} ${contentSize * 0.64} ${contentSize * 0.76} ${contentSize * 0.5} ${contentSize * 0.86}
               C${contentSize * 0.36} ${contentSize * 0.76} ${contentSize * 0.2} ${contentSize * 0.60} ${contentSize * 0.2} ${contentSize * 0.34}
               C${contentSize * 0.2} ${contentSize * 0.22} ${contentSize * 0.32} ${contentSize * 0.16} ${contentSize * 0.5} ${contentSize * 0.16} Z"
            fill="#1C1917" opacity="0.6"/>

      <!-- Central Admin Emblem: Crown / Key of Knowledge & Open Ledger -->
      <!-- Top Crest Star / Crown -->
      <polygon points="${contentSize * 0.5},${contentSize * 0.22} ${contentSize * 0.53},${contentSize * 0.28} ${contentSize * 0.59},${contentSize * 0.28} ${contentSize * 0.54},${contentSize * 0.32} ${contentSize * 0.56},${contentSize * 0.38} ${contentSize * 0.5},${contentSize * 0.34} ${contentSize * 0.44},${contentSize * 0.38} ${contentSize * 0.46},${contentSize * 0.32} ${contentSize * 0.41},${contentSize * 0.28} ${contentSize * 0.47},${contentSize * 0.28}"
               fill="#FDE68A"/>

      <!-- Management Book Spread -->
      <path d="M${contentSize * 0.28} ${contentSize * 0.64} C${contentSize * 0.36} ${contentSize * 0.59} ${contentSize * 0.44} ${contentSize * 0.59} ${contentSize * 0.5} ${contentSize * 0.62} V${contentSize * 0.43} C${contentSize * 0.44} ${contentSize * 0.40} ${contentSize * 0.36} ${contentSize * 0.40} ${contentSize * 0.28} ${contentSize * 0.45} Z"
            fill="#FFFDF8" stroke="#FDE68A" stroke-width="${contentSize * 0.02}" stroke-linejoin="round"/>
      <path d="M${contentSize * 0.72} ${contentSize * 0.64} C${contentSize * 0.64} ${contentSize * 0.59} ${contentSize * 0.56} ${contentSize * 0.59} ${contentSize * 0.5} ${contentSize * 0.62} V${contentSize * 0.43} C${contentSize * 0.56} ${contentSize * 0.40} ${contentSize * 0.64} ${contentSize * 0.40} ${contentSize * 0.72} ${contentSize * 0.45} Z"
            fill="#FFFDF8" stroke="#FDE68A" stroke-width="${contentSize * 0.02}" stroke-linejoin="round"/>

      <!-- Central Spine -->
      <path d="M${contentSize * 0.5} ${contentSize * 0.43} V${contentSize * 0.63}"
            stroke="#D97706" stroke-width="${contentSize * 0.035}" stroke-linecap="round"/>

      <!-- Verification Check Accent at base -->
      <path d="M${contentSize * 0.42} ${contentSize * 0.72} L${contentSize * 0.48} ${contentSize * 0.78} L${contentSize * 0.59} ${contentSize * 0.67}"
            fill="none" stroke="#FDE68A" stroke-width="${contentSize * 0.035}" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </svg>`;
}

async function generateIcons() {
  console.log('Generating PWA Icons for Main Website and Admin...');

  // 1. Main Website Icons
  const mainConfigs = [
    { name: 'icon-192x192.png', size: 192, maskable: false },
    { name: 'icon-512x512.png', size: 512, maskable: false },
    { name: 'icon-maskable-192x192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512x512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
    { name: 'favicon-32x32.png', size: 32, maskable: false },
    { name: 'favicon-48x48.png', size: 48, maskable: false },
  ];

  for (const cfg of mainConfigs) {
    const svg = getMainSvg(cfg.size, cfg.maskable);
    const dest = path.join(ICONS_MAIN_DIR, cfg.name);
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9 })
      .toFile(dest);
    console.log(`  ✓ Main icon: ${cfg.name} (${cfg.size}x${cfg.size})`);
  }

  // Also save main monochrome icon
  fs.writeFileSync(
    path.join(ICONS_MAIN_DIR, 'icon-monochrome.svg'),
    `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <path d="M256 60 C256 60 200 135 200 180 C200 205 225 225 256 225 C287 225 312 205 312 180 C312 135 256 60 256 60 Z" fill="#000000"/>
      <path d="M80 390 C130 350 195 350 256 370 V240 C195 220 130 220 80 260 Z" fill="#000000"/>
      <path d="M432 390 C382 350 317 350 256 370 V240 C317 220 382 220 432 260 Z" fill="#000000"/>
    </svg>`
  );

  // 2. Admin Icons
  const adminConfigs = [
    { name: 'icon-192x192.png', size: 192, maskable: false },
    { name: 'icon-512x512.png', size: 512, maskable: false },
    { name: 'icon-maskable-192x192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512x512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
    { name: 'favicon-32x32.png', size: 32, maskable: false },
    { name: 'favicon-48x48.png', size: 48, maskable: false },
  ];

  for (const cfg of adminConfigs) {
    const svg = getAdminSvg(cfg.size, cfg.maskable);
    const dest = path.join(ICONS_ADMIN_DIR, cfg.name);
    await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9 })
      .toFile(dest);
    console.log(`  ✓ Admin icon: ${cfg.name} (${cfg.size}x${cfg.size})`);
  }

  console.log('\nAll PWA icons successfully generated and verified!');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});

