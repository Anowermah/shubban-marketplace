import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVerifiedSessionUser, isAdmin, isSuperAdmin } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';
import { DEFAULT_APPEARANCE } from '@/lib/appearance-constants';

export const dynamic = 'force-dynamic';

export { DEFAULT_APPEARANCE };

export async function GET() {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const settingsRecords = await prisma.siteSetting.findMany({
      where: {
        key: {
          startsWith: 'brand_',
        },
      },
    });

    const otherAppearanceRecords = await prisma.siteSetting.findMany({
      where: {
        key: {
          in: [
            'font_family_bangla',
            'font_family_arabic',
            'theme_default_mode',
            'top_notice_bar_enabled',
            'top_notice_bar_text',
            'top_notice_bar_link',
            'footer_copyright_text',
            'footer_trust_badge_text',
            'social_facebook',
            'social_youtube',
            'social_telegram',
            'social_whatsapp',
          ],
        },
      },
    });

    const appearance: Record<string, string> = { ...DEFAULT_APPEARANCE };
    [...settingsRecords, ...otherAppearanceRecords].forEach((s) => {
      appearance[s.key] = s.value;
    });

    return NextResponse.json({ success: true, appearance });
  } catch (error: any) {
    console.error('Error fetching appearance:', error);
    return NextResponse.json({ error: 'অ্যাপিয়ারেন্স সেটিংস লোড করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const body = await req.json();

    const allowedKeys = Object.keys(DEFAULT_APPEARANCE);
    const updateEntries = Object.entries(body).filter(([k]) => allowedKeys.includes(k));

    for (const [key, value] of updateEntries) {
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
          userId: operator.id,
          action: 'THEME_APPEARANCE_UPDATED',
          entity: 'AppearanceSettings',
          details: JSON.stringify({
            updatedKeys: updateEntries.map(([k]) => k),
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
      message: 'ওয়েবসাইট থিম ও রূপসজ্জা সফলভাবে সংরক্ষিত ও প্রয়োগ করা হয়েছে!',
    });
  } catch (error: any) {
    console.error('Error saving appearance:', error);
    return NextResponse.json({ error: 'থিম সংরক্ষণ করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const clientIp = getClientIp(req);
    const operator = await getVerifiedSessionUser();
    if (!operator || !isSuperAdmin(operator.role)) {
      return NextResponse.json(
        { error: 'শুধুমাত্র সুপার অ্যাডমিনিস্ট্রেটর থিম ফ্যাক্টরি ডিফল্টে রিসেট করতে পারেন।' },
        { status: 403 }
      );
    }

    const keysToDelete = Object.keys(DEFAULT_APPEARANCE);

    const deleted = await prisma.siteSetting.deleteMany({
      where: {
        key: { in: keysToDelete },
      },
    });

    // Write audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: operator.id,
          action: 'THEME_APPEARANCE_RESET',
          entity: 'AppearanceSettings',
          details: JSON.stringify({
            deletedCustomKeysCount: deleted.count,
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
      message: 'ওয়েবসাইট থিম সফলভাবে ফ্যাক্টরি ডিফল্ট মানে রিসেট করা হয়েছে!',
      defaultAppearance: DEFAULT_APPEARANCE,
    });
  } catch (error: any) {
    console.error('Error resetting appearance:', error);
    return NextResponse.json({ error: 'থিম রিসেট করতে সমস্যা হয়েছে।' }, { status: 500 });
  }
}

