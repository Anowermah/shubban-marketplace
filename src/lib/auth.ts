import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'shubban-library-secret-fallback-key';

export interface AuthSessionUser {
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
}

export function signToken(user: AuthSessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthSessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSessionUser;
  } catch (err) {
    return null;
  }
}

export function setAuthCookie(response: any, token: string) {
  response.cookies.set('shubban_auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export function clearAuthCookie(response: any) {
  response.cookies.set('shubban_auth_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
}

export function reissueAuthCookie(user: AuthSessionUser, response: any): string {
  const token = signToken(user);
  setAuthCookie(response, token);
  return token;
}

export async function getSessionUser(): Promise<AuthSessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('shubban_auth_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Strictly sanitize redirect URLs to prevent Open Redirect attacks.
 * Rejects external URLs, protocol-relative URLs (//), backslash variations, and scheme prefixes.
 */
export function sanitizeRedirectUrl(url: string | null | undefined, fallback: string = '/account'): string {
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

export interface UserWorkspace {
  key: 'admin' | 'staff' | 'publisher' | 'advertiser' | 'seller' | 'customer';
  title: string;
  description: string;
  href: string;
  badge?: string;
  isDefault?: boolean;
}

export function resolveUserWorkspaces(user: {
  role: string;
  membershipTier?: string;
  staffProfile?: any;
  advertisersOwned?: any[];
  advertiserMemberships?: any[];
  publisherProfile?: any;
  publisherMemberships?: any[];
  publicationMemberships?: any[];
  vendorMembers?: any[];
}): UserWorkspace[] {
  const workspaces: UserWorkspace[] = [];
  const role = user.role || 'GUEST';

  // 1. Admin Workspace (Super Admin & Admin)
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    workspaces.push({
      key: 'admin',
      title: 'সিস্টেম ও প্ল্যাটফর্ম প্রশাসন',
      description: 'সার্বিক প্ল্যাটফর্ম নিয়ন্ত্রণ, ব্যবহারকারী, সামগ্রী ও রাজস্ব ব্যবস্থাপনা',
      href: '/admin',
      badge: role === 'SUPER_ADMIN' ? 'সুপার অ্যাডমিন' : 'অ্যাডমিনিস্ট্রেটর',
      isDefault: true,
    });
  }

  // 2. Staff Workspace (HRMS & Operations)
  const isStaffRole = [
    'ADMIN',
    'SUPER_ADMIN',
    'STORE_MANAGER',
    'FINANCE_MANAGER',
    'MODERATOR',
    'EDITOR',
    'CUSTOMER_SUPPORT',
    'REVIEWER',
    'STAFF',
  ].includes(role);

  if (user.staffProfile || isStaffRole) {
    if (!workspaces.some((w) => w.key === 'admin')) {
      workspaces.push({
        key: 'staff',
        title: 'স্টাফ ও অপারেশনাল কনসোল',
        description: 'অভ্যন্তরীণ কার্যক্রম, টাস্ক ও ওয়ার্কফ্লো এক্সিকিউশন',
        href: '/admin',
        badge: user.staffProfile?.designation?.name || 'অফিসিয়াল স্টাফ',
        isDefault: true,
      });
    }
  }

  // 3. Publisher & Editorial Workspace
  const hasPublisherProfile = !!user.publisherProfile;
  const hasPublisherMembership = (user.publisherMemberships && user.publisherMemberships.length > 0) || false;
  const hasPublicationMembership = (user.publicationMemberships && user.publicationMemberships.length > 0) || false;
  const isPublisherRole = ['PUBLISHER', 'MAGAZINE_ADMIN', 'EDITOR', 'SUPER_ADMIN', 'ADMIN'].includes(role);

  if (hasPublisherProfile || hasPublisherMembership || hasPublicationMembership || isPublisherRole) {
    const isEditorialStaff = ['SUPER_ADMIN', 'ADMIN', 'MAGAZINE_ADMIN', 'EDITOR'].includes(role);
    workspaces.push({
      key: 'publisher',
      title: 'প্রকাশক ও সাময়িকী কনসোল',
      description: 'বই প্রকাশনা, মাসিক সাময়িকী ও ডিজিটাল জার্নাল সম্পাদনা',
      href: isEditorialStaff ? '/admin/magazines' : '/publisher/dashboard',
      badge: isEditorialStaff ? 'সম্পাদনা পরিষদ' : 'স্বীকৃত প্রকাশক',
      isDefault: workspaces.length === 0,
    });
  }

  // 4. First-Party Ads Network Workspace
  const hasAdvertisersOwned = (user.advertisersOwned && user.advertisersOwned.length > 0) || false;
  const hasAdvertiserMembership = (user.advertiserMemberships && user.advertiserMemberships.length > 0) || false;
  const isAdAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  if (hasAdvertisersOwned || hasAdvertiserMembership || isAdAdmin) {
    workspaces.push({
      key: 'advertiser',
      title: 'বিজ্ঞাপনদাতা পোর্টাল',
      description: 'ফার্স্ট-পার্টি বিজ্ঞাপন ক্যাম্পেইন ও পারফরম্যান্স মেট্রিক্স',
      href: '/advertiser',
      badge: 'বিজ্ঞাপনদাতা',
      isDefault: workspaces.length === 0,
    });
  }

  // 5. Marketplace Vendor / Seller Workspace
  const hasVendorMembership = (user.vendorMembers && user.vendorMembers.length > 0) || false;
  const isSellerRole = ['SELLER', 'PUBLISHER', 'SUPER_ADMIN', 'ADMIN'].includes(role);

  if (hasVendorMembership || isSellerRole) {
    workspaces.push({
      key: 'seller',
      title: 'বিক্রেতা কেন্দ্র (Seller Center)',
      description: 'পণ্য ক্যাটালগ, ইনভেন্টরি, বিক্রেতা অর্ডার ও পে-আউট',
      href: '/seller/dashboard',
      badge: 'মার্কেটপ্লেস ভেন্ডর',
      isDefault: workspaces.length === 0,
    });
  }

  // 6. Customer & Reader Account (Always available for all registered accounts)
  workspaces.push({
    key: 'customer',
    title: 'গ্রাহক ও পাঠক অ্যাকাউন্ট',
    description: 'ব্যক্তিগত লাইব্রেরী, ক্রয়াদেশ, সাবস্ক্রিপশন ও রিডিং হিস্ট্রি',
    href: '/account',
    badge: user.membershipTier === 'PREMIUM' ? 'প্রিমিয়াম পাঠক' : 'গ্রাহক',
    isDefault: workspaces.length === 0,
  });

  return workspaces;
}

/**
 * Determine server-side redirect destination based on authorized workspaces and portal context.
 * Never blindly trusts user input or client redirect params.
 */
export function determineServerRedirect(
  workspaces: UserWorkspace[],
  portalContext?: string,
  requestedRedirect?: string
): string {
  // If specific portal requested and user has that workspace:
  if (portalContext) {
    const matched = workspaces.find((w) => w.key === portalContext);
    if (matched) {
      if (requestedRedirect) {
        return sanitizeRedirectUrl(requestedRedirect, matched.href);
      }
      return matched.href;
    }
  }

  // If a safe internal redirect was requested, verify if user has access
  if (requestedRedirect) {
    const sanitized = sanitizeRedirectUrl(requestedRedirect, '');
    if (sanitized) {
      if (sanitized.startsWith('/admin')) {
        const canAdmin = workspaces.some((w) => w.key === 'admin' || w.key === 'staff');
        if (canAdmin) return sanitized;
      } else if (sanitized.startsWith('/seller')) {
        const canSeller = workspaces.some((w) => w.key === 'seller' || w.key === 'admin');
        if (canSeller) return sanitized;
      } else if (sanitized.startsWith('/publisher')) {
        const canPublisher = workspaces.some((w) => w.key === 'publisher' || w.key === 'admin');
        if (canPublisher) return sanitized;
      } else if (sanitized.startsWith('/advertiser')) {
        return sanitized;
      } else if (sanitized.startsWith('/account')) {
        return sanitized;
      }
    }
  }

  // Fallback to highest-priority default workspace
  const defaultWs = workspaces.find((w) => w.isDefault) || workspaces[0];
  return defaultWs?.href || '/account';
}

/**
 * Get verified session user directly synchronized with Database
 * Ensures account suspension or role revocation is immediately effective.
 */
export async function getVerifiedSessionUser(): Promise<AuthSessionUser | null> {
  const session = await getSessionUser();
  if (!session) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      membershipTier: true,
      staffProfile: { select: { id: true } },
      advertisersOwned: { select: { id: true } },
      publisherProfile: { select: { id: true } },
      vendorMembers: { select: { id: true } },
    },
  });

  if (!dbUser || dbUser.status === 'SUSPENDED' || dbUser.status === 'BLOCKED') {
    return null;
  }

  const staff = isStaff(dbUser.role) || !!dbUser.staffProfile;
  const publisher = ['PUBLISHER', 'MAGAZINE_ADMIN', 'EDITOR', 'SUPER_ADMIN', 'ADMIN'].includes(dbUser.role) || !!dbUser.publisherProfile;
  const advertiser = (dbUser.advertisersOwned?.length ?? 0) > 0 || ['SUPER_ADMIN', 'ADMIN'].includes(dbUser.role);
  const vendor = (dbUser.vendorMembers?.length ?? 0) > 0 || ['SELLER', 'PUBLISHER', 'SUPER_ADMIN', 'ADMIN'].includes(dbUser.role);

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    membershipTier: dbUser.membershipTier,
    isStaff: staff,
    isPublisher: publisher,
    isAdvertiser: advertiser,
    isVendor: vendor,
  };
}

