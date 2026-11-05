import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';
import {
  getIslamicAiSettings,
  updateIslamicAiSettings,
} from '@/lib/islamic-ai/settings';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const settings = await getIslamicAiSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const updated = await updateIslamicAiSettings(body);

    return NextResponse.json({
      success: true,
      message: 'ইসলামিক এআই সেটিংস সফলভাবে সংরক্ষিত হয়েছে।',
      settings: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    await prisma.siteSetting.deleteMany({
      where: { key: 'islamic_ai_settings' },
    });

    return NextResponse.json({
      success: true,
      message: 'ইসলামিক এআই সেটিংস সফলভাবে ডিফল্ট মানে রিসেট করা হয়েছে।',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

