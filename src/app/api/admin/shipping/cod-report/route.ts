import { NextResponse } from 'next/server';
import { getCurrentUserWithProfile, isAdmin } from '@/lib/auth';
import { getCodCollectionReport } from '@/lib/shipping';

export async function GET(req: Request) {
  try {
    const user = await getCurrentUserWithProfile();
    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const courierCode = searchParams.get('courierCode') || undefined;

    const report = await getCodCollectionReport(courierCode);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('Fetch COD report error:', error);
    return NextResponse.json({ error: error.message || 'সিওডি রিপোর্ট লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