export async function getCurrentUserWithProfile() {
  const session = await getSessionUser();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        phone: true,
        role: true,
        status: true,
        avatarUrl: true,
        bio: true,
        gender: true,
        dateOfBirth: true,
        country: true,
        division: true,
        city: true,
        area: true,
        postalCode: true,
        fullAddress: true,
        isVerified: true,
        isPhoneVerified: true,
        membershipTier: true,
        membershipExpiry: true,
        createdAt: true,
        staffProfile: {
          include: {
            department: true,
            designation: true,
          },
        },
        advertisersOwned: {
          select: { id: true, companyName: true, status: true },
        },
        advertiserMemberships: {
          include: { advertiser: true },
        },
        publisherProfile: {
          select: { id: true, name: true, status: true },
        },
        publisherMemberships: {
          include: { publisher: true },
        },
        publicationMemberships: {
          include: { magazine: true },
        },
        vendorMembers: {
          include: { vendor: true },
        },
      },
    });

    if (!user || user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      return null;
    }

    const workspaces = resolveUserWorkspaces(user);

    return {
      ...user,
      workspaces,
      isStaff: isStaff(user.role) || !!user.staffProfile,
      isPublisher:
        ['PUBLISHER', 'MAGAZINE_ADMIN', 'EDITOR', 'SUPER_ADMIN', 'ADMIN'].includes(user.role) ||
        !!user.publisherProfile ||
        (user.publisherMemberships?.length ?? 0) > 0,
      isAdvertiser:
        (user.advertisersOwned?.length ?? 0) > 0 ||
        (user.advertiserMemberships?.length ?? 0) > 0 ||
        ['SUPER_ADMIN', 'ADMIN'].includes(user.role),
      isVendor:
        (user.vendorMembers?.length ?? 0) > 0 ||
        ['SELLER', 'PUBLISHER', 'SUPER_ADMIN', 'ADMIN'].includes(user.role),
    };
  } catch (err) {
    console.warn('[Auth] Database user query failed, falling back to JWT session payload:', err);
    // Safe resilient fallback using session JWT payload
    const fallbackWorkspaces = (session.workspaces || ['customer']).map((w: string) => ({
      key: w as any,
      title: w === 'admin' ? 'প্রশাসন কনসোল' : w === 'publisher' ? 'প্রকাশক ড্যাশবোর্ড' : 'গ্রাহক অ্যাকাউন্ট',
      description: 'ওয়ার্কস্পেস',
      href: w === 'admin' ? '/admin' : w === 'publisher' ? '/publisher/dashboard' : '/account',
    }));

    return {
      id: session.id,
      email: session.email,
      name: session.name || 'ইউজার',
      username: session.email ? session.email.split('@')[0] : 'user',
      phone: null,
      role: session.role || 'REGISTERED_MEMBER',
      status: 'ACTIVE',
      avatarUrl: null,
      bio: null,
      gender: null,
      dateOfBirth: null,
      country: 'বাংলাদেশ',
      division: null,
      city: null,
      area: null,
      postalCode: null,
      fullAddress: null,
      isVerified: true,
      isPhoneVerified: false,
      membershipTier: session.membershipTier || 'FREE',
      membershipExpiry: null,
      createdAt: new Date(),
      staffProfile: null,
      advertisersOwned: [],
      advertiserMemberships: [],
      publisherProfile: null,
      publisherMemberships: [],
      publicationMemberships: [],
      vendorMembers: [],
      workspaces: fallbackWorkspaces,
      isStaff: session.isStaff ?? ['SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(session.role),
      isPublisher: session.isPublisher ?? ['PUBLISHER', 'MAGAZINE_ADMIN', 'EDITOR', 'SUPER_ADMIN', 'ADMIN'].includes(session.role),
      isAdvertiser: session.isAdvertiser ?? ['SUPER_ADMIN', 'ADMIN'].includes(session.role),
      isVendor: session.isVendor ?? ['SELLER', 'PUBLISHER', 'SUPER_ADMIN', 'ADMIN'].includes(session.role),
    };
  }
}

