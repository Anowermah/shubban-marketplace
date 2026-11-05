import path from 'path';
import sharp from 'sharp';

export interface AdCreativeValidationOptions {
  format?: string;
  maxSizeBytes?: number;
}

export interface AdCreativeValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
  detectedMime?: string;
  width?: number;
  height?: number;
  optimizedBuffer?: Buffer;
}

const ALLOWED_AD_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const MAX_BANNER_SIZE = 4 * 1024 * 1024; // 4MB

/**
 * Validate destination URL against unsafe protocols, javascript execution, or malformed redirects
 */
export function validateDestinationUrl(rawUrl: string): { valid: boolean; error?: string; cleanUrl?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'বিজ্ঞাপনের গন্তব্য লিঙ্ক (Destination URL) আবশ্যক।' };
  }

  const trimmed = rawUrl.trim();
  const lower = trimmed.toLowerCase();

  // Reject unsafe schemes
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return { valid: false, error: 'অনিরাপদ ইউআরএল স্কিম অনুমোদিত নয়।' };
  }

  // Ensure valid URL object with http or https protocol
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'ইউআরএল শুধুমাত্র http:// অথবা https:// প্রটোকল সমর্থন করে।' };
    }
    return { valid: true, cleanUrl: parsed.href };
  } catch {
    return { valid: false, error: 'সঠিক ও পূর্ণাঙ্গ ওয়েবসাইট ইউআরএল দিন (যেমন: https://example.com)।' };
  }
}

/**
 * Inspect magic bytes for image signature verification
 */
export function detectImageMimeFromBytes(buffer: Uint8Array): string | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  // GIF: GIF87a or GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return 'image/gif';
  }

  return null;
}

/**
 * Validates, optimizes, and processes ad creative image files using Sharp
 */
export async function validateAndProcessAdCreative(
  originalFilename: string,
  buffer: Buffer,
  options: AdCreativeValidationOptions = {}
): Promise<AdCreativeValidationResult> {
  const maxBytes = options.maxSizeBytes || MAX_BANNER_SIZE;

  if (!buffer || buffer.length === 0) {
    return { valid: false, error: 'বিজ্ঞাপনের ফাইল খালি বা পাওয়া যায়নি।' };
  }

  if (buffer.length > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `বিজ্ঞাপনের ফাইলের আকার সর্বোচ্চ ${maxMb}MB হতে পারবে।` };
  }

  // 1. Signature validation
  const detectedMime = detectImageMimeFromBytes(buffer);
  if (!detectedMime || !ALLOWED_AD_MIMES.has(detectedMime)) {
    return {
      valid: false,
      error: 'অবৈধ ফাইল ফরম্যাট। শুধুমাত্র JPG, PNG, WebP অথবা GIF ব্যানার গ্রহণযোগ্য।',
    };
  }

  // 2. Sharp Image Processing & Metadata extraction
  try {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      return { valid: false, error: 'ছবির সঠিক মাত্রা (Dimensions) নির্ণয় করা যায়নি।' };
    }

    // Convert/optimize to progressive WebP if not GIF
    let optimizedBuffer: Buffer;
    if (detectedMime === 'image/gif') {
      optimizedBuffer = buffer;
    } else {
      optimizedBuffer = await image
        .webp({ quality: 85, effort: 4 })
        .toBuffer();
    }

    // 3. Generate secure safe filename
    const ext = detectedMime === 'image/gif' ? '.gif' : '.webp';
    const cleanBase = path
      .basename(originalFilename, path.extname(originalFilename))
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const sanitizedFilename = `ad_${cleanBase}_${uniqueSuffix}${ext}`;

    return {
      valid: true,
      sanitizedFilename,
      detectedMime: detectedMime === 'image/gif' ? 'image/gif' : 'image/webp',
      width: metadata.width,
      height: metadata.height,
      optimizedBuffer,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: 'ফাইলটি প্রসেস করতে ব্যর্থ হয়েছে। ছবিটি ক্ষতিগ্রস্থ হতে পারে।',
    };
  }
}

