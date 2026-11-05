import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { createIslamicResource, getIslamicResources } from '@/lib/cms';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic') || undefined;
    const category = searchParams.get('category') || undefined;
    const language = searchParams.get('language') || undefined;
    const search = searchParams.get('search') || undefined;
    const isFeatured =
      searchParams.get('featured') === 'true'
        ? true
        : searchParams.get('featured') === 'false'
        ? false
        : undefined;

    const limit = Number(searchParams.get('limit')) || 30;
    const page = Number(searchParams.get('page')) || 1;
    const skip = (page - 1) * limit;

    const data = await getIslamicResources({
      topic,
      category,
      language,
      search,
      isFeatured,
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
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json(
        { error: 'ইসলামিক রিসোর্স সংযুক্তির জন্য অ্যাডমিন/এডিটর পারমিশন আবশ্যক।' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const resource = await createIslamicResource(body, session.id);

    return NextResponse.json({ success: true, resource });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

