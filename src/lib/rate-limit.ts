/**
 * High-performance In-Memory Token Bucket / Sliding Window Rate Limiter
 * Suitable for Edge / Node.js Next.js Production deployments.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitOptions {
  limit: number; // Max requests
  windowMs: number; // Time window in milliseconds
  prefix?: string; // Route prefix to namespace limits
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms when the window resets
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}

export function rateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const { limit, windowMs, prefix = 'global' } = options;
  const storeKey = `${prefix}:${key}`;
  const now = Date.now();

  const record = rateLimitStore.get(storeKey);

  if (!record || now > record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(storeKey, newRecord);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: newRecord.resetTime,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    reset: record.resetTime,
  };
}

export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const retryAfter = Math.ceil(Math.max(0, result.reset - Date.now()) / 1000);
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
    ...(result.success ? {} : { 'Retry-After': retryAfter.toString() }),
  };
}

