import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS: Record<string, string> = {
  defaultAllowDownload: 'true',
  defaultRequireLogin: 'false',
  defaultReadOnline: 'true',
  readerHeartbeatSeconds: '15',
  meaningfulReadSeconds: '30',
  meaningfulPageCount: '3',
  watermarkEnabled: 'false',
  watermarkText: 'শুব্বান ডিজিটাল লাইব্রেরি',
  defaultMagazineLanguage: 'bn',
  seoPublicationTitle: 'শুব্বান প্রকাশনা ও ডিজিটাল লাইব্রেরি',
};

export async function GET() {
  try {
    const dbSettings = await prisma.publicationSetting.findMany();
    const settingsMap = { ...DEFAULT_SETTINGS };

    dbSettings.forEach((item) => {
      settingsMap[item.key] = item.value;
    });

    return NextResponse.json({
      success: true,
      settings: settingsMap,
    });
  } catch (error: any) {
    console.error('Error reading publication settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to read settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const updates = body.settings || body;

    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') {
        const strVal = String(value);
        const record = await prisma.publicationSetting.upsert({
          where: { key },
          create: { key, value: strVal },
          update: { value: strVal },
        });
        results.push(record);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'প্রকাশনা সেটিংস সংরক্ষিত হয়েছে',
      results,
    });
  } catch (error: any) {
    console.error('Error saving publication settings:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
