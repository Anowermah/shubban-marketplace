import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const magazine = await prisma.magazine.findFirst({
      where: {
        OR: [{ id: params.id }, { slug: params.id }],
      },
      include: {
        category: true,
        publisher: true,
        issues: {
          orderBy: { publicationDate: 'desc' },
          include: {
            _count: { select: { articles: true, readingSessions: true } },
          },
        },
      },
    });

    if (!magazine) {
      return NextResponse.json({ error: 'সাময়িকীটি পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json({ success: true, magazine });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      titleEn,
      slug,
      frequency,
      description,
      coverImage,
      editor,
      editorialMessage,
      month,
      year,
      volume,
      issueNumber,
      language,
      tags,
      seoTitle,
      metaDescription,
      status,
      publisherId,
      categoryId,
      isFeatured,
    } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (titleEn !== undefined) data.titleEn = titleEn;
    if (slug !== undefined) data.slug = slug;
    if (frequency !== undefined) data.frequency = frequency;
    if (description !== undefined) data.description = description;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (editor !== undefined) data.editor = editor;
    if (editorialMessage !== undefined) data.editorialMessage = editorialMessage;
    if (month !== undefined) data.month = month;
    if (year !== undefined) data.year = parseInt(year);
    if (volume !== undefined) data.volume = volume;
    if (issueNumber !== undefined) data.issueNumber = issueNumber;
    if (language !== undefined) data.language = language;
    if (tags !== undefined) data.tags = tags;
    if (seoTitle !== undefined) data.seoTitle = seoTitle;
    if (metaDescription !== undefined) data.metaDescription = metaDescription;
    if (status !== undefined) data.status = status;
    if (publisherId !== undefined) data.publisherId = publisherId || null;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (isFeatured !== undefined) data.isFeatured = Boolean(isFeatured);

    const updated = await prisma.magazine.update({
      where: { id: params.id },
      data,
      include: { category: true, publisher: true },
    });

    return NextResponse.json({ success: true, magazine: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser();
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'শুধুমাত্র অ্যাডমিন সাময়িকী মুছে ফেলতে পারেন' }, { status: 403 });
    }

    // Dependency check: count issues
    const issuesCount = await prisma.publicationIssue.count({
      where: { magazineId: params.id },
    });

    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    if (issuesCount > 0 && !force) {
      return NextResponse.json(
        {
          error: `এই সাময়িকীর অধীনে ${issuesCount}টি সংখ্যা বিদ্যমান রয়েছে। প্রথমে সংখ্যাগুলো মুছে ফেলুন অথবা ফোর্স ডিলিট নিশ্চিত করুন।`,
          hasDependencies: true,
          dependenciesCount: issuesCount,
        },
        { status: 400 }
      );
    }

    await prisma.magazine.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'সাময়িকী সফলভাবে মুছে ফেলা হয়েছে।' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

