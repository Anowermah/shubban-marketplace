import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, isAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const [sources, versesCount, hadithsCount, tafsirCount, booksCount, articlesCount, magsCount] =
      await Promise.all([
        prisma.aiKnowledgeSource.findMany({
          orderBy: { createdAt: 'desc' },
        }),
        prisma.quranVerse.count(),
        prisma.hadithEntry.count(),
        prisma.tafsirEntry.count(),
        prisma.book.count(),
        prisma.article.count(),
        prisma.magazine.count(),
      ]);

    return NextResponse.json({
      success: true,
      sources,
      stats: {
        versesCount,
        hadithsCount,
        tafsirCount,
        booksCount,
        articlesCount,
        magsCount,
      },
    });
  } catch (error: any) {
    console.error('Fetch Knowledge Sources Error:', error);
    return NextResponse.json({ error: 'নলেজ বেস লোড করতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত অনুরোধ' }, { status: 403 });
    }

    const body = await req.json();
    const { title, sourceType, description, tenantScope, isPublic } = body;

    if (!title || !sourceType) {
      return NextResponse.json({ error: 'শিরোনাম ও উৎসের ধরন আবশ্যক' }, { status: 400 });
    }

    const newSource = await prisma.aiKnowledgeSource.create({
      data: {
        title,
        sourceType,
        description: description || null,
        tenantScope: tenantScope || 'GLOBAL',
        isPublic: isPublic ?? true,
        status: 'ACTIVE',
        documentCount: 1,
        chunkCount: 10,
        lastIndexedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, source: newSource });
  } catch (error: any) {
    console.error('Add Knowledge Source Error:', error);
    return NextResponse.json({ error: error?.message || 'উৎস যুক্ত করতে ব্যর্থ হয়েছে' }, { status: 500 });
  }
}

