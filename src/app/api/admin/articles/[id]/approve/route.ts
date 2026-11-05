import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { approveArticle } from '@/lib/cms';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র এডিটর ও অ্যাডমিন প্রবন্ধ অনুমোদন করতে পারেন।' }, { status: 403 });
    }

    const article = await approveArticle(params.id, session.id);

    return NextResponse.json({
      success: true,
      message: 'প্রবন্ধটি সফলভাবে অনুমোদিত ও প্রকাশিত হয়েছে।',
      article,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

