import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'অনুগ্রহ করে ইমেইল ঠিকানা প্রদান করুন।' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      // Return success-like message for security (prevent email harvesting)
      return NextResponse.json({
        success: true,
        message: 'যদি এই ইমেইলটি আমাদের ডাটাবেজে থাকে, তবে পাসওয়ার্ড রিসেট নির্দেশিকা পাঠানো হয়েছে।',
      });
    }

    // Generate random 6-digit OTP or secure token
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Remove any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: cleanEmail },
    });

    await prisma.passwordResetToken.create({
      data: {
        email: cleanEmail,
        token,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড পাঠানো হয়েছে।',
      demoToken: process.env.NODE_ENV !== 'production' ? token : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'পাসওয়ার্ড রিসেট অনুরোধ প্রক্রিয়াকরণে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

