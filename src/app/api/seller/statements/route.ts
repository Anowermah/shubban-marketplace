import { NextResponse } from 'next/server';
import { getSessionUser, getAuthenticatedVendor } from '@/lib/auth';
import { getSellerStatement } from '@/lib/commission';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ।' }, { status: 401 });
    }

    const vendorAuth = await getAuthenticatedVendor(session);
    if (!vendorAuth) {
      return NextResponse.json({ error: 'বিক্রেতা অ্যাকাউন্ট পাওয়া যায়নি।' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');

    const startDate = startStr ? new Date(startStr) : undefined;
    const endDate = endStr ? new Date(endStr) : undefined;

    const statement = await getSellerStatement(vendorAuth.vendor.id, startDate, endDate);

    return NextResponse.json({
      success: true,
      statement,
    });
  } catch (error: any) {
    console.error('Fetch seller statement error:', error);
    return NextResponse.json({ error: error.message || 'স্টেটমেন্ট লোড করতে ব্যর্থ।' }, { status: 500 });
  }
}

