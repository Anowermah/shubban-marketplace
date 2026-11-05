import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user) {
      return NextResponse.json(
        { user: null },
        {
          status: 401,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      );
    }
    return NextResponse.json(
      { user },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
