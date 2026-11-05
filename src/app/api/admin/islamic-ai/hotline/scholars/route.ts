import { NextResponse } from 'next/server';
import { getVerifiedSessionUser, isAdmin } from '@/lib/auth';
import {
  upsertShaykhInRoster,
  deleteShaykhFromRoster,
  toggleShaykhDutyStatus,
} from '@/lib/islamic-ai/hotline';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const { name, whatsappNumber } = body;

    if (!name || !whatsappNumber) {
      return NextResponse.json(
        { error: 'শাইখের নাম ও হোয়াটসঅ্যাপ নম্বর আবশ্যক।' },
        { status: 400 }
      );
    }

    const updatedRoster = await upsertShaykhInRoster(body);

    return NextResponse.json({
      success: true,
      message: body.id
        ? 'শাইখের তথ্য সফলভাবে হালনাগাদ করা হয়েছে।'
        : 'নতুন শাইখ সফলভাবে রোস্টারে যুক্ত করা হয়েছে।',
      roster: updatedRoster,
    });
  } catch (error) {
    console.error('Error saving scholar to hotline roster:', error);
    return NextResponse.json({ error: 'শাইখের তথ্য সংরক্ষণ ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const body = await req.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'আইডি আবশ্যক।' }, { status: 400 });
    }

    let updatedRoster;
    if (action === 'TOGGLE_DUTY') {
      updatedRoster = await toggleShaykhDutyStatus(id);
    } else {
      updatedRoster = await upsertShaykhInRoster(body);
    }

    return NextResponse.json({
      success: true,
      message: 'স্ট্যাটাস সফলভাবে পরিবর্তিত হয়েছে।',
      roster: updatedRoster,
    });
  } catch (error) {
    console.error('Error updating scholar duty:', error);
    return NextResponse.json({ error: 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const operator = await getVerifiedSessionUser();
    if (!operator || !isAdmin(operator.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'অপসারণযোগ্য শাইখ আইডি প্রয়োজন।' }, { status: 400 });
    }

    const updatedRoster = await deleteShaykhFromRoster(id);

    return NextResponse.json({
      success: true,
      message: 'শাইখকে রোস্টার থেকে সফলভাবে অপসারণ করা হয়েছে।',
      roster: updatedRoster,
    });
  } catch (error) {
    console.error('Error deleting scholar from hotline roster:', error);
    return NextResponse.json({ error: 'শাইখ অপসারণ ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

