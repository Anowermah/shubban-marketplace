import { NextResponse } from 'next/server';
import { getVapidStatus } from '@/lib/push/vapid';

export const dynamic = 'force-dynamic';

export async function GET() {
  const status = getVapidStatus();
  return NextResponse.json({
    success: true,
    publicKey: status.publicKey,
    isConfigured: status.isConfigured,
  });
}

