import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser } from '@/lib/auth';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const limitCheck = rateLimit(clientIp, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
      prefix: 'sec_pwd',
    });

    if (!limitCheck.success) {
      return NextResponse.json(
        { error: 'অতিরিক্ত নিরাপত্তা চেষ্টা শনাক্ত হয়েছে। অনুগ্রহ করে ১৫ মিনিট পর পুনরায় চেষ্টা করুন।' },
        { status: 429 }
      );
    }

    const session = await getVerifiedSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অনুগ্রহ করে প্রথমে লগইন করুন।' }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'বর্তমান পাসওয়ার্ড এবং নতুন পাসওয়ার্ড দুটিই আবশ্যক।' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'নতুন পাসওয়ার্ড এবং বর্তমান পাসওয়ার্ড একই হতে পারবে না।' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'PASSWORD_CHANGE_FAILED',
            entity: 'User',
            entityId: user.id,
            details: JSON.stringify({ reason: 'Incorrect current password', ip: clientIp }),
            ipAddress: clientIp,
          },
        });
      } catch (logErr) {
        console.error('Audit log error:', logErr);
      }

      return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ডটি সঠিক নয়।' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PASSWORD_CHANGED',
          entity: 'User',
          entityId: user.id,
          details: JSON.stringify({ ip: clientIp }),
          ipAddress: clientIp,
        },
      });
    } catch (logErr) {
      console.error('Audit log error:', logErr);
    }

    return NextResponse.json({
      success: true,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
