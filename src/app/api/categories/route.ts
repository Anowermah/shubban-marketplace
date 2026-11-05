import { NextResponse } from 'next/server';
import { getCachedCategories } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const categories = await getCachedCategories();
    return NextResponse.json(
      { success: true, categories },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'ক্যাটাগরি তালিকা লোড করতে ব্যর্থ হয়েছে।' }, { status: 500 });
  }
}