// Role Hierarchy and Permission checking
export type UserRole =
  | 'GUEST'
  | 'REGISTERED_MEMBER'
  | 'CUSTOMER'
  | 'PAID_MEMBER'
  | 'CONTRIBUTOR'
  | 'AUTHOR'
  | 'PUBLISHER'
  | 'SELLER'
  | 'REVIEWER'
  | 'CUSTOMER_SUPPORT'
  | 'MODERATOR'
  | 'EDITOR'
  | 'MAGAZINE_ADMIN'
  | 'STORE_MANAGER'
  | 'FINANCE_MANAGER'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export const ROLE_LEVELS: Record<string, number> = {
  GUEST: 0,
  REGISTERED_MEMBER: 10,
  CUSTOMER: 10,
  PAID_MEMBER: 20,
  CONTRIBUTOR: 30,
  AUTHOR: 40,
  PUBLISHER: 40,
  SELLER: 45,
  REVIEWER: 50,
  CUSTOMER_SUPPORT: 60,
  MODERATOR: 70,
  EDITOR: 80,
  MAGAZINE_ADMIN: 82,
  STORE_MANAGER: 85,
  FINANCE_MANAGER: 90,
  ADMIN: 95,
  SUPER_ADMIN: 100,
};

// Granular Marketplace & Editorial Permissions
export type Permission =
  // Platform Administration
  | 'VIEW_ADMIN_DASHBOARD'
  | 'MANAGE_USERS'
  | 'MANAGE_SETTINGS'
  | 'VIEW_AUDIT_LOGS'
  // Marketplace & Seller Operations
  | 'MANAGE_SELLERS'
  | 'APPROVE_SELLER_APPLICATIONS'
  | 'MANAGE_COMMISSIONS'
  | 'VIEW_ALL_ORDERS'
  | 'MANAGE_ALL_ORDERS'
  | 'PROCESS_PAYOUTS'
  | 'MANAGE_ALL_PRODUCTS'
  // Vendor / Seller Self-Service
  | 'VIEW_SELLER_DASHBOARD'
  | 'MANAGE_OWN_PRODUCTS'
  | 'MANAGE_OWN_ORDERS'
  | 'REQUEST_PAYOUT'
  | 'VIEW_OWN_LEDGER'
  // Editorial & Publishing
  | 'PUBLISH_BOOKS'
  | 'PUBLISH_ARTICLES'
  | 'PUBLISH_MAGAZINES'
  | 'MODERATE_QUESTIONS'
  | 'MODERATE_REVIEWS'
  // Charity & Donations
  | 'MANAGE_DONATION_CAMPAIGNS'
  | 'AUDIT_DONATIONS'
  // Staff & HRMS Administration
  | 'VIEW_STAFF'
  | 'MANAGE_STAFF'
  | 'ASSIGN_TASKS'
  | 'APPROVE_WORKFLOWS'
  | 'MANAGE_LEAVE'
  // Advertising Network
  | 'VIEW_ADS_DASHBOARD'
  | 'MANAGE_ADS'
  | 'APPROVE_ADS'
  | 'MANAGE_AD_PLACEMENTS'
  | 'MANAGE_AD_FINANCE'
  // Reader / Customer
  | 'READ_FREE_BOOKS'
  | 'READ_PREMIUM_BOOKS'
  | 'DOWNLOAD_EBOOK'
  | 'SUBMIT_ORDER'
  | 'POST_QUESTION'
  | 'POST_REVIEW';

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'VIEW_ADMIN_DASHBOARD',
    'VIEW_ADS_DASHBOARD',
    'MANAGE_ADS',
    'APPROVE_ADS',
    'MANAGE_AD_PLACEMENTS',
    'MANAGE_AD_FINANCE',
    'VIEW_STAFF',
    'MANAGE_STAFF',
    'ASSIGN_TASKS',
    'APPROVE_WORKFLOWS',
    'MANAGE_LEAVE',
    'MANAGE_USERS',
    'MANAGE_SETTINGS',
    'VIEW_AUDIT_LOGS',
    'MANAGE_SELLERS',
    'APPROVE_SELLER_APPLICATIONS',
    'MANAGE_COMMISSIONS',
    'VIEW_ALL_ORDERS',
    'MANAGE_ALL_ORDERS',
    'PROCESS_PAYOUTS',
    'MANAGE_ALL_PRODUCTS',
    'VIEW_SELLER_DASHBOARD',
    'MANAGE_OWN_PRODUCTS',
    'MANAGE_OWN_ORDERS',
    'REQUEST_PAYOUT',
    'VIEW_OWN_LEDGER',
    'PUBLISH_BOOKS',
    'PUBLISH_ARTICLES',
    'PUBLISH_MAGAZINES',
    'MODERATE_QUESTIONS',
    'MODERATE_REVIEWS',
    'MANAGE_DONATION_CAMPAIGNS',
    'AUDIT_DONATIONS',
    'READ_FREE_BOOKS',
    'READ_PREMIUM_BOOKS',
    'DOWNLOAD_EBOOK',
    'SUBMIT_ORDER',
    'POST_QUESTION',
    'POST_REVIEW',
  ],
  ADMIN: [
    'VIEW_ADMIN_DASHBOARD',
    'VIEW_ADS_DASHBOARD',
    'MANAGE_ADS',
    'APPROVE_ADS',
    'MANAGE_AD_PLACEMENTS',
    'MANAGE_AD_FINANCE',
    'VIEW_STAFF',
    'MANAGE_STAFF',
    'ASSIGN_TASKS',
    'APPROVE_WORKFLOWS',
    'MANAGE_LEAVE',
    'MANAGE_USERS',
    'MANAGE_SETTINGS',
    'VIEW_AUDIT_LOGS',
    'MANAGE_SELLERS',
    'APPROVE_SELLER_APPLICATIONS',
    'MANAGE_COMMISSIONS',
    'VIEW_ALL_ORDERS',
    'MANAGE_ALL_ORDERS',
    'PROCESS_PAYOUTS',
    'MANAGE_ALL_PRODUCTS',
    'PUBLISH_BOOKS',
    'PUBLISH_ARTICLES',
    'PUBLISH_MAGAZINES',
    'MODERATE_QUESTIONS',
    'MODERATE_REVIEWS',
    'MANAGE_DONATION_CAMPAIGNS',
    'AUDIT_DONATIONS',
    'READ_FREE_BOOKS',
    'READ_PREMIUM_BOOKS',
    'DOWNLOAD_EBOOK',
    'SUBMIT_ORDER',
    'POST_QUESTION',
    'POST_REVIEW',
  ],
  FINANCE_MANAGER: [
    'VIEW_ADMIN_DASHBOARD',
    'VIEW_ALL_ORDERS',
    'PROCESS_PAYOUTS',
    'AUDIT_DONATIONS',
    'MANAGE_COMMISSIONS',
  ],
  STORE_MANAGER: [
    'VIEW_ADMIN_DASHBOARD',
    'MANAGE_ALL_PRODUCTS',
    'VIEW_ALL_ORDERS',
    'MANAGE_ALL_ORDERS',
  ],
  MAGAZINE_ADMIN: [
    'VIEW_ADMIN_DASHBOARD',
    'PUBLISH_MAGAZINES',
    'PUBLISH_ARTICLES',
    'MODERATE_QUESTIONS',
    'MODERATE_REVIEWS',
    'READ_FREE_BOOKS',
  ],
  EDITOR: [
    'VIEW_ADMIN_DASHBOARD',
    'PUBLISH_BOOKS',
    'PUBLISH_ARTICLES',
    'PUBLISH_MAGAZINES',
    'MODERATE_QUESTIONS',
    'MODERATE_REVIEWS',
  ],
  MODERATOR: [
    'MODERATE_QUESTIONS',
    'MODERATE_REVIEWS',
  ],
  CUSTOMER_SUPPORT: [
    'VIEW_ADMIN_DASHBOARD',
    'VIEW_ALL_ORDERS',
    'MODERATE_QUESTIONS',
    'MODERATE_REVIEWS',
  ],
  REVIEWER: [
    'MODERATE_REVIEWS',
    'POST_REVIEW',
    'READ_FREE_BOOKS',
  ],
  SELLER: [
    'VIEW_SELLER_DASHBOARD',
    'MANAGE_OWN_PRODUCTS',
    'MANAGE_OWN_ORDERS',
    'REQUEST_PAYOUT',
    'VIEW_OWN_LEDGER',
    'READ_FREE_BOOKS',
    'SUBMIT_ORDER',
  ],
  PUBLISHER: [
    'VIEW_SELLER_DASHBOARD',
    'MANAGE_OWN_PRODUCTS',
    'MANAGE_OWN_ORDERS',
    'REQUEST_PAYOUT',
    'VIEW_OWN_LEDGER',
    'PUBLISH_BOOKS',
    'READ_FREE_BOOKS',
    'SUBMIT_ORDER',
  ],
  AUTHOR: [
    'PUBLISH_ARTICLES',
    'POST_QUESTION',
    'POST_REVIEW',
    'READ_FREE_BOOKS',
  ],
  CONTRIBUTOR: [
    'PUBLISH_ARTICLES',
    'POST_QUESTION',
    'POST_REVIEW',
    'READ_FREE_BOOKS',
  ],
  PAID_MEMBER: [
    'READ_FREE_BOOKS',
    'READ_PREMIUM_BOOKS',
    'DOWNLOAD_EBOOK',
    'SUBMIT_ORDER',
    'POST_QUESTION',
    'POST_REVIEW',
  ],
  CUSTOMER: [
    'READ_FREE_BOOKS',
    'SUBMIT_ORDER',
    'POST_QUESTION',
    'POST_REVIEW',
  ],
  REGISTERED_MEMBER: [
    'READ_FREE_BOOKS',
    'SUBMIT_ORDER',
    'POST_QUESTION',
    'POST_REVIEW',
  ],
  GUEST: [
    'READ_FREE_BOOKS',
  ],
};

