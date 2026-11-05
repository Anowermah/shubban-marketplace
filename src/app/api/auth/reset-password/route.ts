import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = body.email;
    const token = body.token;
    const targetPassword = body.newPassword || body.password;

    if (!email || !token || !targetPassword) {
      return NextResponse.json({ error: 'ইমেইল, ভেরিফিকেশন কোড এবং নতুন পাসওয়ার্ড আবশ্যক।' }, { status: 400 });
    }

    if (targetPassword.length < 6) {
      return NextResponse.json({ error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        email: cleanEmail,
        token: token.trim(),
      },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'ভুল বা অবৈধ ভেরিফিকেশন কোড।' }, { status: 400 });
    }

    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      return NextResponse.json({ error: 'ভেরিফিকেশন কোডের মেয়াদ উত্তীর্ণ হয়ে গেছে। নতুন করে অনুরোধ করুন।' }, { status: 400 });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(targetPassword, salt);

    await prisma.user.update({
      where: { email: cleanEmail },
      data: { passwordHash },
    });

    // Delete token after successful reset
    await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });

    return NextResponse.json({
      success: true,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! এখন লগইন করতে পারেন।',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'পাসওয়ার্ড রিসেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
