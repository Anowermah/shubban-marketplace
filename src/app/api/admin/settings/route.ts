import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserWithProfile, isAdmin, isSuperAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const settingsData = await req.json();

    for (const [key, value] of Object.entries(settingsData)) {
      await prisma.siteSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'SETTINGS_UPDATED',
          entity: 'SiteSetting',
          details: JSON.stringify({
            updatedKeysCount: Object.keys(settingsData).length,
            ip: clientIp,
          }),
          ipAddress: clientIp,
        },
      });
    } catch (auditErr) {
      console.warn('Audit log error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'সমস্ত সেটিংস সফলভাবে সংরক্ষিত হয়েছে!',
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const resetAll = body.resetAll === true || searchParams.get('resetAll') === 'true';
    const targetKey = key || body.key;

    if (resetAll) {
      if (!isSuperAdmin(user.role)) {
        return NextResponse.json(
          { error: 'সমস্ত সেটিংস রিসেট করার জন্য সুপার অ্যাডমিন অনুমতি প্রয়োজন।' },
          { status: 403 }
        );
      }

      const deleted = await prisma.siteSetting.deleteMany({});

      // Write audit log
      try {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'SETTINGS_RESET_ALL',
            entity: 'SiteSetting',
            details: JSON.stringify({
              deletedKeysCount: deleted.count,
              ip: clientIp,
            }),
            ipAddress: clientIp,
          },
        });
      } catch (auditErr) {
        console.warn('Audit log error:', auditErr);
      }

      return NextResponse.json({
        success: true,
        message: 'সমস্ত সিস্টেম সেটিংস সফলভাবে ফ্যাক্টরি ডিফল্টে রিসেট করা হয়েছে!',
      });
    }

    if (targetKey) {
      await prisma.siteSetting.deleteMany({
        where: { key: targetKey },
      });

      return NextResponse.json({
        success: true,
        message: `সেটিংস কি "${targetKey}" সফলভাবে মুছে ফেলা হয়েছে!`,
      });
    }

    return NextResponse.json({ error: 'রিসেটের জন্য কোনো প্যারামিটার প্রদান করা হয়নি।' }, { status: 400 });
  } catch (error) {
    console.error('Settings reset error:', error);
    return NextResponse.json({ error: 'সেটিংস রিসেট করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}
