import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { rateLimit, getClientIp, createRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit: 15 registrations per 10 minutes per IP
    const rateLimitCheck = rateLimit(clientIp, {
      limit: 15,
      windowMs: 10 * 60 * 1000,
      prefix: 'register_ip',
    });

    if (!rateLimitCheck.success) {
      return NextResponse.json(
        { error: 'অতিরিক্ত রেজিস্ট্রেশন অনুরোধ সনাক্ত হয়েছে। অনুগ্রহ করে ১০ মিনিট পর চেষ্টা করুন।' },
        { status: 429, headers: createRateLimitHeaders(rateLimitCheck) }
      );
    }

    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'সবগুলো আবশ্যক তথ্য পূরণ করুন।' }, { status: 400 });
    }

    // Password strength enforcement
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'নিরাপত্তার স্বার্থে পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট রয়েছে।' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        phone: phone ? phone.trim() : null,
        role: 'REGISTERED_MEMBER',
        membershipTier: 'FREE',
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id,
        ipAddress: clientIp,
        details: JSON.stringify({ email: cleanEmail, name: user.name }),
      },
    });

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      membershipTier: user.membershipTier,
    };

    const token = signToken(sessionUser);

    const response = NextResponse.json({
      message: 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!',
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
      },
    });

    response.cookies.set('shubban_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'নিবন্ধনে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
