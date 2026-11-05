import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createArticle, getArticles } from '@/lib/cms';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const categorySlug = searchParams.get('categorySlug') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = Number(searchParams.get('limit')) || 20;
    const page = Number(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    const data = await getArticles({
      status,
      categorySlug,
      tag,
      search,
      take: limit,
      skip,
    });

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR', 'AUTHOR'].includes(session.role)) {
      return NextResponse.json(
        { error: 'প্রবন্ধ প্রকাশের জন্য উপযুক্ত অনুমোদন আবশ্যক।' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const article = await createArticle(body, session.id);

    return NextResponse.json({ success: true, article });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

