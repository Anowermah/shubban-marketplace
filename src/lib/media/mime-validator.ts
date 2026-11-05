import path from 'path';

export type MediaTypeCategory = 'IMAGE' | 'PDF' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'ARCHIVE' | 'OTHER';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedMime?: string;
  category?: MediaTypeCategory;
  extension?: string;
  sanitizedName?: string;
}

// Configurable Max Size limits
export const MEDIA_SIZE_LIMITS: Record<MediaTypeCategory, number> = {
  IMAGE: 15 * 1024 * 1024,      // 15 MB
  PDF: 60 * 1024 * 1024,        // 60 MB
  DOCUMENT: 40 * 1024 * 1024,   // 40 MB
  AUDIO: 60 * 1024 * 1024,      // 60 MB
  VIDEO: 150 * 1024 * 1024,     // 150 MB
  ARCHIVE: 80 * 1024 * 1024,    // 80 MB
  OTHER: 20 * 1024 * 1024,      // 20 MB
};

// Strict Prohibited extensions (executables, scripts, server-side code)
const FORBIDDEN_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.bin', '.msi',
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phps',
  '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx',
  '.vbs', '.vbe', '.wsf', '.wsh', '.scr', '.ps1', '.py',
  '.jar', '.war', '.ear', '.dll', '.so', '.dylib', '.jsp', '.asp', '.aspx',
]);

export function sanitizeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, '_')
    .slice(0, 50);
  return `${baseName}${ext}`;
}

export function detectMagicBytes(buffer: Uint8Array): { mime: string; category: MediaTypeCategory } | null {
  if (buffer.length < 4) return null;

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', category: 'IMAGE' };
  }

  // 2. PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mime: 'image/png', category: 'IMAGE' };
  }

  // 3. GIF: GIF87a or GIF89a (47 49 46 38)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return { mime: 'image/gif', category: 'IMAGE' };
  }

  // 4. WEBP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', category: 'IMAGE' };
  }

  // 5. PDF: %PDF (25 50 44 46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return { mime: 'application/pdf', category: 'PDF' };
  }

  // 6. MP3: ID3 (49 44 33) or MPEG sync frame (FF FB / FF F3 / FF F2)
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
    (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xf3 || buffer[1] === 0xf2))
  ) {
    return { mime: 'audio/mpeg', category: 'AUDIO' };
  }

  // 7. WAV: RIFF .... WAVE
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x41 && buffer[10] === 0x56 && buffer[11] === 0x45
  ) {
    return { mime: 'audio/wav', category: 'AUDIO' };
  }

  // 8. OGG: OggS (4F 67 67 53)
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return { mime: 'audio/ogg', category: 'AUDIO' };
  }

  // 9. FLAC: fLaC (66 4C 61 43)
  if (buffer[0] === 0x66 && buffer[1] === 0x4c && buffer[2] === 0x61 && buffer[3] === 0x43) {
    return { mime: 'audio/flac', category: 'AUDIO' };
  }

  // 10. MP4 / MOV / M4A / AVIF: ....ftyp
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
  ) {
    const brand = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
    if (brand.startsWith('avif')) {
      return { mime: 'image/avif', category: 'IMAGE' };
    }
    if (brand.startsWith('M4A') || brand.startsWith('m4a')) {
      return { mime: 'audio/mp4', category: 'AUDIO' };
    }
    if (brand.startsWith('qt')) {
      return { mime: 'video/quicktime', category: 'VIDEO' };
    }
    return { mime: 'video/mp4', category: 'VIDEO' };
  }

  // 11. WebM / Matroska: 1A 45 DF A3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return { mime: 'video/webm', category: 'VIDEO' };
  }

  // 12. ZIP / Office Open XML (DOCX, XLSX, PPTX): PK\x03\x04 (50 4B 03 04)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return { mime: 'application/zip', category: 'ARCHIVE' };
  }

  // 13. RAR: Rar! (52 61 72 21)
  if (buffer[0] === 0x52 && buffer[1] === 0x61 && buffer[2] === 0x72 && buffer[3] === 0x21) {
    return { mime: 'application/vnd.rar', category: 'ARCHIVE' };
  }

  // 14. Plain text / UTF-8 text or SVG check
  const textSample = Buffer.from(buffer.slice(0, 1024)).toString('utf8');
  if (textSample.includes('<svg') && (textSample.includes('xmlns=') || textSample.includes('viewBox='))) {
    // Validate SVG doesn't contain scripts
    const lower = textSample.toLowerCase();
    if (
      lower.includes('<script') ||
      lower.includes('onload=') ||
      lower.includes('onerror=') ||
      lower.includes('javascript:')
    ) {
      return null; // Malicious SVG
    }
    return { mime: 'image/svg+xml', category: 'IMAGE' };
  }

  return null;
}

export function validateUploadFile(
  filename: string,
  buffer: Buffer,
  declaredType?: string
): ValidationResult {
  const ext = path.extname(filename).toLowerCase();

  // 1. Check prohibited extensions
  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `নিরাপত্তা ঝুঁকি: '${ext}' এক্সটেনশনের এক্সিকিউটেবল ফাইল আপলোড সম্পূর্ণ নিষিদ্ধ।`,
    };
  }

  // 2. Binary Magic Bytes inspection
  const detected = detectMagicBytes(new Uint8Array(buffer));
  let category: MediaTypeCategory = 'OTHER';
  let mime = declaredType || 'application/octet-stream';

  if (detected) {
    category = detected.category;
    mime = detected.mime;

    // Distinguish DOCX/XLSX/PPTX from generic ZIP based on extension
    if (mime === 'application/zip') {
      if (['.docx', '.doc'].includes(ext)) {
        category = 'DOCUMENT';
        mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (['.xlsx', '.xls'].includes(ext)) {
        category = 'DOCUMENT';
        mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (['.pptx', '.ppt'].includes(ext)) {
        category = 'DOCUMENT';
        mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      }
    }
  } else {
    // Fallback for plain text
    if (ext === '.txt') {
      category = 'DOCUMENT';
      mime = 'text/plain';
    } else {
      return {
        valid: false,
        error: `অননুমোদিত বা অবাস্তব ফাইল ফরম্যাট: '${filename}'। ফাইলটি বৈধ ইমেজ, পিডিএফ, ডকুমেন্ট, অডিও বা ভিডিও হতে হবে।`,
      };
    }
  }

  // 3. Size limit check based on category
  const maxLimit = MEDIA_SIZE_LIMITS[category] || MEDIA_SIZE_LIMITS.OTHER;
  if (buffer.length > maxLimit) {
    const limitMb = Math.round(maxLimit / (1024 * 1024));
    return {
      valid: false,
      error: `ফাইল সাইজ সীমা অতিক্রম করেছে। ${category} ফাইলের সর্বোচ্চ অনুমোদিত সাইজ ${limitMb}MB।`,
    };
  }

  return {
    valid: true,
    detectedMime: mime,
    category,
    extension: ext,
    sanitizedName: sanitizeFileName(filename),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