let dynamicPermissionsCache: Record<string, Permission[]> | null = null;
let cacheLastLoaded = 0;

export async function getDynamicRolePermissions(): Promise<Record<string, Permission[]>> {
  const now = Date.now();
  if (dynamicPermissionsCache && now - cacheLastLoaded < 30000) {
    return dynamicPermissionsCache;
  }

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: 'rbac_role_permissions' },
    });
    if (setting?.value) {
      const parsed = JSON.parse(setting.value);
      dynamicPermissionsCache = { ...ROLE_PERMISSIONS, ...parsed };
      cacheLastLoaded = now;
      return dynamicPermissionsCache;
    }
  } catch (e) {
    // fallback
  }

  dynamicPermissionsCache = { ...ROLE_PERMISSIONS };
  cacheLastLoaded = now;
  return dynamicPermissionsCache;
}

export async function saveDynamicRolePermissions(permissionsMap: Record<string, Permission[]>): Promise<void> {
  const value = JSON.stringify(permissionsMap);
  await prisma.siteSetting.upsert({
    where: { key: 'rbac_role_permissions' },
    update: { value },
    create: { key: 'rbac_role_permissions', value },
  });
  dynamicPermissionsCache = { ...ROLE_PERMISSIONS, ...permissionsMap };
  cacheLastLoaded = Date.now();
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  if (userRole === 'SUPER_ADMIN') return true;
  const currentMap = dynamicPermissionsCache || ROLE_PERMISSIONS;
  const perms = currentMap[userRole] || ROLE_PERMISSIONS[userRole] || [];
  return perms.includes(permission);
}

