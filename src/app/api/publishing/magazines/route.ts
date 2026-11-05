import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { initializeMagazineWorkspace } from '@/lib/services/publishingService';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const publisherId = searchParams.get('publisherId') || '';
    const frequency = searchParams.get('frequency') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleEn: { contains: search } },
        { editor: { contains: search } },
      ];
    }
    if (publisherId) where.publisherId = publisherId;
    if (frequency) where.frequency = frequency;
    if (status) where.status = status;

    const magazines = await prisma.magazine.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        publisher: { select: { id: true, name: true, logoUrl: true } },
        category: { select: { id: true, name: true } },
        schedule: true,
        _count: {
          select: {
            issues: true,
            articles: true,
            members: true,
            subscriptions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      magazines: magazines.map((m) => ({
        ...m,
        issueCount: m._count?.issues || 0,
        articleCount: m._count?.articles || 0,
        memberCount: m._count?.members || 0,
        subscriptionCount: m._count?.subscriptions || 0,
      })),
    });
  } catch (error: any) {
    console.error('Error listing publishing magazines:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list magazines' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      titleEn,
      slug,
      publisherId,
      categoryId,
      frequency,
      description,
      coverImage,
      editor,
      editorialMessage,
      language,
      themeColor,
      adminUserId,
      isSubscribable,
      singleIssuePrice,
      monthlySubscriptionPrice,
      annualSubscriptionPrice,
      tags,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: 'সাময়িকীর নাম আবশ্যক' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ success: false, error: 'ক্যাটাগরি নির্বাচন আবশ্যক' }, { status: 400 });
    }

    // Call workspace initialization transaction engine
    const magazine = await initializeMagazineWorkspace(
      {
        title,
        titleEn,
        slug,
        publisherId: publisherId || null,
        categoryId,
        frequency: frequency || 'MONTHLY',
        description: description || 'ইসলামিক গবেষণা ও মননশীল সাময়িকী',
        coverImage,
        editor,
        editorialMessage,
        language: language || 'bn',
        themeColor: themeColor || '#c59b27',
        adminUserId: adminUserId || user.id,
        isSubscribable: Boolean(isSubscribable),
        singleIssuePrice: singleIssuePrice ? Number(singleIssuePrice) : 0,
        monthlySubscriptionPrice: monthlySubscriptionPrice ? Number(monthlySubscriptionPrice) : 0,
        annualSubscriptionPrice: annualSubscriptionPrice ? Number(annualSubscriptionPrice) : 0,
        tags,
      },
      user.id,
      user.name || user.email
    );

    return NextResponse.json({
      success: true,
      message: 'নতুন সাময়িকী ও স্বতন্ত্র ওয়ার্কস্পেস সফলভাবে জেনারেট হয়েছে!',
      magazine,
      workspaceUrl: `/admin/publishing/workspaces/${magazine.id}`,
    });
  } catch (error: any) {
    console.error('Error in initializeMagazineWorkspace:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'ওয়ার্কস্পেস তৈরিতে ব্যর্থতা' },
      { status: 500 }
    );
  }
}

