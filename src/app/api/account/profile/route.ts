import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, reissueAuthCookie } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export async function GET(req: Request) {
  try {
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন।' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        bio: true,
        gender: true,
        dateOfBirth: true,
        country: true,
        division: true,
        city: true,
        area: true,
        postalCode: true,
        fullAddress: true,
        avatarUrl: true,
        role: true,
        status: true,
        isVerified: true,
        isPhoneVerified: true,
        membershipTier: true,
        membershipExpiry: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'প্রোফাইল তথ্য লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন।' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      username,
      phone,
      bio,
      gender,
      dateOfBirth,
      country,
      division,
      city,
      area,
      postalCode,
      fullAddress,
    } = body;

    // Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'আপনার পুরো নাম আবশ্যক।' }, { status: 400 });
    }

    // Validate username if provided
    if (username && typeof username === 'string') {
      const cleanUsername = username.trim().toLowerCase();
      // Check if taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          username: cleanUsername,
          NOT: { id: session.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'এই ব্যবহারকারী নামটি (Username) ইতোমধ্যে অন্য কেউ ব্যবহার করছেন।' },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: {
        name: name.trim(),
        username: username ? username.trim().toLowerCase() : undefined,
        phone: phone ? phone.trim() : null,
        bio: bio ? bio.trim() : null,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        country: country || 'Bangladesh',
        division: division || null,
        city: city || null,
        area: area || null,
        postalCode: postalCode ? postalCode.trim() : null,
        fullAddress: fullAddress ? fullAddress.trim() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        bio: true,
        gender: true,
        dateOfBirth: true,
        country: true,
        division: true,
        city: true,
        area: true,
        postalCode: true,
        fullAddress: true,
        avatarUrl: true,
        role: true,
        status: true,
        membershipTier: true,
        membershipExpiry: true,
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'PROFILE_UPDATED',
        entity: 'User',
        entityId: session.id,
        ipAddress: clientIp,
        details: JSON.stringify({
          updatedFields: Object.keys(body).filter((k) => body[k] !== undefined),
        }),
      },
    });

    // Prepare response and re-issue JWT cookie so session stays in sync with updated name
    const response = NextResponse.json({
      success: true,
      message: 'প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!',
      user: updatedUser,
    });

    reissueAuthCookie(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        membershipTier: updatedUser.membershipTier,
      },
      response
    );

    return response;
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: error?.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}