export async function hasPermissionAsync(userRole: string, permission: Permission): Promise<boolean> {
  if (userRole === 'SUPER_ADMIN') return true;
  const permissionsMap = await getDynamicRolePermissions();
  const perms = permissionsMap[userRole] || [];
  return perms.includes(permission);
}

export function isPlatformAdmin(userRole?: string): boolean {
  if (!userRole) return false;
  return ['ADMIN', 'SUPER_ADMIN', 'FINANCE_MANAGER', 'STORE_MANAGER', 'MAGAZINE_ADMIN'].includes(userRole);
}

export function isVendorUser(userRole?: string): boolean {
  if (!userRole) return false;
  return ['PUBLISHER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
}

export async function canAccessVendor(userId: string, vendorId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      vendorMembers: { where: { vendorId } },
    },
  });

  if (!user) return false;
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') return true;
  return user.vendorMembers.length > 0;
}

export async function getAuthenticatedVendor(providedSession?: AuthSessionUser | null) {
  const session = providedSession !== undefined ? providedSession : await getSessionUser();
  if (!session) return null;

  // Check VendorMember record
  const membership = await prisma.vendorMember.findFirst({
    where: { userId: session.id },
    include: { vendor: true },
  });

  if (membership) {
    return {
      vendor: membership.vendor,
      memberRole: membership.role,
      isOwner: membership.role === 'OWNER',
      isSuspended: membership.vendor.status === 'SUSPENDED',
      isAdminFallback: false,
    };
  }

  // If Admin / SuperAdmin without dedicated membership, provide default store access
  if (isAdmin(session.role)) {
    const fallbackVendor =
      (await prisma.vendor.findFirst({ where: { slug: 'shubban-official' } })) ||
      (await prisma.vendor.findFirst());
    if (fallbackVendor) {
      return {
        vendor: fallbackVendor,
        memberRole: 'OWNER',
        isOwner: true,
        isSuspended: fallbackVendor.status === 'SUSPENDED',
        isAdminFallback: true,
      };
    }
  }

  return null;
}

