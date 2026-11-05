import { NextResponse } from 'next/server';
import { getPublicHotlineData } from '@/lib/islamic-ai/hotline';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getPublicHotlineData();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('Error fetching public Islamic AI hotline data:', error);
    return NextResponse.json(
      { error: 'হটলাইন তথ্য লোড করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

