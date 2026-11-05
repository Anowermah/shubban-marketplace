import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { verifyMagazineAccess } from '@/lib/services/publishingService';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify tenant access
    const auth = await verifyMagazineAccess(id, user);
    if (!auth.authorized) {
      return NextResponse.json({ success: false, error: 'Forbidden: No access to this magazine workspace' }, { status: 403 });
    }

    const [magazine, issues, articles, files, members, settings, plans, rights, schedule] = await Promise.all([
      prisma.magazine.findUnique({
        where: { id },
        include: {
          publisher: true,
          category: true,
        },
      }),
      prisma.publicationIssue.findMany({
        where: { magazineId: id },
        orderBy: { publicationDate: 'desc' },
        take: 50,
      }),
      prisma.article.findMany({
        where: { magazineId: id },
        orderBy: { publishedAt: 'desc' },
        take: 50,
        include: {
          author: { select: { id: true, name: true, photoUrl: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.publicationFile.findMany({
        where: { magazineId: id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.publicationMember.findMany({
        where: { magazineId: id },
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        },
      }),
      prisma.magazineSetting.findMany({
        where: { magazineId: id },
      }),
      prisma.publicationSubscriptionPlan.findMany({
        where: { magazineId: id },
        orderBy: { durationMonths: 'asc' },
      }),
      prisma.publicationRights.findFirst({
        where: { magazineId: id },
      }),
      prisma.publicationSchedule.findUnique({
        where: { magazineId: id },
      }),
    ]);

    if (!magazine) {
      return NextResponse.json({ success: false, error: 'ওয়ার্কস্পেস পাওয়া যায়নি' }, { status: 404 });
    }

    // Convert settings array to key-value map
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      success: true,
      auth,
      workspace: {
        magazine,
        schedule,
        settings: settingsMap,
        issues,
        articles,
        files,
        members,
        plans,
        rights,
        stats: {
          totalIssues: issues.length,
          totalArticles: articles.length,
          totalFiles: files.length,
          totalMembers: members.length,
          totalSubscribers: magazine.totalSubscribers,
          totalRevenue: magazine.totalRevenue,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const auth = await verifyMagazineAccess(id, user);
    if (!auth.authorized || (!auth.isSuperAdmin && auth.role !== 'PUBLICATION_ADMIN' && auth.role !== 'PUBLISHER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const existing = await prisma.magazine.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'সাময়িকী পাওয়া যায়নি' }, { status: 404 });
    }

    const updated = await prisma.magazine.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        titleEn: body.titleEn ?? existing.titleEn,
        slug: body.slug ?? existing.slug,
        frequency: body.frequency ?? existing.frequency,
        description: body.description ?? existing.description,
        coverImage: body.coverImage ?? existing.coverImage,
        logoUrl: body.logoUrl ?? existing.logoUrl,
        bannerUrl: body.bannerUrl ?? existing.bannerUrl,
        themeColor: body.themeColor ?? existing.themeColor,
        editor: body.editor ?? existing.editor,
        editorialMessage: body.editorialMessage ?? existing.editorialMessage,
        language: body.language ?? existing.language,
        tags: body.tags ?? existing.tags,
        seoTitle: body.seoTitle ?? existing.seoTitle,
        metaDescription: body.metaDescription ?? existing.metaDescription,
        publisherId: body.publisherId !== undefined ? body.publisherId : existing.publisherId,
        categoryId: body.categoryId ?? existing.categoryId,
        isSubscribable: body.isSubscribable !== undefined ? Boolean(body.isSubscribable) : existing.isSubscribable,
        singleIssuePrice: body.singleIssuePrice !== undefined ? Number(body.singleIssuePrice) : existing.singleIssuePrice,
        monthlySubscriptionPrice: body.monthlySubscriptionPrice !== undefined ? Number(body.monthlySubscriptionPrice) : existing.monthlySubscriptionPrice,
        annualSubscriptionPrice: body.annualSubscriptionPrice !== undefined ? Number(body.annualSubscriptionPrice) : existing.annualSubscriptionPrice,
        status: body.status ?? existing.status,
      },
    });

    // Handle workspace settings update if provided
    if (body.settings && typeof body.settings === 'object') {
      for (const [key, value] of Object.entries(body.settings)) {
        await prisma.magazineSetting.upsert({
          where: { magazineId_key: { magazineId: id, key } },
          create: { magazineId: id, key, value: String(value) },
          update: { value: String(value) },
        });
      }
    }

    // Record audit log
    await prisma.publicationAuditLog.create({
      data: {
        magazineId: id,
        userId: user.id,
        userName: user.name || user.email,
        action: 'UPDATE',
        targetType: 'MAGAZINE',
        targetId: id,
        details: JSON.stringify({ updatedFields: Object.keys(body) }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'ওয়ার্কস্পেস সফলভাবে আপডেট হয়েছে',
      magazine: updated,
    });
  } catch (error: any) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