export function hasRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_LEVELS[userRole] || 0;
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
  return userLevel >= requiredLevel;
}

export function isAdmin(userRole?: string): boolean {
  if (!userRole) return false;
  return ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
}

export function isStaff(userRole?: string): boolean {
  if (!userRole) return false;
  return [
    'ADMIN',
    'SUPER_ADMIN',
    'STORE_MANAGER',
    'FINANCE_MANAGER',
    'MODERATOR',
    'EDITOR',
    'CUSTOMER_SUPPORT',
    'REVIEWER',
    'STAFF',
  ].includes(userRole);
}

export function isSuperAdmin(userRole?: string): boolean {
  return userRole === 'SUPER_ADMIN';
}

/**
 * Enforce role hierarchy:
 * 1. Only SUPER_ADMIN can assign SUPER_ADMIN.
 * 2. An ADMIN cannot modify a SUPER_ADMIN.
 * 3. Operator cannot grant a role with a higher level than their own.
 */
export function canManageUserRole(
  operatorRole: string,
  targetCurrentRole: string,
  newRole: string
): { allowed: boolean; reason?: string } {
  if (operatorRole === 'SUPER_ADMIN') {
    return { allowed: true };
  }

  // Target is Super Admin -> regular admin cannot touch
  if (targetCurrentRole === 'SUPER_ADMIN') {
    return {
      allowed: false,
      reason: 'সুপার অ্যাডমিন অ্যাকাউন্টের ভূমিকা সাধারণ অ্যাডমিন দ্বারা পরিবর্তনযোগ্য নয়।',
    };
  }

  // Attempting to elevate to Super Admin
  if (newRole === 'SUPER_ADMIN') {
    return {
      allowed: false,
      reason: 'শুধুমাত্র বিদ্যমান সুপার অ্যাডমিন নতুন সুপার অ্যাডমিন ভূমিকা প্রদান করতে পারেন।',
    };
  }

  const operatorLevel = ROLE_LEVELS[operatorRole] || 0;
  const targetNewLevel = ROLE_LEVELS[newRole] || 0;

  if (targetNewLevel > operatorLevel) {
    return {
      allowed: false,
      reason: 'আপনার নির্ধারিত ক্ষমতার অতিরিক্ত কোনো রোল প্রদান করা যাবে না।',
    };
  }

  return { allowed: true };
}

/**
 * Protect against removing the final active SUPER_ADMIN
 */
export async function isSoleSuperAdmin(userId: string): Promise<boolean> {
  const superAdminCount = await prisma.user.count({
    where: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  if (superAdminCount <= 1) {
    const isTargetSuper = await prisma.user.findFirst({
      where: { id: userId, role: 'SUPER_ADMIN', status: 'ACTIVE' },
    });
    return !!isTargetSuper;
  }

  return false;
}

export function canPublish(userRole?: string): boolean {
  if (!userRole) return false;
  return ['EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
}

export function canModerate(userRole?: string): boolean {
  if (!userRole) return false;
  return ['MODERATOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
}
