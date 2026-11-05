import { NextResponse } from 'next/server';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import {
  getIslamicHotlineData,
  saveIslamicHotlineConfig,
} from '@/lib/islamic-ai/hotline';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const data = await getIslamicHotlineData();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching admin hotline data:', error);
    return NextResponse.json({ error: 'হটলাইন ডাটা লোড ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const updatedConfig = await saveIslamicHotlineConfig(body);

    return NextResponse.json({
      success: true,
      message: 'হটলাইন সেটিংস সফলভাবে সংরক্ষিত হয়েছে।',
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating admin hotline config:', error);
    return NextResponse.json({ error: 'সেটিংস আপডেট ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

