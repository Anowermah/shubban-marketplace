import path from 'path';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  sanitizedName?: string;
  detectedType?: string;
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE = 30 * 1024 * 1024; // 30MB

export function sanitizeFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_\-\u0980-\u09FF]/g, '_')
    .slice(0, 50);
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${baseName}-${uniqueSuffix}${ext}`;
}

export function validateMagicBytes(buffer: Uint8Array): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 (0x89 'P' 'N' 'G')
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // PDF: 25 50 44 46 ('%PDF')
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return 'application/pdf';
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

export function validateUploadFile(
  file: { name: string; size: number; type: string },
  buffer: Uint8Array
): FileValidationResult {
  // 1. Check declared MIME type
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `অননুমোদিত ফাইল ফরম্যাট: ${file.type}। শুধুমাত্র JPG, PNG, WebP এবং PDF সমর্থিত।`,
    };
  }

  // 2. Validate file size limits
  const isPdf = file.type === 'application/pdf';
  const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `ফাইল সাইজ অনুমোদিত সীমার অতিরিক্ত। সর্বোচ্চ সাইজ: ${
        isPdf ? '30MB' : '5MB'
      }।`,
    };
  }

  // 3. Inspect actual binary magic bytes (anti-spoofing)
  const detectedMime = validateMagicBytes(buffer);
  if (!detectedMime) {
    return {
      valid: false,
      error: 'ফাইলের ভেতরের বাইনারি স্বাক্ষর (Magic Bytes) অবৈধ বা করাপ্টেড।',
    };
  }

  // If claimed MIME doesn't match detected MIME
  if (detectedMime !== file.type) {
    return {
      valid: false,
      error: `ফাইলের ধরন ও বাইনারি হেডারের মধ্যে অমিল সনাক্ত হয়েছে (${file.type} vs ${detectedMime})।`,
    };
  }

  // 4. Sanitize file name preventing path traversal
  const sanitizedName = sanitizeFileName(file.name);

  return {
    valid: true,
    sanitizedName,
    detectedType: detectedMime,
  };
}

