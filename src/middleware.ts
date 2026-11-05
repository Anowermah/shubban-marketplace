import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  membershipTier: string;
  isStaff?: boolean;
  isPublisher?: boolean;
  isAdvertiser?: boolean;
  isVendor?: boolean;
  workspaces?: string[];
  exp?: number;
}

function sanitizeRedirectUrl(url: string | null | undefined, fallback: string = '/'): string {
  if (!url) return fallback;
  const trimmed = url.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  const pathPart = trimmed.split('?')[0].split('#')[0];
  if (pathPart.includes(':') || pathPart.includes('\\')) {
    return fallback;
  }
  return trimmed;
}

function parseJwtPayload(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    // Check expiration if present
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed;
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('shubban_auth_token')?.value;
  const user = token ? parseJwtPayload(token) : null;

  // 1. CSRF Protection for state-changing API mutations
  if (
    pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
    !pathname.startsWith('/api/webhooks/') // Webhooks use HMAC signatures
  ) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        const originHostname = originUrl.hostname.toLowerCase();
        const hostWithoutPort = host.split(':')[0].toLowerCase();
        const isLocal =
          (originHostname === 'localhost' || originHostname === '127.0.0.1') &&
          (hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1');

        if (originUrl.host.toLowerCase() !== host.toLowerCase() && !isLocal) {
          return NextResponse.json(
            { error: 'CSRF Cross-Origin Violation Blocked' },
            { status: 403 }
          );
        }
      } catch (e) {
        // Invalid origin header format
      }
    }
  }

  const adminStaffRoles = [
    'SUPER_ADMIN',
    'ADMIN',
    'STORE_MANAGER',
    'FINANCE_MANAGER',
    'EDITOR',
    'MAGAZINE_ADMIN',
    'CUSTOMER_SUPPORT',
    'MODERATOR',
    'STAFF',
  ];

  // 2. Protect Admin Routes (/admin/*)
  if (pathname.startsWith('/admin')) {
    // PWA Manifest, Service Worker & Offline fallback exemptions
    if (
      pathname === '/admin/manifest.webmanifest' ||
      pathname === '/admin/sw.js' ||
      pathname === '/admin/offline'
    ) {
      return NextResponse.next();
    }

    // Dedicated Admin Login route exemption
    if (pathname === '/admin/login') {
      if (user) {
        if (adminStaffRoles.includes(user.role) || user.isStaff) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }
      return NextResponse.next();
    }

    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', sanitizeRedirectUrl(pathname, '/admin'));
      return NextResponse.redirect(loginUrl);
    }

    if (!adminStaffRoles.includes(user.role) && !user.isStaff) {
      const accountUrl = new URL('/account', request.url);
      accountUrl.searchParams.set('error', 'unauthorized_admin');
      return NextResponse.redirect(accountUrl);
    }
  }

  // 3. Protect Publisher Dashboard Routes (/publisher/dashboard/*)
  if (pathname.startsWith('/publisher/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/publisher/login', request.url);
      loginUrl.searchParams.set('redirect', sanitizeRedirectUrl(pathname, '/publisher/dashboard'));
      return NextResponse.redirect(loginUrl);
    }

    const publisherRoles = ['PUBLISHER', 'MAGAZINE_ADMIN', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'];
    if (!publisherRoles.includes(user.role) && !user.isPublisher) {
      const loginUrl = new URL('/publisher/login', request.url);
      loginUrl.searchParams.set('error', 'unauthorized_publisher');
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Protect Seller Dashboard Routes (/seller/dashboard/*)
  if (pathname.startsWith('/seller/dashboard')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', sanitizeRedirectUrl(pathname, '/seller/dashboard'));
      return NextResponse.redirect(loginUrl);
    }

    const sellerRoles = ['PUBLISHER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'];
    if (!sellerRoles.includes(user.role) && !user.isVendor) {
      const applyUrl = new URL('/seller/apply', request.url);
      applyUrl.searchParams.set('msg', 'become_seller_first');
      return NextResponse.redirect(applyUrl);
    }
  }

  // 5. Protect Customer Account Routes (/account/*)
  if (pathname.startsWith('/account')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', sanitizeRedirectUrl(pathname, '/account'));
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // Inject security headers on every response
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/publisher/dashboard/:path*',
    '/seller/dashboard/:path*',
    '/account/:path*',
    '/api/:path*',
  ],
};
