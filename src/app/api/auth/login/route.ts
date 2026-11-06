import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import {
  signToken,
  resolveUserWorkspaces,
  determineServerRedirect,
  isStaff,
  isAdmin,
} from '@/lib/auth';
import { rateLimit, getClientIp, createRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit: 30 attempts per minute per IP (protects against distributed bursts while accommodating shared NATs)
    const rateLimitCheck = rateLimit(clientIp, {
      limit: 30,
      windowMs: 60 * 1000,
      prefix: 'login_ip',
    });

    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { error: 'অতিরিক্ত ব্যর্থ চেষ্টার কারণে সাময়িকভাবে লগইন স্থগিত। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।' },
        { status: 429, headers: createRateLimitHeaders(rateLimitCheck) }
      );
    }

    const body = await req.json();
    const { email, password, portal, redirect: clientRedirect } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'ইমেইল ও পাসওয়ার্ড প্রদান করুন।' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Specific rate limit per target account: 5 attempts per minute
    const accountLimit = rateLimit(cleanEmail, {
      limit: 5,
      windowMs: 60 * 1000,
      prefix: 'login_acc',
    });

    if (!accountLimit.success) {
      return NextResponse.json(
        { error: 'এই অ্যাকাউন্টে একাধিক ব্যর্থ চেষ্টা সনাক্ত হয়েছে। অনুগ্রহ করে ১ মিনিট পর পুনরায় চেষ্টা করুন।' },
        { status: 429, headers: createRateLimitHeaders(accountLimit) }
      );
    }

    // Fetch user with multi-role and contextual entities
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
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

    if (!user) {
      return NextResponse.json({ error: 'ভুল ইমেইল বা পাসওয়ার্ড।' }, { status: 401 });
    }

    // Safe non-blocking audit logging helper for read-only cloud environments
    const safeAuditLog = async (data: any) => {
      try {
        await prisma.auditLog.create({ data });
      } catch (err) {
        console.warn('[AuditLog] Non-critical write ignored in read-only environment:', err);
      }
    };

    // Check account status: blocked or suspended users cannot login
    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      await safeAuditLog({
        userId: user.id,
        action: 'LOGIN_BLOCKED_SUSPENDED',
        entity: 'User',
        entityId: user.id,
        ipAddress: clientIp,
        details: JSON.stringify({ email: cleanEmail, status: user.status, portal }),
      });

      return NextResponse.json(
        {
          error:
            user.status === 'BLOCKED'
              ? 'নিরাপত্তা নিয়মের লঙ্ঘনের কারণে অ্যাকাউন্টটি স্থায়ীভাবে ব্লক করা হয়েছে।'
              : 'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত রয়েছে। সহায়তার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন।',
        },
        { status: 403 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Log failed login audit safely
      await safeAuditLog({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user.id,
        ipAddress: clientIp,
        details: JSON.stringify({ email: cleanEmail, reason: 'INVALID_PASSWORD', portal }),
      });

      return NextResponse.json({ error: 'ভুল ইমেইল বা পাসওয়ার্ড।' }, { status: 401 });
    }

    // Resolve all user workspaces and role entitlements
    const workspaces = resolveUserWorkspaces(user);
    const userIsStaff = isStaff(user.role) || !!user.staffProfile;
    const userIsPublisher =
      ['PUBLISHER', 'MAGAZINE_ADMIN', 'EDITOR', 'SUPER_ADMIN', 'ADMIN'].includes(user.role) ||
      !!user.publisherProfile ||
      user.publisherMemberships.length > 0 ||
      user.publicationMemberships.length > 0;
    const userIsAdvertiser =
      user.advertisersOwned.length > 0 ||
      user.advertiserMemberships.length > 0 ||
      ['SUPER_ADMIN', 'ADMIN'].includes(user.role);
    const userIsVendor =
      user.vendorMembers.length > 0 ||
      ['SELLER', 'PUBLISHER', 'SUPER_ADMIN', 'ADMIN'].includes(user.role);

    // Enforce server-side portal access boundary:
    // 1. Admin/Staff Portal Boundary
    if (portal === 'admin' || portal === 'staff') {
      if (!userIsStaff && !isAdmin(user.role)) {
        await safeAuditLog({
          userId: user.id,
          action: 'LOGIN_PORTAL_FORBIDDEN',
          entity: 'User',
          entityId: user.id,
          ipAddress: clientIp,
          details: JSON.stringify({
            email: cleanEmail,
            requestedPortal: portal,
            userRole: user.role,
            reason: 'NON_ADMIN_ATTEMPTED_ADMIN_LOGIN',
          }),
        });

        return NextResponse.json(
          {
            error:
              'অননুমোদিত প্রবেশ: আপনার অ্যাকাউন্টটিতে প্রশাসন বা স্টাফ অধিকার নেই। সাধারণ গ্রাহক হিসেবে প্রবেশ করতে /login ব্যবহার করুন।',
          },
          { status: 403 }
        );
      }
    }

    // 2. Publisher Portal Boundary
    if (portal === 'publisher') {
      if (!userIsPublisher) {
        await safeAuditLog({
          userId: user.id,
          action: 'LOGIN_PORTAL_FORBIDDEN',
          entity: 'User',
          entityId: user.id,
          ipAddress: clientIp,
          details: JSON.stringify({
            email: cleanEmail,
            requestedPortal: portal,
            userRole: user.role,
            reason: 'NON_PUBLISHER_ATTEMPTED_PUBLISHER_LOGIN',
          }),
        });

        return NextResponse.json(
          {
            error:
              'অননুমোদিত প্রবেশ: আপনার অ্যাকাউন্টটিতে প্রকাশক বা সাময়িকী সম্পাদনা দলের অধিকার নেই।',
          },
          { status: 403 }
        );
      }
    }

    // Determine secure server-side redirect destination
    const redirectTo = determineServerRedirect(workspaces, portal, clientRedirect);

    // Build JWT session token with roles and workspaces
    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      membershipTier: user.membershipTier,
      isStaff: userIsStaff,
      isPublisher: userIsPublisher,
      isAdvertiser: userIsAdvertiser,
      isVendor: userIsVendor,
      workspaces: workspaces.map((w) => w.key),
    };

    const token = signToken(sessionUser);

    // Update lastLoginAt safely in cloud/read-only environments
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch (err) {
      console.warn('[User] lastLoginAt update skipped in read-only environment');
    }

    // Log successful login audit safely
    await safeAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entity: 'User',
      entityId: user.id,
      ipAddress: clientIp,
      details: JSON.stringify({
        email: cleanEmail,
        role: user.role,
        portal: portal || 'default',
        redirectTo,
        workspacesCount: workspaces.length,
      }),
    });

    const response = NextResponse.json({
      message: 'লগইন সফল হয়েছে!',
      redirectTo,
      workspaces,
      activePortal: portal || 'default',
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        country: user.country,
        division: user.division,
        city: user.city,
        area: user.area,
        postalCode: user.postalCode,
        fullAddress: user.fullAddress,
        membershipTier: user.membershipTier,
        isVerified: user.isVerified,
        isPhoneVerified: user.isPhoneVerified,
        isStaff: userIsStaff,
        isPublisher: userIsPublisher,
        isAdvertiser: userIsAdvertiser,
        isVendor: userIsVendor,
        workspaces,
      },
    });

    response.cookies.set('shubban_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'সার্ভার ত্রুটি ঘটেছে।' }, { status: 500 });
  }
}
