import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { getLowStockAlerts } from '@/lib/inventory/service';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const threshold = parseInt(searchParams.get('threshold') || '5', 10);

    const lowStockBooks = await getLowStockAlerts(threshold);

    return NextResponse.json({
      success: true,
      threshold,
      count: lowStockBooks.length,
      items: lowStockBooks,
    });
  } catch (error: any) {
    console.error('Low stock alerts error:', error);
    return NextResponse.json(
      { error: 'স্বল্প স্টক লোড করতে ব্যর্থ হয়েছে।' },
      { status: 500 }
    );
  }
}

